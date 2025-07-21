const express = require('express');

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
  const leaveQuotaRepo = AppDataSource.getRepository('LeaveQuota');

  // Create a new leave quota
  router.post('/', async (req, res) => {
    try {
      const { positionId, leaveTypeId, quota } = req.body;
      if (!positionId || !leaveTypeId || quota === undefined) {
        return res.status(400).json({ status: 'error', data: null, message: 'positionId, leaveTypeId, and quota are required' });
      }
      const newQuota = leaveQuotaRepo.create({ positionId, leaveTypeId, quota });
      await leaveQuotaRepo.save(newQuota);
      res.json({ status: 'success', data: newQuota, message: 'Created leave quota successfully' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  // Get all leave quotas
  router.get('/', async (req, res) => {
    try {
      const quotas = await leaveQuotaRepo.find();
      res.json({ status: 'success', data: quotas, message: 'Fetched all leave quotas' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  // Get all leave quotas by positionId
  router.get('/position/:positionId', async (req, res) => {
    try {
      const { positionId } = req.params;
      const quotas = await leaveQuotaRepo.find({ where: { positionId } });
      res.json({ status: 'success', data: quotas, message: 'Fetched leave quotas by positionId' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  // Update leave quota by id
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { positionId, leaveTypeId, quota } = req.body;
      const quotaObj = await leaveQuotaRepo.findOneBy({ id });
      if (!quotaObj) return res.status(404).json({ status: 'error', data: null, message: 'Not found' });
      if (positionId !== undefined) quotaObj.positionId = positionId;
      if (leaveTypeId !== undefined) quotaObj.leaveTypeId = leaveTypeId;
      if (quota !== undefined) quotaObj.quota = quota;
      await leaveQuotaRepo.save(quotaObj);
      res.json({ status: 'success', data: quotaObj, message: 'Updated leave quota successfully' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  // Delete leave quota by id
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await leaveQuotaRepo.delete({ id });
      if (result.affected === 0) return res.status(404).json({ status: 'error', data: null, message: 'Not found' });
      res.json({ status: 'success', data: null, message: 'Deleted leave quota successfully' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
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
      
      res.json({
        success: true,
        data: {
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
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
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
      
      res.json({
        success: true,
        data: {
          userId,
          user: user || null,
          processUser: processUser || null,
          userPosition: user?.position || null,
          processPosition: processUser?.Position || null,
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // --- NEW /api/leave-quota/me endpoint ---
  router.get('/me', require('../middleware/authMiddleware'), async (req, res) => {
    try {
      const userId = req.user.userId;
      const userRepo = AppDataSource.getRepository('User');
      const adminRepo = AppDataSource.getRepository('Admin');
      const superadminRepo = AppDataSource.getRepository('SuperAdmin');
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      const leaveQuotaRepo = AppDataSource.getRepository('LeaveQuota');
      const leaveRequestRepo = AppDataSource.getRepository('LeaveRequest');

      let debugInfo = { foundIn: null, positionId: null };
      // Try to find position from User, then Admin, then SuperAdmin
      let user = await userRepo.findOne({ where: { id: userId } });
      let positionId = user?.position || null;
      if (positionId) debugInfo.foundIn = 'User';
      if (!positionId) {
        user = await adminRepo.findOne({ where: { id: userId } });
        positionId = user?.position || null;
        if (positionId) debugInfo.foundIn = 'Admin';
      }
      if (!positionId) {
        user = await superadminRepo.findOne({ where: { id: userId } });
        positionId = user?.position || null;
        if (positionId) debugInfo.foundIn = 'SuperAdmin';
      }
      debugInfo.positionId = positionId;

      // Use the already declared leaveTypeRepo to fetch leave types as in /test endpoint
      let leaveTypes = await leaveTypeRepo.find();
      // Exclude Emergency leave types (case-insensitive)
      leaveTypes = leaveTypes.filter(lt =>
        (lt.leave_type_en?.toLowerCase() !== 'emergency' && lt.leave_type_th !== 'ลาฉุกเฉิน')
      );
      // Get all quotas for this position
      const quotas = positionId ? await leaveQuotaRepo.find({ where: { positionId } }) : [];
      // Get all approved leave requests for this user
      const approvedLeaves = await leaveRequestRepo.find({ where: { Repid: userId, status: 'approved' } });

      function parseTimeToMinutes(t) {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + (m || 0);
      }

      const result = leaveTypes.map(lt => {
        // Robust comparison for leaveTypeId
        const quotaRow = quotas.find(q => String(q.leaveTypeId).trim() === String(lt.id).trim());
        let quota = quotaRow ? quotaRow.quota : 0;
        let used = 0;
        let unit = 'day';
        if (quotaRow) {
          for (const lr of approvedLeaves) {
            let leaveTypeName = lr.leaveType;
            if (leaveTypeName && leaveTypeName.length > 20) {
              const leaveTypeEntity = leaveTypes.find(t => t.id === leaveTypeName);
              if (leaveTypeEntity) leaveTypeName = leaveTypeEntity.leave_type_en;
            }
            if (
              leaveTypeName === lt.leave_type_en ||
              leaveTypeName === lt.leave_type_th ||
              leaveTypeName === lt.id
            ) {
              if (lt.leave_type_en?.toLowerCase() === 'personal' || lt.leave_type_th === 'ลากิจ') {
                if (lr.startTime && lr.endTime) {
                  const startMinutes = parseTimeToMinutes(lr.startTime);
                  const endMinutes = parseTimeToMinutes(lr.endTime);
                  let durationHours = (endMinutes - startMinutes) / 60;
                  if (durationHours < 0 || isNaN(durationHours)) durationHours = 0;
                  used += durationHours;
                  unit = 'hour';
                } else if (lr.startDate && lr.endDate) {
                  const start = new Date(lr.startDate);
                  const end = new Date(lr.endDate);
                  let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                  if (days < 0 || isNaN(days)) days = 0;
                  used += days;
                  unit = 'day';
                }
              } else {
                if (lr.startDate && lr.endDate) {
                  const start = new Date(lr.startDate);
                  const end = new Date(lr.endDate);
                  let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                  if (days < 0 || isNaN(days)) days = 0;
                  used += days;
                  unit = 'day';
                }
              }
            }
          }
          if ((lt.leave_type_en?.toLowerCase() === 'personal' || lt.leave_type_th === 'ลากิจ') && unit === 'hour') {
            quota = quota * 9;
          }
        }
        // If no quotaRow, show 0 for quota, used, remaining, and default unit
        const remaining = Math.max(0, quota - used);
        return {
          id: lt.id,
          leave_type_en: lt.leave_type_en,
          leave_type_th: lt.leave_type_th,
          quota: quota,
          used: Math.round(used * 100) / 100,
          remaining: Math.round(remaining * 100) / 100,
          unit,
        };
      });
      return res.json({ success: true, data: result, debug: debugInfo });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Catch-all route for unmatched requests (debugging)
  router.use((req, res, next) => {
    console.log('DEBUG: Unmatched route:', req.method, req.originalUrl);
    next();
  });

  return router;
};

