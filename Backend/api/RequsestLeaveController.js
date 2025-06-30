const express = require('express');

module.exports = (AppDataSource) => {
  const router = express.Router();

  /**
   * @swagger
   * /api/leave-request:
   *   post:
   *     summary: สร้างคำขอลาใหม่
   *     tags:
   *       - LeaveRequest
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               employeeType: { type: string }
   *               leaveType: { type: string }
   *               personalLeaveType: { type: string }
   *               startDate: { type: string, format: date }
   *               endDate: { type: string, format: date }
   *               startTime: { type: string }
   *               endTime: { type: string }
   *               reason: { type: string }
   *               supervisor: { type: string }
   *               attachments: { type: string }
   *               contact: { type: string }
   *     responses:
   *       200:
   *         description: บันทึกคำขอลาสำเร็จ
   */
  router.post('/leave-request', async (req, res) => {
    try {
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const leave = leaveRepo.create(req.body);
      await leaveRepo.save(leave);
      res.json({ message: 'บันทึกคำขอลาสำเร็จ', leave });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};