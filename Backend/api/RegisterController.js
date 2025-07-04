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

      // ตรวจสอบ email ซ้ำ
      const exist = await processRepo.findOneBy({ Email: email });
      if (exist) {
        return res.status(400).json({ success: false, data: null, message: 'Email นี้ถูกใช้ไปแล้ว' });
      }

      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // สร้าง user ก่อน เพื่อให้ได้ user.id
      const user = userRepo.create({
        id: uuidv4(),
        User_name,
        department,
        position
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
      res.status(500).json({ success: false, data: null, message: err.message });
    }
  });

  return router;
};
// เหตุผล: ต้องสร้าง user ก่อนเพื่อให้ได้ user.id แล้วจึงนำ user.id ไปใส่ Repid ใน process_check และบันทึก Token พร้อมกัน เพื่อให้ข้อมูลสัมพันธ์กันและปลอดภัย