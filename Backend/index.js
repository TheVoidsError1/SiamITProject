require('reflect-metadata');
const { DataSource } = require('typeorm');
const express = require('express');

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
    require('./EntityTable/user.entity'),
    require('./EntityTable/ProcessCheck.entity.js'),
    require('./EntityTable/admin.entity.js')
],
});

AppDataSource.initialize()
  .then(() => {
    console.log('TypeORM Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });

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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 