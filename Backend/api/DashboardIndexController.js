const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const { Between } = require('typeorm');

module.exports = (AppDataSource) => {
  router.get('/dashboard-stats', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      // --- เพิ่ม filter เดือน/ปี และ user เฉพาะคนนั้น ---
      const month = req.query.month ? parseInt(req.query.month) : null;
      const year = req.query.year ? parseInt(req.query.year) : null;
      let where = { Repid: userId };
      if (month && year) {
        // filter เฉพาะ startDate ที่อยู่ในเดือน/ปีนั้น
        where = {
          ...where,
          startDate: Between(
            new Date(year, month - 1, 1),
            new Date(year, month, 0, 23, 59, 59, 999)
          )
        };
      } else if (year) {
        where = {
          ...where,
          startDate: Between(
            new Date(year, 0, 1),
            new Date(year, 11, 31, 23, 59, 59, 999)
          )
        };
      }
      const leaveHistory = await leaveRepo.find({ where });
      // Calculate days used - ปรับการคำนวณให้ถูกต้องตามประเภทการลา
      let daysUsed = 0;
      let hoursUsed = 0;
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');

      // Helper to normalize type
      const normalizeType = (type) => {
        if (!type) return null;
        if (["sick", "ลาป่วย"].includes(type)) return "sick";
        if (["vacation", "ลาพักผ่อน"].includes(type)) return "vacation";
        if (["personal", "ลากิจ"].includes(type)) return "personal";
        return null;
      };

      // Helper to parse HH:mm to minutes
      function parseTimeToMinutes(t) {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + (m || 0);
      }

      for (const lr of leaveHistory) {
        let leaveTypeName = lr.leaveType;
        if (leaveTypeName && leaveTypeName.length > 20) {
          const leaveType = await leaveTypeRepo.findOneBy({ id: leaveTypeName });
          leaveTypeName = leaveType ? leaveType.leave_type : leaveTypeName;
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
            hoursUsed += durationHours;
          } else if (lr.startDate && lr.endDate) {
            // Day-based, convert days to hours (1 day = 9 hours)
            const start = new Date(lr.startDate);
            const end = new Date(lr.endDate);
            let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (days < 0 || isNaN(days)) days = 0;
            hoursUsed += days * 9;
          }
        } else if (leaveType === "sick" || leaveType === "vacation") {
          // Sick/Vacation: only day-based
          if (lr.startDate && lr.endDate) {
            const start = new Date(lr.startDate);
            const end = new Date(lr.endDate);
            let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (days < 0 || isNaN(days)) days = 0;
            daysUsed += days;
          }
        }
      }

      // Convert hours to days if >= 9 hours
      const additionalDays = Math.floor(hoursUsed / 9);
      const remainingHours = Math.round(hoursUsed % 9);
      daysUsed += additionalDays;

      // Only use approved leaves for stats
      const approvedLeaves = leaveHistory.filter(lr => lr.status === 'approved');
      // Calculate leave days by type using leaveType name
      const leaveTypeStats = {};
      for (const lr of approvedLeaves) {
        let leaveTypeName = lr.leaveType;
        if (leaveTypeName && leaveTypeName.length > 20) {
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
          hoursUsed: remainingHours, // เพิ่มชั่วโมงที่เหลือ
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
      // --- เพิ่ม filter เดือน/ปี ---
      const month = req.query.month ? parseInt(req.query.month) : null;
      const year = req.query.year ? parseInt(req.query.year) : null;
      let where = { Repid: userId, status: 'approved' };
      if (month && year) {
        where = {
          ...where,
          startDate: Between(
            new Date(year, month - 1, 1),
            new Date(year, month, 0, 23, 59, 59, 999)
          )
        };
      } else if (year) {
        where = {
          ...where,
          startDate: Between(
            new Date(year, 0, 1),
            new Date(year, 11, 31, 23, 59, 59, 999)
          )
        };
      }
      // Only approved leaves for this user (filter ตามเดือน/ปี)
      const approvedLeaves = await leaveRepo.find({ where });
      // ดึง leaveType ทั้งหมด
      const allLeaveTypes = await leaveTypeRepo.find();
      // เตรียม result สำหรับทุก leaveType
      const leaveTypeStats = {};
      for (const lt of allLeaveTypes) {
        leaveTypeStats[lt.leave_type] = { days: 0, hours: 0 };
      }
      // Helper to normalize type
      const normalizeType = (type) => {
        if (!type) return null;
        if (["sick", "ลาป่วย"].includes(type)) return "sick";
        if (["vacation", "ลาพักผ่อน"].includes(type)) return "vacation";
        if (["personal", "ลากิจ"].includes(type)) return "personal";
        return type;
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
        // ถ้าไม่มีใน leaveTypeStats ให้ข้าม
        if (!leaveTypeStats[leaveTypeName]) continue;
        // Personal leave: hour-based or day-based
        if (["personal", "ลากิจ"].includes(leaveTypeName)) {
          if (lr.startTime && lr.endTime) {
            // Hour-based
            const startMinutes = parseTimeToMinutes(lr.startTime);
            const endMinutes = parseTimeToMinutes(lr.endTime);
            let durationHours = (endMinutes - startMinutes) / 60;
            if (durationHours < 0 || isNaN(durationHours)) durationHours = 0;
            leaveTypeStats[leaveTypeName].hours += durationHours;
          } else if (lr.startDate && lr.endDate) {
            // Day-based, convert days to hours (1 day = 9 hours)
            const start = new Date(lr.startDate);
            const end = new Date(lr.endDate);
            let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (days < 0 || isNaN(days)) days = 0;
            leaveTypeStats[leaveTypeName].hours += days * 9;
          }
        } else {
          // Sick/Vacation/Other: only day-based
          if (lr.startDate && lr.endDate) {
            const start = new Date(lr.startDate);
            const end = new Date(lr.endDate);
            let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (days < 0 || isNaN(days)) days = 0;
            leaveTypeStats[leaveTypeName].days += days;
          }
        }
      }
      // ปัดเศษชั่วโมง
      for (const key in leaveTypeStats) {
        leaveTypeStats[key].hours = Math.round(leaveTypeStats[key].hours);
        if (["personal", "ลากิจ"].includes(key)) {
          // ถ้าเกิน 9 ชั่วโมง ให้แปลงเป็นวัน
          const addDays = Math.floor(leaveTypeStats[key].hours / 9);
          leaveTypeStats[key].days += addDays;
          leaveTypeStats[key].hours = leaveTypeStats[key].hours % 9;
        }
      }
      // รวมวันและชั่วโมงทั้งหมด
      let totalDays = 0;
      let totalHours = 0;
      Object.values(leaveTypeStats).forEach(stat => {
        totalDays += stat.days || 0;
        totalHours += stat.hours || 0;
      });
      totalDays += Math.floor(totalHours / 9);
      totalHours = totalHours % 9;
      res.json({
        status: 'success',
        data: {
          leaveTypeStats,
          totalDays,
          totalHours
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
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const leaveQuotaRepo = AppDataSource.getRepository('LeaveQuota');

      // Get user and their position (check both User and Admin tables)
      let user = await userRepo.findOneBy({ id: userId });
      if (!user) {
        user = await adminRepo.findOneBy({ id: userId });
      }
      if (!user || !user.position) {
        return res.status(404).json({ status: 'error', message: 'User or position not found' });
      }

      // Get leave quota for this position
      const quota = await leaveQuotaRepo.findOneBy({ positionId: user.position });
      if (!quota) {
        return res.status(404).json({ status: 'error', message: 'Leave quota not found for this position' });
      }
      // Sum sick, vacation, personal (in hours)
      const totalQuotaHours = ((quota.sick || 0) + (quota.vacation || 0) + (quota.personal || 0)) * 9;

      // Get all approved leave requests for this user
      const approvedLeaves = await leaveRepo.find({ where: { Repid: userId, status: 'approved' } });
      // Helper to normalize type
      const normalizeType = (type) => {
        if (!type) return null;
        if (["sick", "ลาป่วย"].includes(type)) return "sick";
        if (["vacation", "ลาพักผ่อน"].includes(type)) return "vacation";
        if (["personal", "ลากิจ"].includes(type)) return "personal";
        return null;
      };
      // Calculate used leave in hours
      let usedHours = 0;
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      function parseTimeToMinutes(t) {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + (m || 0);
      }
      for (const lr of approvedLeaves) {
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
            usedHours += durationHours;
          } else if (lr.startDate && lr.endDate) {
            const start = new Date(lr.startDate);
            const end = new Date(lr.endDate);
            let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (days < 0 || isNaN(days)) days = 0;
            usedHours += days * 9;
          }
        } else if (leaveType === "sick" || leaveType === "vacation") {
          if (lr.startDate && lr.endDate) {
            const start = new Date(lr.startDate);
            const end = new Date(lr.endDate);
            let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (days < 0 || isNaN(days)) days = 0;
            usedHours += days * 9;
          }
        }
      }
      // Calculate remaining
      let remaining = totalQuotaHours - usedHours;
      if (remaining < 0) remaining = 0;
      res.json({ status: 'success', data: {
        days: Math.floor(remaining / 9),
        hours: Math.round(remaining % 9)
      }});
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
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');

      // Get user (check both User and Admin tables)
      let user = await userRepo.findOneBy({ id: userId });
      if (!user) {
        user = await adminRepo.findOneBy({ id: userId });
      }
      if (!user) {
        return res.status(404).json({ status: 'error', message: 'User not found' });
      }

      // Get all leave requests for this user
      const leaves = await leaveRepo.find({ where: { Repid: userId } });
      // Helper to normalize type
      const normalizeType = (type) => {
        if (!type) return null;
        if (["sick", "ลาป่วย"].includes(type)) return "sick";
        if (["vacation", "ลาพักผ่อน"].includes(type)) return "vacation";
        if (["personal", "ลากิจ"].includes(type)) return "personal";
        return null;
      };
      // Calculate total used leave in hours
      let totalHours = 0;
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      function parseTimeToMinutes(t) {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + (m || 0);
      }
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

