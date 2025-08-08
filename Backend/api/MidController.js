const express = require('express');
const { BaseController, sendSuccess, sendError, sendNotFound, sendValidationError } = require('../utils');

module.exports = (AppDataSource) => {
  const router = express.Router();
  // Create base controller instances
  const userController = new BaseController('User');
  const adminController = new BaseController('Admin');

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
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       User_name:
   *                         type: string
   *                       department:
   *                         type: string
   *                       position:
   *                         type: string
   *                 message:
   *                   type: string
   */
  router.get('/users', async (req, res) => {
    try {
      const users = await userController.findAll(AppDataSource);
      sendSuccess(res, users, 'ดึงข้อมูล user สำเร็จ');
    } catch (err) {
      sendError(res, err.message, 500);
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
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     User_name:
   *                       type: string
   *                     department:
   *                       type: string
   *                     position:
   *                       type: string
   *                 message:
   *                   type: string
   */
  router.post('/users', async (req, res) => {
    try {
      const { User_name, department, position } = req.body;
      const user = await userController.create(AppDataSource, { User_name, department, position });
      sendSuccess(res, user, 'สร้าง user สำเร็จ', 201);
    } catch (err) {
      sendError(res, err.message, 500);
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
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                 message:
   *                   type: string
   *       404:
   *         description: ไม่พบ user
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                 message:
   *                   type: string
   */
  router.delete('/users/:id', async (req, res) => {
    try {
      await userController.delete(AppDataSource, req.params.id);
      sendSuccess(res, {}, 'User deleted');
    } catch (err) {
      if (err.message === 'Record not found') {
        return sendNotFound(res, 'User not found');
      }
      sendError(res, err.message, 500);
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
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       admin_name:
   *                         type: string
   *                       department:
   *                         type: string
   *                       position:
   *                         type: string
   *                 message:
   *                   type: string
   */
  router.get('/admins', async (req, res) => {
    try {
      const admins = await adminController.findAll(AppDataSource);
      sendSuccess(res, admins, 'ดึงข้อมูล admin สำเร็จ');
    } catch (err) {
      sendError(res, err.message, 500);
    }
  });

  /**
   * @swagger
   * /api/admins/register:
   *   post:
   *     summary: สร้างแอดมินใหม่
   *     tags: [Admins]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               admin_name:
   *                 type: string
   *               department:
   *                 type: string
   *               position:
   *                 type: string
   *     responses:
   *       201:
   *         description: สร้างแอดมินสำเร็จ
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                 message:
   *                   type: string
   */
  const { v4: uuidv4 } = require('uuid');
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  const config = require('../config');

  router.post('/admins/register', async (req, res) => {
    try {
      const { email, password, admin_name, department, position } = req.body;
      const adminRepo = AppDataSource.getRepository('Admin');
      const processRepo = AppDataSource.getRepository('ProcessCheck');

      // ตรวจสอบ email ซ้ำ
      const exist = await processRepo.findOneBy({ Email: email });
      if (exist) {
        return sendValidationError(res, 'Email นี้ถูกใช้ไปแล้ว');
      }

      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // สร้าง admin ก่อน เพื่อให้ได้ id
      const admin = adminRepo.create({
        id: uuidv4(),
        admin_name,
        department,
        position
      });
      await adminRepo.save(admin);

      // สร้าง JWT Token
      const token = jwt.sign(
        { adminId: admin.id, email: email },
        config.server.jwtSecret,
        { expiresIn: config.server.jwtExpiresIn }
      );

      // สร้าง process_check พร้อม Token, Repid, role=admin
      const processCheck = processRepo.create({
        id: uuidv4(),
        Email: email,
        Password: hashedPassword,
        Token: token,
        Repid: admin.id,
        Role: 'admin',
        avatar_url: null
      });
      await processRepo.save(processCheck);

      sendSuccess(res, { ...admin, token, repid: admin.id }, 'สร้างแอดมินสำเร็จ', 201);
    } catch (err) {
      sendError(res, err.message, 500);
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
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                 message:
   *                   type: string
   *       404:
   *         description: ไม่พบ admin
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                 message:
   *                   type: string
   */
  router.delete('/admins/:id', async (req, res) => {
    try {
      await adminController.delete(AppDataSource, req.params.id);
      sendSuccess(res, {}, 'Admin deleted');
    } catch (err) {
      if (err.message === 'Record not found') {
        return sendNotFound(res, 'Admin not found');
      }
      sendError(res, err.message, 500);
    }
  });

  return router;
};