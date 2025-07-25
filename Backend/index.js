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


const app = express();
const port = 3001;

// TypeORM DataSource config
const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '', // ใส่รหัสผ่านของคุณ
  database: 'siamitleave',
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
    require('./EnityTable/customHoliday.js')
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

const allowedOrigins = [
  'http://localhost:8081',
  'http://192.168.50.64:8081',//test
  'http://192.168.50.125:8081',//test
  'http://192.168.50.90:8081',//yorch
  'http://192.168.50.54:8081',//kot
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'http://localhost:8001',
];

app.use(cors({
  origin: 'http://localhost:8081', // or use '*' for all origins (not recommended for production)
  credentials: true // if you need to send cookies/auth headers
}));

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
            const token = jwt.sign({ userId: user.id, email: Email }, 'your_secret_key', { expiresIn: '1h' });

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
      title: 'SiamITLeave API',
      version: '1.0.0',
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

// Register PositionController and DepartmentController
const positionController = require('./api/PositionController')(AppDataSource);
app.use('/api', positionController);

const departmentController = require('./api/DepartmentController')(AppDataSource);
app.use('/api', departmentController);

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

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 