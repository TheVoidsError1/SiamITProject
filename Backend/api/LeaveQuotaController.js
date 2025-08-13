const express = require('express');
const { BaseController, sendSuccess, sendError, sendNotFound, sendValidationError } = require('../utils');
const { In } = require('typeorm');

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

  /**
   * @swagger
   * /api/leave-quota/reset:
   *   post:
   *     summary: รีเซ็ตการใช้สิทธิ์ลาประจำปี (เริ่ม 1 มกราคม) ตามตำแหน่ง
   *     description: รีเซ็ตตารางการใช้สิทธิ์ลา (leave_used) ของผู้ใช้ที่อยู่ในตำแหน่งที่กำหนด โดยค่าเริ่มต้นจะทำงานเฉพาะวันที่ 1 มกราคม เว้นแต่ส่ง force=true
   *     tags: [LeaveQuota]
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               positionId:
   *                 type: string
   *                 description: ระบุตำแหน่งเดียวที่ต้องการรีเซ็ต (ถ้าไม่ระบุ จะใช้ทุกตำแหน่งที่ตั้งค่า new_year_quota=true)
   *               force:
   *                 type: boolean
   *                 description: หาก true จะอนุญาตให้รีเซ็ตนอกวันที่ 1 มกราคมได้
   *               strategy:
   *                 type: string
   *                 enum: [delete, zero]
   *                 description: วิธีรีเซ็ต (delete = ลบระเบียน leave_used, zero = ตั้งค่า days/hour เป็น 0)
   *     responses:
   *       200:
   *         description: รีเซ็ตสำเร็จ
   *       400:
   *         description: เงื่อนไขไม่ถูกต้อง
   */
  router.post('/reset', async (req, res) => {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { positionId, force = false, strategy = 'zero' } = req.body || {};

      // ตรวจสอบวันที่ (1 มกราคม) หากไม่ force
      const now = new Date();
      const isJanFirst = now.getMonth() === 0 && now.getDate() === 1; // 0=Jan
      if (!force && !isJanFirst) {
        return sendValidationError(res, 'อนุญาตให้รีเซ็ตเฉพาะวันที่ 1 มกราคมเท่านั้น (หรือส่ง force=true)');
      }

      const positionRepo = queryRunner.manager.getRepository('Position');
      const userRepo = queryRunner.manager.getRepository('User');
      const adminRepo = queryRunner.manager.getRepository('Admin');
      const superAdminRepo = queryRunner.manager.getRepository('SuperAdmin');
      const leaveUsedRepo = queryRunner.manager.getRepository('LeaveUsed');

      // คัดเลือกตำแหน่งเป้าหมาย
      let targetPositions = [];
      if (positionId) {
        const pos = await positionRepo.findOne({ where: { id: positionId } });
        if (!pos) {
          await queryRunner.rollbackTransaction();
          return sendNotFound(res, 'ไม่พบตำแหน่งที่ระบุ');
        }
        targetPositions = [pos];
      } else {
        // เลือกเฉพาะตำแหน่งที่ต้องรีเซ็ต: new_year_quota = 0
        targetPositions = await positionRepo.find({ where: { new_year_quota: 0 } });
      }

      const positionIds = targetPositions.map(p => p.id);
      if (positionIds.length === 0) {
        await queryRunner.commitTransaction();
        return sendSuccess(res, { positions: 0, users: 0, affected: 0 }, 'ไม่มีตำแหน่งที่ต้องรีเซ็ต');
      }

      // ค้นหาผู้ใช้ในตำแหน่งเป้าหมาย (user/admin/superadmin)
      const [users, admins, supers] = await Promise.all([
        userRepo.find({ where: { position: In(positionIds) } }),
        adminRepo.find({ where: { position: In(positionIds) } }),
        superAdminRepo.find({ where: { position: In(positionIds) } })
      ]);

      const userIds = [
        ...users.map(u => u.id),
        ...admins.map(a => a.id),
        ...supers.map(s => s.id),
      ];

      if (userIds.length === 0) {
        await queryRunner.commitTransaction();
        return sendSuccess(res, { positions: positionIds.length, users: 0, affected: 0 }, 'ไม่มีผู้ใช้ในตำแหน่งที่เลือก');
      }

      let affected = 0;
      if (strategy === 'delete') {
        const result = await leaveUsedRepo.delete({ user_id: In(userIds) });
        affected = result.affected || 0;
      } else {
        // ตั้งค่า days/hour เป็น 0 แบบรวดเดียว
        const qb = queryRunner.manager.createQueryBuilder()
          .update('LeaveUsed')
          .set({ days: 0, hour: 0 })
          .where({ user_id: In(userIds) });
        const result = await qb.execute();
        affected = result.affected || 0;
      }

      await queryRunner.commitTransaction();
      return sendSuccess(res, {
        positions: positionIds.length,
        users: userIds.length,
        affected,
        strategy
      }, 'รีเซ็ตการใช้สิทธิ์ลาสำเร็จ');
    } catch (err) {
      await queryRunner.rollbackTransaction();
      return sendError(res, err.message, 500);
    } finally {
      await queryRunner.release();
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

