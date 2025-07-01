const express = require('express');
const multer = require('multer');
const path = require('path');

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



  /**
   * @swagger
   * /api/leave-request:
   *   get:
   *     summary: Get all leave requests
   *     tags: [LeaveRequest]
   *     responses:
   *       200:
   *         description: All leave requests retrieved successfully
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
   *                         type: integer
   *                       employeeType:
   *                         type: string
   *                       leaveType:
   *                         type: string
   *                       startDate:
   *                         type: string
   *                       endDate:
   *                         type: string
   *                       reason:
   *                         type: string
   *                       status:
   *                         type: string
   *       500:
   *         description: Server error
   */
  // GET /api/leave-request - Get all leave requests
  router.get('/leave-request', async (req, res) => {
    try {
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const leaves = await leaveRepo.find({
        order: { createdAt: 'DESC' }
      });
      
      res.json({
        success: true,
        data: leaves,
        message: 'Leave requests retrieved successfully'
      });
    } catch (err) {
      console.error('Get leave requests error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}; 