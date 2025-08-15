require('dotenv').config();
require('reflect-metadata');
const { DataSource } = require('typeorm');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cors = require('cors');
const path = require('path');
const leaveQuota = require('./EnityTable/leaveQuota.js');
const fs = require('fs');
const { createServer } = require('http');
const { Server } = require('socket.io');
const config = require('./config');


const app = express();
const port = config.server.port;

// Create HTTP server for Socket.io
const server = createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: config.cors.origins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join user to their personal room
  socket.on('joinRoom', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room: user_${userId}`);
  });
  
  // Handle admin joining admin room
  socket.on('joinAdminRoom', () => {
    socket.join('admin_room');
    console.log('Admin joined admin room');
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available globally
global.io = io;

// TypeORM DataSource config
const AppDataSource = new DataSource({
  type: config.database.type,
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: true, // dev only! จะสร้าง/อัปเดต table อัตโนมัติ
  logging: false,
  entities: [
    require('./EnityTable/user.js'),
    require('./EnityTable/ProcessCheck.entity.js'),
    require('./EnityTable/admin.js'),
    require('./EnityTable/superadmin.js'),
    require('./EnityTable/leaveRequest.entity.js'),
    require('./EnityTable/position.js'),
    require('./EnityTable/leaveType.js'),
    require('./EnityTable/department.js'),
    require('./EnityTable/leaveQuota.js'),
    require('./EnityTable/announcements.js'),
    require('./EnityTable/customHoliday.js'),
    require('./EnityTable/lineUser.js')
  ],
});

AppDataSource.initialize()
  .then(() => {
    console.log('TypeORM Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });

app.use(bodyParser.json());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      ...config.cors.origins,
      // Allow all ngrok domains
      /^https:\/\/.*\.ngrok-free\.app$/,
      /^https:\/\/.*\.ngrok\.io$/,
      /^https:\/\/.*\.loca\.lt$/,
      // Allow common local dev hosts on any port (http)
      /^http:\/\/localhost:\d{2,5}$/,
      /^http:\/\/127\.0\.0\.1:\d{2,5}$/,
      // Allow local network IPs on any port (e.g., 192.168.x.x:5173)
      /^http:\/\/192\.168\.[0-9]{1,3}\.[0-9]{1,3}:\d{2,5}$/
    ];
    
    // Check if the origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // if you need to send cookies/auth headers
}));

// Ensure uploads directories exist
const uploadsDir = config.getUploadsPath();
const announcementsDir = config.getAnnouncementsUploadPath();
const leaveUploadsDir = config.getLeaveUploadsPath();

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(announcementsDir)) {
  fs.mkdirSync(announcementsDir, { recursive: true });
}
if (!fs.existsSync(leaveUploadsDir)) {
  fs.mkdirSync(leaveUploadsDir, { recursive: true });
}

// Serve static files for uploaded images
app.use('/uploads', express.static(uploadsDir));
// Serve static files for leave request attachments stored under public/leave-uploads
app.use('/leave-uploads', express.static(config.getLeaveUploadsPath()));

// Serve leave uploads with authentication
app.use('/leave-uploads', (req, res, next) => {
  // Check if user is authenticated
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, config.server.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}, express.static(leaveUploadsDir));

app.get('/', (req, res) => {
  res.send('Hello from Express + TypeORM!');
});

// ตัวอย่าง route ดึงข้อมูลจากฐานข้อมูล
app.get('/users', async (req, res) => {
  try {
    const userRepo = AppDataSource.getRepository('User');
    const users = await userRepo.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// สมัครสมาชิก
app.post('/register', async (req, res) => {
  try {
    const { User_name, position, department, Email, Password } = req.body;
    const userRepo = AppDataSource.getRepository('User');
    const processRepo = AppDataSource.getRepository('ProcessCheck');

    // ตรวจสอบ email ซ้ำ
    const exist = await processRepo.findOneBy({ Email });
    if (exist) {
      return res.status(400).json({ error: 'Email นี้ถูกใช้ไปแล้ว' });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // สร้าง ProcessCheck
    const processCheck = processRepo.create({ Email, Password: hashedPassword });
    await processRepo.save(processCheck);

    // สร้าง User
    const user = userRepo.create({ User_name, position, department });
    await userRepo.save(user);

    // สร้าง JWT
            const token = jwt.sign(
              { userId: user.id, email: Email },
              config.server.jwtSecret,
              { expiresIn: config.server.jwtExpiresIn }
            );

    // อัปเดต token ใน ProcessCheck (optional)
    processCheck.Token = token;
    await processRepo.save(processCheck);

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Swagger config
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: config.app.title,
      version: config.app.version,
    },
    tags: [ 
      {
        name: 'Departments',
        description: 'จัดการข้อมูล Departments'
      },
      {
        name: 'LeaveQuota',
        description: 'จัดการโควต้าการลาตามตำแหน่ง'
      },
      {
        name: 'Users',
        description: 'จัดการข้อมูล User'
      },
      {
        name: 'Admins',
        description: 'จัดการข้อมูล Admin'
      },
      {
        name: 'Employees',
        description: 'จัดการข้อมูล Employees'
      },
      {
        name: 'Positions',
        description: 'จัดการข้อมูล Positions'
      },
      {
        name: 'Profile',
        description: 'จัดการข้อมูล Profile'
      },
      {
        name: 'LeaveTypes',
        description: 'จัดการข้อมูลประเภทการลา'
      }
    ]
  },
  apis: ['./api/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Initialize centralized routes
const initializeRoutes = require('./routes');
const routes = initializeRoutes(AppDataSource);
app.use('/api', routes);

// Make AppDataSource globally available
global.AppDataSource = AppDataSource;

const typeLeaveController = require('./api/TpyeLeaveController')(AppDataSource);
app.use('/api', typeLeaveController);

// เชื่อมต่อ MidController เท่านั้น
const midController = require('./api/MidController')(AppDataSource);
app.use('/api', midController);

const registerController = require('./api/RegisterController')(AppDataSource);
app.use('/api', registerController);

const loginController = require('./api/LoginController')(AppDataSource);
app.use('/api', loginController);

const profileController = require('./api/ProfileController')(AppDataSource);
app.use('/api', profileController);

const employeeController = require('./api/EmployeeController')(AppDataSource);
app.use('/api', employeeController);

const leaveRequestController = require('./api/LeaveRequestController')(AppDataSource);
app.use('/api/leave-request', leaveRequestController);

const leaveHistoryController = require('./api/LeaveHistoryController')(AppDataSource);
app.use('/api/leave-history', leaveHistoryController);

const dashboardIndexController = require('./api/DashboardIndexController')(AppDataSource);
app.use('/api', dashboardIndexController);

const notificationBellController = require('./api/NotificationBellController')(AppDataSource);
app.use('/api', notificationBellController);

const leaveQuotaController = require('./api/LeaveQuotaController')(AppDataSource);
app.use('/api/leave-quota', leaveQuotaController);
console.log('LeaveQuotaController registered');

const superAdminController = require('./api/SuperAdminController')(AppDataSource);
app.use('/api', superAdminController);

const announcementsController = require('./api/AnnouncementsController')(AppDataSource);
app.use('/api', announcementsController);

const customHolidayController = require('./api/CustomHolidayController')(AppDataSource);
app.use('/api', customHolidayController);

// Line OA Routes
const LineOAController = require('./api/LineOAController');
const LineRichMenuController = require('./api/LineRichMenuController');

// Line OA Webhook endpoint
app.post('/api/line/webhook', async (req, res) => {
  try {
    const { events } = req.body;
    
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        // จัดการข้อความที่ได้รับจาก Line
        const { replyToken } = event;
        const { text } = event.message;
        const { userId } = event.source;
        
        // ส่งข้อความตอบกลับ
        await LineOAController.sendMessage(userId, `ได้รับข้อความ: ${text}`);
      }
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Line webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Line OA API Routes
app.post('/api/line/send-message', async (req, res) => {
  try {
    const { userId, message } = req.body;
    const result = await LineOAController.sendMessage(userId, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/line/send-leave-approval', async (req, res) => {
  try {
    const { userId, leaveData } = req.body;
    const result = await LineOAController.sendLeaveApprovalNotification(userId, leaveData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/line/send-leave-rejection', async (req, res) => {
  try {
    const { userId, leaveData, reason } = req.body;
    const result = await LineOAController.sendLeaveRejectionNotification(userId, leaveData, reason);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/line/send-new-leave-request', async (req, res) => {
  try {
    const { userId, leaveData } = req.body;
    const result = await LineOAController.sendNewLeaveRequestNotification(userId, leaveData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/line/send-announcement', async (req, res) => {
  try {
    const { userId, announcement } = req.body;
    const result = await LineOAController.sendAnnouncementNotification(userId, announcement);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/line/check-connection', async (req, res) => {
  try {
    const result = await LineOAController.checkConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/line/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await LineOAController.getProfile(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rich Menu Routes
app.post('/api/line/rich-menu/create', async (req, res) => {
  try {
    const { baseUrl } = req.body;
    const result = await LineRichMenuController.createGridRichMenu(baseUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/line/rich-menu/simple', async (req, res) => {
  try {
    const { baseUrl } = req.body;
    const result = await LineRichMenuController.createSimpleRichMenu(baseUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/line/rich-menu/set-default/:richMenuId', async (req, res) => {
  try {
    const { richMenuId } = req.params;
    const result = await LineRichMenuController.setDefaultRichMenu(richMenuId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/line/rich-menu/list', async (req, res) => {
  try {
    const result = await LineRichMenuController.getRichMenuList();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/line/rich-menu/:richMenuId', async (req, res) => {
  try {
    const { richMenuId } = req.params;
    const result = await LineRichMenuController.deleteRichMenu(richMenuId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 