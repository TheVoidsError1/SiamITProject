const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = (AppDataSource) => {
  const router = express.Router();

  /**
   * @swagger
   * /api/admin/register:
   *   post:
   *     summary: Create admin
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
   *     summary: Get admin 
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
   *     summary: Delete admin
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

  /**
   * @swagger
   * /api/admin/login:
   *   post:
   *     summary: Admin login
   *     tags:
   *       - Admin
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               Email:
   *                 type: string
   *               Password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login success
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *                 role:
   *                   type: string
   *                 admin_name:
   *                   type: string
   */
  router.post('/admin/login', async (req, res) => {
    try {
      const { Email, Password } = req.body;
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const adminRepo = AppDataSource.getRepository('admin');
      const processUser = await processRepo.findOneBy({ Email });
      if (!processUser || processUser.Role !== 'admin') {
        return res.status(401).json({ error: 'ไม่พบผู้ใช้งานหรือไม่ใช่แอดมิน' });
      }
      const valid = await bcrypt.compare(Password, processUser.Password);
      if (!valid) return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
      const adminProfile = await adminRepo.findOneBy({ Email });
      const token = crypto.randomBytes(32).toString('hex');
      res.json({
        token,
        role: 'admin',
        admin_name: adminProfile ? adminProfile.admin_name : '',
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
