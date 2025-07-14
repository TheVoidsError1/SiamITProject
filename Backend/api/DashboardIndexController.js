const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

module.exports = (AppDataSource) => {
  router.get('/dashboard-stats', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      // Fetch all leave requests where the current user is the requester
      const leaveHistory = await leaveRepo.find({ where: { Repid: userId } });
      // Calculate days used
      let daysUsed = 0;
      leaveHistory.forEach(lr => {
        const start = new Date(lr.startDate);
        const end = new Date(lr.endDate);
        daysUsed += (end - start) / (1000 * 60 * 60 * 24) + 1;
      });
      // Only use approved leaves for stats
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      const approvedLeaves = leaveHistory.filter(lr => lr.status === 'approved');
      // Calculate leave days by type using leaveType name
      const leaveTypeStats = {};
      for (const lr of approvedLeaves) {
        let leaveTypeName = lr.leaveType;
        if (leaveTypeName) {
          const leaveType = await leaveTypeRepo.findOneBy({ id: leaveTypeName });
          leaveTypeName = leaveType ? leaveType.leave_type : leaveTypeName;
        }
        const start = new Date(lr.startDate);
        const end = new Date(lr.endDate);
        const days = (end - start) / (1000 * 60 * 60 * 24) + 1;
        if (!leaveTypeStats[leaveTypeName]) leaveTypeStats[leaveTypeName] = 0;
        leaveTypeStats[leaveTypeName] += days;
      }
      // Pending requests for this user
      const pendingRequests = leaveHistory.filter(lr => lr.status === 'pending').length;
      // Approved requests
      const approvedRequests = leaveHistory.filter(lr => lr.status === 'approved').length;
      // Approval rate
      const totalRequests = leaveHistory.length;
      const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;
      // Remaining days (limit 20)
      const remainingDays = Math.max(0, 20 - daysUsed);
      res.json({
        status: 'success',
        data: {
          leaveHistory,
          daysUsed,
          pendingRequests,
          approvalRate,
          remainingDays,
          leaveTypeStats
        },
        message: 'Dashboard stats fetched successfully'
      });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  router.get('/dashboard-recent-leave-stats', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      // Only approved leaves for this user
      const approvedLeaves = await leaveRepo.find({ where: { Repid: userId, status: 'approved' } });

      // Initialize counters
      let sickDays = 0;
      let vacationDays = 0;
      let personalHours = 0;

      // Helper to normalize type
      const normalizeType = (type) => {
        if (!type) return null;
        if (["sick", "ลาป่วย"].includes(type)) return "sick";
        if (["vacation", "ลาพักผ่อน"].includes(type)) return "vacation";
        if (["personal", "ลากิจ"].includes(type)) return "personal";
        return null;
      };

      // Helper to parse 'HH:mm' to minutes
      function parseTimeToMinutes(t) {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + (m || 0);
      }

      for (const lr of approvedLeaves) {
        let leaveTypeName = lr.leaveType;
        // If leaveType is a UUID, look up the name
        if (leaveTypeName && leaveTypeName.length > 20) {
          const leaveTypeEntity = await leaveTypeRepo.findOneBy({ id: leaveTypeName });
          if (leaveTypeEntity && leaveTypeEntity.leave_type) {
            leaveTypeName = leaveTypeEntity.leave_type;
          }
        }
        const leaveType = normalizeType(leaveTypeName);
        if (!leaveType) continue;

        if (leaveType === "personal") {
          // Personal leave: can be hour-based or day-based
          if (lr.startTime && lr.endTime) {
            // Hour-based
            const startMinutes = parseTimeToMinutes(lr.startTime);
            const endMinutes = parseTimeToMinutes(lr.endTime);
            let durationHours = (endMinutes - startMinutes) / 60;
            if (durationHours < 0 || isNaN(durationHours)) durationHours = 0;
            personalHours += durationHours;
          } else if (lr.startDate && lr.endDate) {
            // Day-based, convert days to hours (1 day = 9 hours)
            const start = new Date(lr.startDate);
            const end = new Date(lr.endDate);
            let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (days < 0 || isNaN(days)) days = 0;
            personalHours += days * 9;
          }
        } else if (leaveType === "sick" || leaveType === "vacation") {
          // Sick/Vacation: only day-based
          if (lr.startDate && lr.endDate) {
            const start = new Date(lr.startDate);
            const end = new Date(lr.endDate);
            let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (days < 0 || isNaN(days)) days = 0;
            if (leaveType === "sick") sickDays += days;
            if (leaveType === "vacation") vacationDays += days;
          }
        }
      }

      // Prepare result
      const personalTotalHours = Math.round(personalHours);
      const personalResult = {
        days: Math.floor(personalTotalHours / 9),
        hours: personalTotalHours % 9
      };
      // If only hours (no days), and hours > 0, keep as is
      // If only days (no hours), and days > 0, keep as is
      // If both zero, keep as zero

      res.json({
        status: 'success',
        data: {
          sick: { days: sickDays },
          vacation: { days: vacationDays },
          personal: personalResult
        }
      });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });
  return router;
};
