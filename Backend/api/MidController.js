const express = require('express');

module.exports = (AppDataSource) => {
  const router = express.Router();

  /**
   * @swagger
   * tags:
   *   name: Users
   *   description: จัดการข้อมูล User
   */
  /**
   * @swagger
   * /users:
   *   get:
   *     summary: แสดง user ทั้งหมด
   *     tags: [Users]
   *     responses:
   *       200:
   *         description: รายการ user
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   User_name:
   *                     type: string
   *                   department:
   *                     type: string
   *                   position:
   *                     type: string
   */
  router.get('/users', async (req, res) => {
    try {
      const userRepo = AppDataSource.getRepository('User');
      const users = await userRepo.find();
      res.json({ status: 'success', message: 'Fetched users', data: users });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  /**
   * @swagger
   * /users:
   *   post:
   *     summary: สร้าง user ใหม่
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               User_name:
   *                 type: string
   *               department:
   *                 type: string
   *               position:
   *                 type: string
   *     responses:
   *       201:
   *         description: สร้าง user สำเร็จ
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 User_name:
   *                   type: string
   *                 department:
   *                   type: string
   *                 position:
   *                   type: string
   */
  router.post('/users', async (req, res) => {
    try {
      const { User_name, department, position } = req.body;
      const userRepo = AppDataSource.getRepository('User');
      const user = userRepo.create({ User_name, department, position });
      await userRepo.save(user);
      res.status(201).json({ status: 'success', message: 'User created', data: user });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  /**
   * @swagger
   * /users/{id}:
   *   delete:
   *     summary: ลบ user ตาม id
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: รหัส user
   *     responses:
   *       200:
   *         description: ลบ user สำเร็จ
   *       404:
   *         description: ไม่พบ user
   */
  router.delete('/users/:id', async (req, res) => {
    try {
      const userRepo = AppDataSource.getRepository('User');
      const result = await userRepo.delete(req.params.id);
      if (result.affected === 0) {
        return res.status(404).json({ status: 'error', message: 'User not found' });
      }
      res.json({ status: 'success', message: 'User deleted' });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  /**
   * @swagger
   * tags:
   *   name: Admins
   *   description: จัดการข้อมูล Admin
   */
  /**
   * @swagger
   * /admins:
   *   get:
   *     summary: แสดง admin ทั้งหมด
   *     tags: [Admins]
   *     responses:
   *       200:
   *         description: รายการ admin
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   admin_name:
   *                     type: string
   *                   department:
   *                     type: string
   *                   position:
   *                     type: string
   */
  router.get('/admins', async (req, res) => {
    try {
      const adminRepo = AppDataSource.getRepository('admin');
      const admins = await adminRepo.find();
      res.json({ status: 'success', message: 'Fetched admins', data: admins });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  /**
   * @swagger
   * /admins:
   *   post:
   *     summary: สร้าง admin ใหม่
   *     tags: [Admins]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               admin_name:
   *                 type: string
   *               department:
   *                 type: string
   *               position:
   *                 type: string
   *     responses:
   *       201:
   *         description: สร้าง admin สำเร็จ
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 admin_name:
   *                   type: string
   *                 department:
   *                   type: string
   *                 position:
   *                   type: string
   */
  router.post('/admins', async (req, res) => {
    try {
      const { admin_name, department, position } = req.body;
      const adminRepo = AppDataSource.getRepository('admin');
      const admin = adminRepo.create({ admin_name, department, position });
      await adminRepo.save(admin);
      res.status(201).json({ status: 'success', message: 'Admin created', data: admin });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  /**
   * @swagger
   * /admins/{id}:
   *   delete:
   *     summary: ลบ admin ตาม id
   *     tags: [Admins]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: รหัส admin
   *     responses:
   *       200:
   *         description: ลบ admin สำเร็จ
   *       404:
   *         description: ไม่พบ admin
   */
  router.delete('/admins/:id', async (req, res) => {
    try {
      const adminRepo = AppDataSource.getRepository('admin');
      const result = await adminRepo.delete(req.params.id);
      if (result.affected === 0) {
        return res.status(404).json({ status: 'error', message: 'Admin not found' });
      }
      res.json({ status: 'success', message: 'Admin deleted' });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  return router;
};