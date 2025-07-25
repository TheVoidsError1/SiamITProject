const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/leave-types:
 *   get:
 *     summary: Get all leave types
 *     tags:
 *       - LeaveTypes
 *     responses:
 *       200:
 *         description: A list of leave types
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
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /api/leave-types:
 *   post:
 *     summary: Create a new leave type
 *     tags:
 *       - LeaveTypes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leave_type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Leave type created
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

/**
 * @swagger
 * /api/leave-types/{id}:
 *   put:
 *     summary: Update a leave type by ID
 *     tags:
 *       - LeaveTypes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The leave type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leave_type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Leave type updated
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

/**
 * @swagger
 * /api/leave-types/{id}:
 *   delete:
 *     summary: Delete a leave type by ID
 *     tags:
 *       - LeaveTypes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The leave type ID
 *     responses:
 *       200:
 *         description: Leave type deleted
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

module.exports = (AppDataSource) => {
  // GET all leave types
  router.get('/leave-types', async (req, res) => {
    try {
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      const leaveTypes = await leaveTypeRepo.find();
      res.json({ success: true, data: leaveTypes, message: 'Fetched leave types successfully' });
    } catch (err) {
      res.status(500).json({ success: false, data: [], message: err.message });
    }
  });

  // CREATE leave type
  router.post('/leave-types', async (req, res) => {
    try {
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      const leaveType = leaveTypeRepo.create({
        leave_type_en: req.body.leave_type_en,
        leave_type_th: req.body.leave_type_th,
        require_attachment: req.body.require_attachment ?? false
      });
      const saved = await leaveTypeRepo.save(leaveType);
      res.status(201).json({ success: true, data: saved, message: 'Created leave type successfully' });
    } catch (err) {
      res.status(500).json({ success: false, data: null, message: err.message });
    }
  });

  // UPDATE leave type
  router.put('/leave-types/:id', async (req, res) => {
    try {
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      const leaveType = await leaveTypeRepo.findOneBy({ id: req.params.id });
      if (!leaveType) {
        return res.status(404).json({ success: false, data: null, message: 'Leave type not found' });
      }
      leaveType.leave_type_en = req.body.leave_type_en;
      leaveType.leave_type_th = req.body.leave_type_th;
      if (typeof req.body.require_attachment !== 'undefined') {
        leaveType.require_attachment = req.body.require_attachment;
      }
      const updated = await leaveTypeRepo.save(leaveType);
      res.json({ success: true, data: updated, message: 'Updated leave type successfully' });
    } catch (err) {
      res.status(500).json({ success: false, data: null, message: err.message });
    }
  });

  // DELETE leave type
  router.delete('/leave-types/:id', async (req, res) => {
    try {
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      const result = await leaveTypeRepo.delete(req.params.id);
      if (result.affected === 0) {
        return res.status(404).json({ success: false, data: null, message: 'Leave type not found' });
      }
      res.json({ success: true, data: null, message: 'Deleted leave type successfully' });
    } catch (err) {
      res.status(500).json({ success: false, data: null, message: err.message });
    }
  });

  return router;
};
