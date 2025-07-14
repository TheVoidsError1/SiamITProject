const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

module.exports = (AppDataSource) => {
  const router = express.Router();

  // GET /api/leave-history (ต้องแนบ JWT)
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const userId = req.user && req.user.userId; // ดึง userId จาก JWT
      if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      const adminRepo = AppDataSource.getRepository('Admin');

      // --- เพิ่ม paging ---
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const skip = (page - 1) * limit;

      // ดึง leave request ของ user (paging)
      const where = { Repid: userId };
      const [leaves, total] = await Promise.all([
        leaveRepo.find({ where, order: { createdAt: 'DESC' }, skip, take: limit }),
        leaveRepo.count({ where })
      ]);

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
      res.json({ status: 'success', data: result, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  return router;
};
