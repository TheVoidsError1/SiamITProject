const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { Between } = require('typeorm');

module.exports = (AppDataSource) => {
  const router = express.Router();

  // GET /api/leave-history (ต้องแนบ JWT)
  router.get('/', authMiddleware, async (req, res) => {
    try {
      // --- i18n: ตรวจจับภาษา ---
      let lang = req.headers['accept-language'] || req.query.lang || 'th';
      lang = lang.split(',')[0].toLowerCase().startsWith('en') ? 'en' : 'th';
      const userId = req.user && req.user.userId; // ดึง userId จาก JWT
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: lang === 'th' ? 'ไม่ได้รับอนุญาต' : 'Unauthorized'
        });
      }
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      const adminRepo = AppDataSource.getRepository('Admin');

      // --- เพิ่ม paging ---
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const skip = (page - 1) * limit;

      // --- เพิ่ม filter เดือนและปี ---
      const month = req.query.month ? parseInt(req.query.month) : null;
      const year = req.query.year ? parseInt(req.query.year) : null;
      
      // ดึง leave request ของ user (paging) พร้อม filter เดือน/ปี (ใช้ createdAt)
      let where = { Repid: userId };
      if (month && year) {
        // กรอง createdAt ให้อยู่ในเดือน/ปีที่เลือก
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
        where = {
          ...where,
          createdAt: Between(startOfMonth, endOfMonth)
        };
      } else if (year) {
        // ถ้าเลือกแค่ปี
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
        where = {
          ...where,
          createdAt: Between(startOfYear, endOfYear)
        };
      }

      // ดึง leave request ของ user (paging)
      const [leaves, total] = await Promise.all([
        leaveRepo.find({ where, order: { createdAt: 'DESC' }, skip, take: limit }),
        leaveRepo.count({ where })
      ]);

      // --- ดึง leave request ทั้งหมดของ user เพื่อคำนวณ summary ---
      const allLeaves = await leaveRepo.find({ where });
      // คำนวณ summary
      const totalLeaveDays = allLeaves.reduce((sum, leave) => {
        if (leave.startDate && leave.endDate) {
          return sum + (Math.floor((new Date(leave.endDate) - new Date(leave.startDate)) / (1000*60*60*24)) + 1);
        }
        return sum + 1;
      }, 0);
      const approvedCount = allLeaves.filter(l => l.status === 'approved').length;
      const pendingCount = allLeaves.filter(l => l.status === 'pending').length;
      const rejectedCount = allLeaves.filter(l => l.status === 'rejected').length;

      // join leaveType, admin (approver/rejector)
      const result = await Promise.all(leaves.map(async (leave) => {
        let leaveTypeName = null;
        let approvedBy = null;
        let rejectedBy = null;
        if (leave.leaveType) {
          const leaveType = await leaveTypeRepo.findOneBy({ id: leave.leaveType });
          leaveTypeName = leaveType ? leaveType.leave_type : leave.leaveType;
        }
        if (leave.statusBy && leave.status === 'approved') {
          const admin = await adminRepo.findOneBy({ id: leave.statusBy });
          approvedBy = admin ? admin.admin_name + ' ผู้จัดการ' : leave.statusBy;
        }
        if (leave.statusBy && leave.status === 'rejected') {
          const admin = await adminRepo.findOneBy({ id: leave.statusBy });
          rejectedBy = admin ? admin.admin_name + ' ผู้จัดการ' : leave.statusBy;
        }
        return {
          id: leave.id,
          type: leaveTypeName,
          startDate: leave.startDate,
          endDate: leave.endDate,
          startTime: leave.startTime, // เพิ่มบรรทัดนี้
          endTime: leave.endTime,     // เพิ่มบรรทัดนี้
          days: leave.startDate && leave.endDate ? (Math.floor((new Date(leave.endDate) - new Date(leave.startDate)) / (1000*60*60*24)) + 1) : 1,
          reason: leave.reason,
          status: leave.status,
          approvedBy,
          rejectedBy,
          rejectionReason: leave.rejectedReason,
          submittedDate: leave.createdAt,
        };
      }));
      res.json({
        status: 'success',
        data: result,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        summary: {
          totalLeaveDays,
          approvedCount,
          pendingCount,
          rejectedCount
        },
        message: lang === 'th' ? 'ดึงข้อมูลสำเร็จ' : 'Fetch success'
      });
    } catch (err) {
      res.status(500).json({
        status: 'error',
        message: lang === 'th' ? 'เกิดข้อผิดพลาด: ' + err.message : 'Error: ' + err.message
      });
    }
  });

  return router;
};
