const express = require('express');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const { Not } = require('typeorm');

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

  /**
   * @swagger
   * /api/leave-request/approved-or-rejected:
   *   get:
   *     summary: Get all leave requests with status not null (approved or rejected)
   *     tags: [LeaveRequest]
   *     responses:
   *       200:
   *         description: Leave requests with status != null retrieved successfully
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
  // GET /api/leave-request/approved-or-rejected - Get leave requests with status != null and status != ''
  router.get('/leave-request/approved-or-rejected', async (req, res) => {
    try {
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const leaves = await leaveRepo.find({
        where: [
          { status: Not(null) },
          { status: Not('') }
        ],
        order: { createdAt: 'DESC' }
      });
      // Filter out any with status null or '' (in case TypeORM ORs the conditions)
      const filteredLeaves = leaves.filter(lr => lr.status !== null && lr.status !== '');
      res.json({
        success: true,
        data: filteredLeaves,
        message: 'Leave requests with status != null and != "" retrieved successfully'
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * @swagger
   * /api/leave-request/{id}:
   *   get:
   *     summary: Get leave request by ID with calculated duration
   *     tags: [LeaveRequest]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Leave request ID
   *     responses:
   *       200:
   *         description: Leave request retrieved successfully
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
   *                     leaveType:
   *                       type: string
   *                     startDate:
   *                       type: string
   *                     endDate:
   *                       type: string
   *                     duration:
   *                       type: string
   *                       description: Duration in days or hours
   *                     reason:
   *                       type: string
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     status:
   *                       type: string
   *                       description: Status (pending if null or blank)
   *       404:
   *         description: Leave request not found
   *       500:
   *         description: Server error
   */
  // GET /api/leave-request/:id - Get leave request by ID with calculated duration
  router.get('/leave-request/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      
      const leave = await leaveRepo.findOneBy({ id: parseInt(id) });
      
      if (!leave) {
        return res.status(404).json({
          success: false,
          error: 'Leave request not found'
        });
      }

      // Calculate duration
      let duration = '';
      
      if (leave.startDate && leave.endDate) {
        // Handle different date formats
        let startDate, endDate;
        
        if (leave.startDate instanceof Date && leave.endDate instanceof Date) {
          startDate = leave.startDate;
          endDate = leave.endDate;
        } else {
          startDate = new Date(leave.startDate);
          endDate = new Date(leave.endDate);
        }

        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          // Calculate difference in days (exclusive counting - just the difference)
          const timeDiff = endDate.getTime() - startDate.getTime();
          const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          // Check if it's actually the same day (same date)
          const isSameDay = startDate.toDateString() === endDate.toDateString();
          
          // If it's the same day and has startTime/endTime, calculate hours
          if (isSameDay && leave.startTime && leave.endTime) {
            const [startHour, startMinute] = leave.startTime.split(':').map(Number);
            const [endHour, endMinute] = leave.endTime.split(':').map(Number);
            
            // Calculate hours difference
            let startTime = new Date();
            let endTime = new Date();
            startTime.setHours(startHour, startMinute || 0, 0, 0);
            endTime.setHours(endHour, endMinute || 0, 0, 0);
            
            let diffMs = endTime - startTime;
            if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // handle overnight
            
            const diffHours = diffMs / (1000 * 60 * 60);
            duration = `${diffHours.toFixed(1)} ชั่วโมง`;
          } else {
            // Multiple days or same day without time
            // For leave requests, we count the actual days between dates
            const actualDays = dayDiff === 0 ? 1 : dayDiff;
            duration = `${actualDays} วัน`;
          }
        } else {
          duration = '1 วัน'; // Default if date parsing fails
        }
      } else {
        duration = '1 วัน'; // Default if no dates
      }

      // Determine status (pending if null or blank)
      const status = (!leave.status || leave.status.trim() === '') ? 'pending' : leave.status;

      // Format createdAt to show only date
      let formattedCreatedAt = '';
      if (leave.createdAt) {
        const createdDate = leave.createdAt instanceof Date ? leave.createdAt : new Date(leave.createdAt);
        if (!isNaN(createdDate.getTime())) {
          formattedCreatedAt = createdDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
      }

      const result = {
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        duration: duration,
        reason: leave.reason,
        createdAt: formattedCreatedAt,
        status: status
      };

      res.json({
        success: true,
        data: result,
        message: 'Leave request retrieved successfully'
      });
    } catch (err) {
      console.error('Get leave request by ID error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}; 