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

  router.get('/leave-days-remaining', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const userRepo = AppDataSource.getRepository('User');
      const adminRepo = AppDataSource.getRepository('Admin');
      const superadminRepo = AppDataSource.getRepository('SuperAdmin');
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const leaveQuotaRepo = AppDataSource.getRepository('LeaveQuota');
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');

      // Get user and their position (check User, Admin, SuperAdmin tables)
      let user = await userRepo.findOneBy({ id: userId });
      if (!user) {
        user = await adminRepo.findOneBy({ id: userId });
      }
      if (!user) {
        user = await superadminRepo.findOneBy({ id: userId });
      }
      if (!user || !user.position) {
        return res.status(404).json({ status: 'error', message: 'User or position not found' });
      }
      const positionId = user.position;

      // Get all leave quotas for this position
      const quotas = await leaveQuotaRepo.find({ where: { positionId } });
      const leaveTypes = await leaveTypeRepo.find();
      // Get all approved leave requests for this user
      const approvedLeaves = await leaveRepo.find({ where: { Repid: userId, status: 'approved' } });

      // For each leave type, calculate remaining (only sick, personal, vacation)
      let totalRemaining = 0;
      for (const leaveType of leaveTypes) {
        if (!['sick', 'personal', 'vacation', 'ลาป่วย', 'ลากิจ', 'ลาพักผ่อน'].includes(leaveType.leave_type)) continue;
        const quotaRow = quotas.find(q => q.leaveTypeId === leaveType.id);
        const quota = quotaRow ? quotaRow.quota : 0;
        let used = 0;
        for (const lr of approvedLeaves) {
          let leaveTypeName = lr.leaveType;
          if (leaveTypeName && leaveTypeName.length > 20) {
            const leaveTypeEntity = await leaveTypeRepo.findOneBy({ id: leaveTypeName });
            if (leaveTypeEntity && leaveTypeEntity.leave_type) {
              leaveTypeName = leaveTypeEntity.leave_type;
            }
          }
          if (leaveTypeName === leaveType.leave_type) {
            // Personal leave: may be by hour or day
            if (leaveTypeName === 'personal' || leaveTypeName === 'ลากิจ') {
              if (lr.startTime && lr.endTime) {
                const [sh, sm] = lr.startTime.split(":").map(Number);
                const [eh, em] = lr.endTime.split(":").map(Number);
                let start = sh + (sm || 0) / 60;
                let end = eh + (em || 0) / 60;
                let diff = end - start;
                if (diff < 0) diff += 24;
                used += diff / 9; // 1 day = 9 hours
              } else if (lr.startDate && lr.endDate) {
                const start = new Date(lr.startDate);
                const end = new Date(lr.endDate);
                let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                if (days < 0 || isNaN(days)) days = 0;
                used += days;
              }
            } else {
              // Other types: by day
              if (lr.startDate && lr.endDate) {
                const start = new Date(lr.startDate);
                const end = new Date(lr.endDate);
                let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                if (days < 0 || isNaN(days)) days = 0;
                used += days;
              }
            }
          }
        }
        let remaining = quota - used;
        if (remaining < 0) remaining = 0;
        totalRemaining += remaining;
      }
      // Convert to days and hours (1 day = 9 hours)
      const days = Math.floor(totalRemaining);
      const hours = Math.round((totalRemaining - days) * 9);
      res.json({ status: 'success', data: { days, hours } });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // New API: /day-used - total leave duration for current user (days/hours)
  router.get('/day-used', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const userRepo = AppDataSource.getRepository('User');
      const adminRepo = AppDataSource.getRepository('Admin');
      const superadminRepo = AppDataSource.getRepository('SuperAdmin');
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');

      // Get user (check User, Admin, SuperAdmin tables)
      let user = await userRepo.findOneBy({ id: userId });
      if (!user) {
        user = await adminRepo.findOneBy({ id: userId });
      }
      if (!user) {
        user = await superadminRepo.findOneBy({ id: userId });
      }
      if (!user) {
        return res.status(404).json({ status: 'error', message: 'User not found' });
      }

      // Get all leave requests for this user
      const leaves = await leaveRepo.find({ where: { Repid: userId } });
      // Helper to normalize type
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      function parseTimeToMinutes(t) {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + (m || 0);
      }
      const normalizeType = (type) => {
        if (!type) return null;
        if (["sick", "ลาป่วย"].includes(type)) return "sick";
        if (["vacation", "ลาพักผ่อน"].includes(type)) return "vacation";
        if (["personal", "ลากิจ"].includes(type)) return "personal";
        return null;
      };
      // Calculate total used leave in hours
      let totalHours = 0;
      for (const lr of leaves) {
        let leaveTypeName = lr.leaveType;
        if (leaveTypeName && leaveTypeName.length > 20) {
          const leaveTypeEntity = await leaveTypeRepo.findOneBy({ id: leaveTypeName });
          if (leaveTypeEntity && leaveTypeEntity.leave_type) {
            leaveTypeName = leaveTypeEntity.leave_type;
          }
        }
        const leaveType = normalizeType(leaveTypeName);
        if (!leaveType) continue;
        if (leaveType === "personal") {
          if (lr.startTime && lr.endTime) {
            const startMinutes = parseTimeToMinutes(lr.startTime);
            const endMinutes = parseTimeToMinutes(lr.endTime);
            let durationHours = (endMinutes - startMinutes) / 60;
            if (durationHours < 0 || isNaN(durationHours)) durationHours = 0;
            totalHours += durationHours;
          } else if (lr.startDate && lr.endDate) {
            const start = new Date(lr.startDate);
            const end = new Date(lr.endDate);
            let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (days < 0 || isNaN(days)) days = 0;
            totalHours += days * 9;
          }
        } else if (leaveType === "sick" || leaveType === "vacation") {
          if (lr.startDate && lr.endDate) {
            const start = new Date(lr.startDate);
            const end = new Date(lr.endDate);
            let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (days < 0 || isNaN(days)) days = 0;
            totalHours += days * 9;
          }
        }
      }
      // Convert to days and hours
      const days = Math.floor(totalHours / 9);
      const hours = Math.round(totalHours % 9);
      res.json({ status: 'success', data: { days, hours } });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });
  return router;
};
