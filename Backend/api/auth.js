const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = (AppDataSource) => {
  const router = express.Router();

  // สมัครสมาชิก
  router.post('/register', async (req, res) => {
    try {
      const { User_name, position, department, Email, Password } = req.body;
      const userRepo = AppDataSource.getRepository('User');
      const processRepo = AppDataSource.getRepository('ProcessCheck');

      // ตรวจสอบ email ซ้ำ
      const exist = await processRepo.findOneBy({ Email });
      if (exist) {
        return res.status(400).json({ error: 'Email นี้ถูกใช้ไปแล้ว' });
      }

      // 1. สร้าง User ก่อน เพื่อให้ได้ User_id
      const user = userRepo.create({ User_name, position, department });
      await userRepo.save(user);

      // 2. hash password
      const hashedPassword = await bcrypt.hash(Password, 10);

      // 3. สร้าง ProcessCheck โดยเก็บ Email, Password, และ User_id
      const processCheck = processRepo.create({ Email, Password: hashedPassword, User_id: user.User_id });
      await processRepo.save(processCheck);

      // 4. สร้าง JWT
      const token = jwt.sign({ userId: user.User_id, email: Email }, 'your_secret_key', { expiresIn: '1h' });

      // 5. อัปเดต token ใน ProcessCheck (optional)
      processCheck.Token = token;
      await processRepo.save(processCheck);

      res.json({ token });
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

      // ดึง role (หรือกำหนด default)
      const role = processUser.Role || 'employee';

      // ดึงข้อมูล user เพิ่มเติม
      const userProfile = await userRepo.findOneBy({ User_name: processUser.User_name });

      // สร้าง JWT
      const token = jwt.sign({ userId: processUser.id, email: processUser.Email, role }, 'your_secret_key', { expiresIn: '1h' });

      res.json({
        token,
        role,
        userId: processUser.id,
        full_name: userProfile ? userProfile.User_name : '',
        department: userProfile ? userProfile.department : '',
        position: userProfile ? userProfile.position : '',
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: สมัครสมาชิก
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               User_name:
 *                 type: string
 *               position:
 *                 type: string
 *               department:
 *                 type: string
 *               Email:
 *                 type: string
 *               Password:
 *                 type: string
 *     responses:
 *       200:
 *         description: สมัครสมาชิกสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 */
/**
 * @swagger
 * /api/admin/register:
 *   post:
 *     summary: สมัครแอดมิน
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               admin_name:
 *                 type: string
 *               Email:
 *                 type: string
 *               Password:
 *                 type: string
 *     responses:
 *       200:
 *         description: สมัครแอดมินสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/admin/register', async (req, res) => {
  try {
    const { admin_name, Email, Password } = req.body;
    const adminRepo = AppDataSource.getRepository('admin');
    const processRepo = AppDataSource.getRepository('ProcessCheck');

    // ตรวจสอบ email ซ้ำ
    const exist = await processRepo.findOneBy({ Email });
    if (exist) {
      return res.status(400).json({ error: 'Email นี้ถูกใช้ไปแล้ว' });
    }

    // เพิ่ม admin
    const admin = adminRepo.create({ admin_name, Email });
    await adminRepo.save(admin);

    // hash password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // สุ่ม token
    const token = crypto.randomBytes(32).toString('hex');

    // เพิ่มใน process_check
    const processCheck = processRepo.create({
      Email,
      Password: hashedPassword,
      Token: token,
      Role: 'admin'
    });
    await processRepo.save(processCheck);

    res.json({ message: 'สมัครแอดมินสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

  /**
 * @swagger
 * /api/admin/list:
 *   get:
 *     summary: ดึงรายชื่อแอดมินทั้งหมด
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: รายชื่อแอดมิน
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   admin_id:
 *                     type: integer
 *                   admin_name:
 *                     type: string
 *                   Email:
 *                     type: string
 */
router.get('/admin/list', async (req, res) => {
    try {
      const adminRepo = AppDataSource.getRepository('admin');
      const admins = await adminRepo.find();
      res.json(admins);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
 * @swagger
 * /api/admin/{id}:
 *   delete:
 *     summary: ลบแอดมิน
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ลบสำเร็จ
 */
router.delete('/admin/:id', async (req, res) => {
    try {
      const adminRepo = AppDataSource.getRepository('admin');
      await adminRepo.delete(req.params.id);
      res.json({ message: 'ลบแอดมินสำเร็จ' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  return router;
}; 