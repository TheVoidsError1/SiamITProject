const express = require('express');

/**
 * @swagger
 * tags:
 *   name: LeaveQuota
 *   description: จัดการโควต้าการลาตามตำแหน่ง
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
 *               sick:
 *                 type: integer
 *               vacation:
 *                 type: integer
 *               personal:
 *                 type: integer
 *               maternity:
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
 * /api/leave-quota/{positionId}:
 *   get:
 *     summary: ดึง leave quota ตาม positionId
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
 *                   type: object
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
 *               sick:
 *                 type: integer
 *               vacation:
 *                 type: integer
 *               personal:
 *                 type: integer
 *               maternity:
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

  // สร้าง leave quota ใหม่ (id อัตโนมัติ)
  router.post('/', async (req, res) => {
    try {
      const { positionId, sick, vacation, personal, maternity } = req.body;
      if (!positionId) return res.status(400).json({ status: 'error', data: null, message: 'positionId is required' });
      const quota = leaveQuotaRepo.create({ positionId, sick, vacation, personal, maternity });
      await leaveQuotaRepo.save(quota);
      res.json({ status: 'success', data: quota, message: 'Created leave quota successfully' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  // ดึง leave quota ทั้งหมด
  router.get('/', async (req, res) => {
    try {
      const quotas = await leaveQuotaRepo.find();
      res.json({ status: 'success', data: quotas, message: 'Fetched all leave quota' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  // ดึง leave quota ตาม positionId
  router.get('/:positionId', async (req, res) => {
    try {
      const { positionId } = req.params;
      const quota = await leaveQuotaRepo.findOneBy({ positionId });
      if (!quota) return res.status(404).json({ status: 'error', data: null, message: 'Not found' });
      res.json({ status: 'success', data: quota, message: 'Fetched leave quota by positionId' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  // แก้ไข leave quota ตาม id
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { sick, vacation, personal, maternity } = req.body;
      const quota = await leaveQuotaRepo.findOneBy({ id });
      if (!quota) return res.status(404).json({ status: 'error', data: null, message: 'Not found' });
      if (sick !== undefined) quota.sick = sick;
      if (vacation !== undefined) quota.vacation = vacation;
      if (personal !== undefined) quota.personal = personal;
      if (maternity !== undefined) quota.maternity = maternity;
      await leaveQuotaRepo.save(quota);
      res.json({ status: 'success', data: quota, message: 'Updated leave quota successfully' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  // ลบ leave quota ตาม id
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

  return router;
};
