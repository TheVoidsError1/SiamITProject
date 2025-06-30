require('reflect-metadata');
const { DataSource } = require('typeorm');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import modular user routes
const { router: userRoutes, setController: setUserController } = require('./api/userRoutes');

const app = express();
const port = 3001;

// TypeORM DataSource config
const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password', // ใส่รหัสผ่านของคุณ
  database: 'siamitleave',
  synchronize: true, // dev only! จะสร้าง/อัปเดต table อัตโนมัติ
  logging: false,
  entities: [
    require('./EntityTable/user.entity'),
    require('./EntityTable/ProcessCheck.entity.js'),
    require('./EntityTable/admin.entity.js')
],
});

app.use(bodyParser.json());

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

AppDataSource.initialize()
  .then(() => {
    console.log('TypeORM Data Source has been initialized!');
    // Register modular user controller
    setUserController(AppDataSource);
    app.use('/api/users', userRoutes);

    // Register auth routes
    const authRoutes = require('./api/auth')(AppDataSource);
    app.use('/api', authRoutes);

    app.get('/', (req, res) => {
      res.send('Hello from Express + TypeORM!');
    });

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  }); 