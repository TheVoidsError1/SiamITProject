const express = require('express');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');

const upload = multer({
  dest: path.join(__dirname, '../../public/leave-uploads'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = (AppDataSource) => {
  const router = express.Router();

  // POST /api/leave-request (รองรับอัปโหลดไฟล์)
  router.post('/leave-request', authMiddleware, upload.single('imgLeave'), async (req, res) => {
    try {
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const data = req.body;
      let imgLeave = null;
      if (req.file) {
        imgLeave = `/leave-uploads/${req.file.filename}`;
      }

      // ใช้ email จาก token (req.user)
      const Email = req.user.email;
      const processUser = await processRepo.findOneBy({ Email });
      if (!processUser) {
        return res.status(400).json({ error: "ไม่พบผู้ใช้ในระบบ" });
      }

      const leave = leaveRepo.create({
        ...data,
        imgLeave,
        Repid: processUser.Repid, // เพิ่ม Repid
      });
      await leaveRepo.save(leave);
      res.json({ message: 'บันทึกคำขอลาสำเร็จ', leave });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/leave-request/:id/status
  router.put('/leave-request/:id/status', authMiddleware, async (req, res) => {
    try {
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const adminRepo = AppDataSource.getRepository('admin');
      const { id } = req.params;
      const { status } = req.body; // status: 'approved' หรือ 'rejected'

      const leave = await leaveRepo.findOneBy({ id: parseInt(id) });
      if (!leave) {
        return res.status(404).json({ success: false, message: 'ไม่พบคำขอลา' });
      }

      leave.status = status;
      if (status === 'approved') {
        leave.approvedTime = new Date();
        // ดึงชื่อ admin จาก token
        const Email = req.user.email;
        const processUser = await processRepo.findOneBy({ Email });
        if (processUser && processUser.Repid) {
          const admin = await adminRepo.findOneBy({ admin_id: processUser.Repid });
          if (admin && admin.admin_name) {
            leave.approvedBy = admin.admin_name;
          } else {
            leave.approvedBy = Email;
          }
        } else {
          leave.approvedBy = Email;
        }
      } else if (status === 'rejected') {
        leave.approvedTime = null;
        leave.approvedBy = null;
      }
      await leaveRepo.save(leave);

      res.json({ success: true, message: 'อัปเดตสถานะสำเร็จ', data: leave });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
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

  router.get('/leave-request/full', async (req, res) => {
    try {
      const data = await AppDataSource
        .getRepository('LeaveRequest')
        .createQueryBuilder('leave')
        .leftJoinAndMapOne('leave.process', 'ProcessCheck', 'process', 'leave.Repid = process.Repid')
        .leftJoinAndMapOne('leave.user', 'User', 'user', 'process.Repid = user.User_id')
        .orderBy('leave.createdAt', 'DESC')
        .getMany();

      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}; 