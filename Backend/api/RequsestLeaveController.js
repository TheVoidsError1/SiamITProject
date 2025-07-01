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

  const upload = multer({
    dest: path.join(__dirname, '../../public/leave-uploads'),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  });
  
  module.exports = (AppDataSource) => {
    const router = express.Router();
  
    // POST /api/leave-request (รองรับอัปโหลดไฟล์)
    router.post('/leave-request', upload.single('imgLeave'), async (req, res) => {
      try {
        const leaveRepo = AppDataSource.getRepository('LeaveRequest');
        const data = req.body;
        let imgLeave = null;
        if (req.file) {
          imgLeave = `/leave-uploads/${req.file.filename}`;
        }
        const leave = leaveRepo.create({
          ...data,
          imgLeave,
        });
        await leaveRepo.save(leave);
        res.json({ message: 'บันทึกคำขอลาสำเร็จ', leave });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  
    return router;
  }; 

  return router;


};