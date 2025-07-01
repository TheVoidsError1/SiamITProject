const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = (AppDataSource) => {
  const router = express.Router();

  // สมัครสมาชิก
  router.post('/register', async (req, res) => {
    try {
      const { User_name, position, department, Email, Password, Role } = req.body;
      const userRepo = AppDataSource.getRepository('User');
      const processRepo = AppDataSource.getRepository('ProcessCheck');

      // ตรวจสอบ email ซ้ำ
      const exist = await processRepo.findOneBy({ Email });
      if (exist) {
        return res.status(400).json({ error: 'Email นี้ถูกใช้ไปแล้ว' });
      }

      // 1. สร้าง User ก่อน เพื่อให้ได้ User_id
      const user = userRepo.create({ 
        User_name, 
        position, 
        department,
        role: Role || 'user'  // เพิ่ม role ในตาราง users
      });
      await userRepo.save(user);

      // 2. hash password
      const hashedPassword = await bcrypt.hash(Password, 10);

      // 3. สร้าง ProcessCheck โดยเก็บ Email, Password, Role, และ Repid (User_id)
      const processCheck = processRepo.create({ 
        Email, 
        Password: hashedPassword, 
        Role: Role || 'user', 
        Repid: user.User_id  // ใช้ Repid เป็นตัวเชื่อมกับ User_id
      });
      await processRepo.save(processCheck);

      // 4. สร้าง JWT
      const token = jwt.sign({ userId: user.User_id, email: Email, role: Role || 'user' }, 'your_secret_key', { expiresIn: '1h' });

      // 5. อัปเดต token ใน ProcessCheck
      processCheck.Token = token;
      await processRepo.save(processCheck);

      res.json({ 
        token,
        userId: user.User_id,
        message: 'สมัครสมาชิกสำเร็จ'
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const { Email, Password } = req.body;
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const userRepo = AppDataSource.getRepository('User');
      const processUser = await processRepo.findOneBy({ Email });
      if (!processUser) return res.status(401).json({ error: 'ไม่พบผู้ใช้งาน' });

      // ตรวจสอบรหัสผ่าน
      const valid = await bcrypt.compare(Password, processUser.Password);
      if (!valid) return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });

      // ดึงข้อมูล user เพิ่มเติม โดยใช้ Repid เป็นตัวเชื่อม
      const userProfile = await userRepo.findOneBy({ User_id: processUser.Repid });
      if (!userProfile) return res.status(401).json({ error: 'ไม่พบข้อมูลผู้ใช้งาน' });

      // ดึง role จากตาราง users (หรือใช้จาก process_check เป็น fallback)
      const role = userProfile.role || processUser.Role || 'employee';

      // สร้าง JWT
      const token = jwt.sign({ userId: processUser.Repid, email: processUser.Email, role }, 'your_secret_key', { expiresIn: '1h' });

      res.json({
        token,
        role,
        userId: processUser.Repid,
        full_name: userProfile.User_name,
        department: userProfile.department,
        position: userProfile.position,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}; 