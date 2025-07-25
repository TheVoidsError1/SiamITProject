const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (AppDataSource) => {
  const router = require('express').Router();

  router.post('/register', async (req, res) => {
    try {
      const { User_name, department, position, email, password } = req.body;
      const userRepo = AppDataSource.getRepository('User');
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const departmentRepo = AppDataSource.getRepository('Department');
      const positionRepo = AppDataSource.getRepository('Position');

      // ตรวจสอบชื่อซ้ำ
      const nameExist = await userRepo.findOneBy({ User_name });
      if (nameExist) {
        return res.status(400).json({ success: false, data: null, message: 'ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว' });
      }

      // ตรวจสอบ email ซ้ำ
      const exist = await processRepo.findOneBy({ Email: email });
      if (exist) {
        return res.status(400).json({ success: false, data: null, message: 'Email นี้ถูกใช้ไปแล้ว' });
      }

      // แปลง department id เป็น entity
      let departmentId = null;
      if (department) {
        const deptEntity = await departmentRepo.findOne({ where: { id: department } });
        if (!deptEntity) {
          return res.status(400).json({ success: false, data: null, message: 'Department not found' });
        }
        departmentId = deptEntity.id;
      }

      // แปลง position id เป็น entity
      let positionId = null;
      if (position) {
        const posEntity = await positionRepo.findOne({ where: { id: position } });
        if (!posEntity) {
          return res.status(400).json({ success: false, data: null, message: 'Position not found' });
        }
        positionId = posEntity.id;
      }

      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // สร้าง user ก่อน เพื่อให้ได้ user.id
      const user = userRepo.create({
        id: uuidv4(),
        User_name,
        department: departmentId,
        position: positionId
      });
      await userRepo.save(user);

      // สร้าง JWT Token
      const token = jwt.sign(
        { userId: user.id, email: email },
        'your_secret_key', // เปลี่ยนเป็น secret จริงใน production
        { expiresIn: '1h' }
      );

      // สร้าง process_check พร้อม Token และ Repid
      const processCheck = processRepo.create({
        id: uuidv4(),
        Email: email,
        Password: hashedPassword,
        Token: token,
        Repid: user.id,
        Role: 'user',
        avatar_url: null
      });
      await processRepo.save(processCheck);

      res.status(201).json({
        success: true,
        data: { ...user, token, repid: user.id },
        message: 'Register successful'
      });
    } catch (err) {
      // Handle unique constraint errors
      if (err.code === 'ER_DUP_ENTRY' && err.message.includes('Email')) {
        return res.status(400).json({ success: false, data: null, message: 'Email นี้ถูกใช้ไปแล้ว' });
      }
      if (err.code === 'ER_DUP_ENTRY' && err.message.includes('User_name')) {
        return res.status(400).json({ success: false, data: null, message: 'ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว' });
      }
      res.status(500).json({ success: false, data: null, message: err.message });
    }
  });

  // ดึงข้อมูล department ทั้งหมด
  router.get('/departments', async (req, res) => {
    try {
      const departmentRepo = AppDataSource.getRepository('Department');
      const departments = await departmentRepo.find();
      res.json({ success: true, data: departments, message: 'ดึงข้อมูล department สำเร็จ' });
    } catch (err) {
      res.status(500).json({ success: false, data: null, message: err.message });
    }
  });

  // ดึงข้อมูล position ทั้งหมด
  router.get('/positions', async (req, res) => {
    try {
      const positionRepo = AppDataSource.getRepository('Position');
      const positions = await positionRepo.find();
      res.json({ success: true, data: positions, message: 'ดึงข้อมูล position สำเร็จ' });
    } catch (err) {
      res.status(500).json({ success: false, data: null, message: err.message });
    }
  });

  // เพิ่ม department
  router.post('/departments', async (req, res) => {
    try {
      const { department } = req.body;
      const departmentRepo = AppDataSource.getRepository('Department');
      const newDept = departmentRepo.create({ department_name_th: department });
      await departmentRepo.save(newDept);
      res.status(201).json({ success: true, data: newDept, message: 'เพิ่ม department สำเร็จ' });
    } catch (err) {
      res.status(500).json({ success: false, data: null, message: err.message });
    }
  });

  // เพิ่ม position
  router.post('/positions', async (req, res) => {
    try {
      const { position } = req.body;
      const positionRepo = AppDataSource.getRepository('Position');
      const newPos = positionRepo.create({ position_name_th: position });
      await positionRepo.save(newPos);
      res.status(201).json({ success: true, data: newPos, message: 'เพิ่ม position สำเร็จ' });
    } catch (err) {
      res.status(500).json({ success: false, data: null, message: err.message });
    }
  });

  return router;
};
// เหตุผล: ต้องสร้าง user ก่อนเพื่อให้ได้ user.id แล้วจึงนำ user.id ไปใส่ Repid ใน process_check และบันทึก Token พร้อมกัน เพื่อให้ข้อมูลสัมพันธ์กันและปลอดภัย