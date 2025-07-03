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
   *       201:
   *         description: admin created
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid input
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
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
        return res.status(400).json({ success: false, data: null, message: 'Email นี้ถูกใช้ไปแล้ว' });
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
        Role: 'admin',
        Repid: admin.admin_id
      });
      await processRepo.save(processCheck);

      res.status(201).json({
        success: true,
        data: { admin_id: admin.admin_id, admin_name: admin.admin_name, Email: admin.Email },
        message: 'สมัครแอดมินสำเร็จ'
      });
    } catch (err) {
      res.status(500).json({ success: false, data: null, message: err.message });
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
      res.json({
        success: true,
        data: admins,
        message: 'รายชื่อแอดมิน'
      });
    } catch (err) {
      res.status(500).json({ success: false, data: null, message: err.message });
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
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      
      // หา admin จาก admin_id
      const admin = await adminRepo.findOneBy({ admin_id: parseInt(req.params.id) });
      if (!admin) {
        return res.status(404).json({ success: false, data: null, message: 'ไม่พบแอดมินที่ต้องการลบ' });
      }
      
      // ตรวจสอบข้อมูลในตาราง process_check
      // ตรวจสอบว่า Repid ตรงกับ admin_id และ Role ตรงกับ 'admin'
      const processCheck = await processRepo.findOneBy({ 
        Repid: admin.admin_id,
        Role: 'admin'
      });
      
      if (!processCheck) {
        return res.status(404).json({ success: false, data: null, message: 'ไม่พบข้อมูลการเข้าสู่ระบบของแอดมินนี้' });
      }
      
      // ลบข้อมูลในตาราง process_check ตาม Repid และ Role
      await processRepo.delete({ 
        Repid: admin.admin_id,
        Role: 'admin'
      });
      
      // ลบ admin จากตาราง admin
      await adminRepo.delete(req.params.id);
      
      res.json({ success: true, data: null, message: 'ลบแอดมินสำเร็จ' });
    } catch (err) {
      res.status(500).json({ success: false, data: null, message: err.message });
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
        return res.status(401).json({ success: false, data: null, message: 'ไม่พบผู้ใช้งานหรือไม่ใช่แอดมิน' });
      }
      const valid = await bcrypt.compare(Password, processUser.Password);
      if (!valid) return res.status(401).json({ success: false, data: null, message: 'รหัสผ่านไม่ถูกต้อง' });
      const adminProfile = await adminRepo.findOneBy({ Email });
      const token = crypto.randomBytes(32).toString('hex');
      res.json({
        success: true,
        data: {
          token,
          role: 'admin',
          admin_name: adminProfile ? adminProfile.admin_name : ''
        },
        message: 'เข้าสู่ระบบสำเร็จ'
      });
    } catch (err) {
      res.status(500).json({ success: false, data: null, message: err.message });
    }
  });

  /**
   * @swagger
   * /api/admin/:id:
   *   get:
   *     summary: Get admin by ID
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
   *         description: Admin information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 admin_id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 email:
   *                   type: string
   */
  router.get('/admin/:id', async (req, res) => {
    try {
      const adminRepo = AppDataSource.getRepository('admin');
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const admin = await adminRepo.findOneBy({ admin_id: parseInt(req.params.id) });
      if (!admin) {
        return res.status(404).json({ success: false, data: null, message: 'ไม่พบแอดมิน' });
      }
      const processCheck = await processRepo.findOneBy({ Repid: admin.admin_id });
      res.json({
        success: true,
        data: {
          name: admin.admin_name,
          admin_id: admin.admin_id,
          admin_name: admin.admin_name,
          email: processCheck ? processCheck.Email : null,
          processCheckId: processCheck ? processCheck.id : null
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, data: null, message: err.message });
    }
  });

  return router;
};
