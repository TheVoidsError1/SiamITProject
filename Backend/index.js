require('reflect-metadata');
const { DataSource } = require('typeorm');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cors = require('cors');

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
    require('./EnityTable/user.entity.js'),
    require('./EnityTable/ProcessCheck.entity.js'),
    require('./EnityTable/admin.entity.js'),
    require('./EnityTable/leaveRequest.entity.js')
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
  'http://192.168.50.64:8081',
  'http://localhost:3001'
];

app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (like mobile apps, curl, etc.)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.get('/', (req, res) => {
  res.send('Hello from Express + TypeORM!');
});

// ตัวอย่าง route ดึงข้อมูลจากฐานข้อมูล
app.get('/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
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
    const token = jwt.sign({ userId: user.User_id, email: Email }, 'your_secret_key', { expiresIn: '1h' });

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
  },
  apis: ['./api/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// เชื่อมต่อ route /register
const authRoutes = require('./api/auth')(AppDataSource);
app.use('/api', authRoutes);

const adminController = require('./api/adminController')(AppDataSource);
app.use('/api', adminController);

const leaveRequestController = require('./api/leaveRequestController')(AppDataSource);
app.use('/api', leaveRequestController);

const adminDashboardController = require('./api/AdminDashboardController')(AppDataSource);
app.use('/api', adminDashboardController);

const { router: userRoutes, setController: setUserController } = require('./api/userRoutes');
setUserController(AppDataSource);
app.use('/api/users', userRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 