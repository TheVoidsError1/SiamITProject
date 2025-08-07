const express = require('express');
const { BaseController, sendSuccess, sendError, sendNotFound, sendValidationError } = require('../utils');

/**
 * @swagger
 * tags:
 *   name: LeaveQuota
 *   description: จัดการโควต้าการลาตามตำแหน่งและประเภทการลา
 */

/**
 * @swagger
 * /api/leave-quota:
 *   post:
 *     summary: สร้าง leave quota ใหม่
 *     tags: [LeaveQuota]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               positionId:
 *                 type: string
 *               leaveTypeId:
 *                 type: string
 *               quota:
 *                 type: integer
 *     responses:
 *       200:
 *         description: สร้าง leave quota สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *
 *   get:
 *     summary: ดึง leave quota ทั้งหมด
 *     tags: [LeaveQuota]
 *     responses:
 *       200:
 *         description: รายการ leave quota
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /api/leave-quota/position/{positionId}:
 *   get:
 *     summary: ดึง leave quota ทั้งหมดตาม positionId
 *     tags: [LeaveQuota]
 *     parameters:
 *       - in: path
 *         name: positionId
 *         required: true
 *         schema:
 *           type: string
 *         description: positionId
 *     responses:
 *       200:
 *         description: ข้อมูล leave quota ตาม positionId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /api/leave-quota/{id}:
 *   put:
 *     summary: แก้ไข leave quota ตาม id
 *     tags: [LeaveQuota]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: id ของ leave quota
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               positionId:
 *                 type: string
 *               leaveTypeId:
 *                 type: string
 *               quota:
 *                 type: integer
 *     responses:
 *       200:
 *         description: แก้ไข leave quota สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *   delete:
 *     summary: ลบ leave quota ตาม id
 *     tags: [LeaveQuota]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: id ของ leave quota
 *     responses:
 *       200:
 *         description: ลบ leave quota สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 */

module.exports = (AppDataSource) => {
  const router = express.Router();
  // Create base controller instance for LeaveQuota
  const leaveQuotaController = new BaseController('LeaveQuota');

  // Create a new leave quota
  router.post('/', async (req, res) => {
    try {
      const { positionId, leaveTypeId, quota } = req.body;
      if (!positionId || !leaveTypeId || quota === undefined) {
        return sendValidationError(res, 'positionId, leaveTypeId, and quota are required');
      }
      const newQuota = await leaveQuotaController.create(AppDataSource, { positionId, leaveTypeId, quota });
      sendSuccess(res, newQuota, 'Created leave quota successfully');
    } catch (err) {
      sendError(res, err.message, 500);
    }
  });

  // Get all leave quotas
  router.get('/', async (req, res) => {
    try {
      const quotas = await leaveQuotaController.findAll(AppDataSource);
      sendSuccess(res, quotas, 'Fetched all leave quotas');
    } catch (err) {
      sendError(res, err.message, 500);
    }
  });

  // Get all leave quotas by positionId
  router.get('/position/:positionId', async (req, res) => {
    try {
      const { positionId } = req.params;
      const quotas = await leaveQuotaController.findAll(AppDataSource, { where: { positionId } });
      sendSuccess(res, quotas, 'Fetched leave quotas by positionId');
    } catch (err) {
      sendError(res, err.message, 500);
    }
  });

  // Update leave quota by id
  router.put('/:id', async (req, res) => {
    try {
      const { positionId, leaveTypeId, quota } = req.body;
      const updateData = {};
      if (positionId !== undefined) updateData.positionId = positionId;
      if (leaveTypeId !== undefined) updateData.leaveTypeId = leaveTypeId;
      if (quota !== undefined) updateData.quota = quota;
      
      const quotaObj = await leaveQuotaController.update(AppDataSource, req.params.id, updateData);
      sendSuccess(res, quotaObj, 'Updated leave quota successfully');
    } catch (err) {
      if (err.message === 'Record not found') {
        return sendNotFound(res, 'Leave quota not found');
      }
      sendError(res, err.message, 500);
    }
  });

  // Delete leave quota by id
  router.delete('/:id', async (req, res) => {
    try {
      await leaveQuotaController.delete(AppDataSource, req.params.id);
      sendSuccess(res, null, 'Deleted leave quota successfully');
    } catch (err) {
      if (err.message === 'Record not found') {
        return sendNotFound(res, 'Leave quota not found');
      }
      sendError(res, err.message, 500);
    }
  });

  // Test endpoint to check database state
  router.get('/test', async (req, res) => {
    try {
      const userRepo = AppDataSource.getRepository('User');
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const positionRepo = AppDataSource.getRepository('Position');
      const leaveQuotaRepo = AppDataSource.getRepository('LeaveQuota');
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      
      const users = await userRepo.find();
      const processes = await processRepo.find();
      const positions = await positionRepo.find();
      const quotas = await leaveQuotaRepo.find();
      const leaveTypes = await leaveTypeRepo.find();
      
      sendSuccess(res, {
        users: users.length,
        processes: processes.length,
        positions: positions.length,
        quotas: quotas.length,
        leaveTypes: leaveTypes.length,
        sampleUser: users[0] || null,
        sampleProcess: processes[0] || null,
        samplePosition: positions[0] || null,
        sampleQuota: quotas[0] || null,
        sampleLeaveType: leaveTypes[0] || null,
      }, 'Database state retrieved successfully');
    } catch (err) {
      sendError(res, err.message, 500);
    }
  });

  // Test endpoint to check current user's position
  router.get('/test-user', require('../middleware/authMiddleware'), async (req, res) => {
    try {
      const userId = req.user.userId;
      
      const userRepo = AppDataSource.getRepository('User');
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      
      const user = await userRepo.findOne({ where: { id: userId } });
      const processUser = await processRepo.findOne({ where: { Repid: userId } });
      
      sendSuccess(res, {
        userId,
        user: user || null,
        processUser: processUser || null,
        userPosition: user?.position || null,
        processPosition: processUser?.Position || null,
      }, 'User position retrieved successfully');
    } catch (err) {
      sendError(res, err.message, 500);
    }
  });

  // Catch-all route for unmatched requests (debugging)
  router.use((req, res, next) => {
    console.log('DEBUG: Unmatched route:', req.method, req.originalUrl);
    next();
  });

  return router;
};

