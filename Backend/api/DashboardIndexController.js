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
          leaveTypeName = leaveType ? leaveType.leave_type_th : leaveTypeName;
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
          leaveTypeName = leaveType ? leaveType.leave_type_th : leaveTypeName;
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

  // New API: /day-used - total leave duration for current user (days/hours)
  router.get('/day-used', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
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
      // Get all approved leave requests for this user and filter
      const leaves = await leaveRepo.find({ where });
      // Calculate total used leave in hours (all types)
      let totalHours = 0;
      function parseTimeToMinutes(t) {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + (m || 0);
      }
      for (const lr of leaves) {
        // If leaveType is a UUID, look up the entity (for display, not needed for calculation)
        let leaveTypeName = lr.leaveType;
        if (leaveTypeName && leaveTypeName.length > 20) {
          const leaveTypeEntity = await leaveTypeRepo.findOneBy({ id: leaveTypeName });
          leaveTypeName = leaveTypeEntity ? leaveTypeEntity.leave_type_th : leaveTypeName;
        }
        if (lr.startTime && lr.endTime) {
          // Hour-based
          const startMinutes = parseTimeToMinutes(lr.startTime);
          const endMinutes = parseTimeToMinutes(lr.endTime);
          let durationHours = (endMinutes - startMinutes) / 60;
          if (durationHours < 0 || isNaN(durationHours)) durationHours = 0;
          totalHours += durationHours;
        } else if (lr.startDate && lr.endDate) {
          // Day-based
          const start = new Date(lr.startDate);
          const end = new Date(lr.endDate);
          let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
          if (days < 0 || isNaN(days)) days = 0;
          totalHours += days * 9;
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

  router.get('/recent-leave-requests', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      const month = req.query.month ? parseInt(req.query.month) : null;
      const year = req.query.year ? parseInt(req.query.year) : null;
      let where = { Repid: userId };
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
      // Find 3 most recent leave requests
      const leaveRequests = await leaveRepo.find({ where, order: { createdAt: 'DESC' }, take: 3 });
      // Helper to calculate duration
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
      const result = [];
      for (const lr of leaveRequests) {
        let leaveTypeName = lr.leaveType;
        let leaveTypeNameTh = lr.leaveType;
        let leaveTypeNameEn = lr.leaveType;
        if (leaveTypeName && leaveTypeName.length > 20) {
          const leaveType = await leaveTypeRepo.findOneBy({ id: leaveTypeName });
          leaveTypeNameTh = leaveType ? leaveType.leave_type_th : leaveTypeName;
          leaveTypeNameEn = leaveType ? leaveType.leave_type_en : leaveTypeName;
        } else {
          // Try to find by name (for string-based leaveType)
          const leaveType = await leaveTypeRepo.findOne({
            where: [
              { leave_type_th: leaveTypeName },
              { leave_type_en: leaveTypeName }
            ]
          });
          if (leaveType) {
            leaveTypeNameTh = leaveType.leave_type_th;
            leaveTypeNameEn = leaveType.leave_type_en;
          }
        }
        // Calculate duration
        let duration = '';
        if (lr.startTime && lr.endTime) {
          // Hour-based (ทุกประเภท)
          const startMinutes = parseTimeToMinutes(lr.startTime);
          const endMinutes = parseTimeToMinutes(lr.endTime);
          let durationHours = (endMinutes - startMinutes) / 60;
          if (durationHours < 0 || isNaN(durationHours)) durationHours = 0;
          // แสดงเป็นจำนวนเต็มเท่านั้น (ปัดเศษทิ้ง)
          duration = `${Math.floor(durationHours)} hour`;
          
        } else if (lr.startDate && lr.endDate) {
          // Day-based
          const start = new Date(lr.startDate);
          const end = new Date(lr.endDate);
          let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
          if (days < 0 || isNaN(days)) days = 0;
          duration = `${days} day`;
        }
        result.push({
          leavetype: leaveTypeNameTh, // for backward compatibility
          leavetype_th: leaveTypeNameTh,
          leavetype_en: leaveTypeNameEn,
          duration,
          startdate: lr.startDate,
          status: lr.status
        });
      }
      res.json({ status: 'success', data: result });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  router.get('/my-backdated', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const month = req.query.month ? parseInt(req.query.month) : null;
      const year = req.query.year ? parseInt(req.query.year) : null;
      let where = { Repid: userId, backdated: true };
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
      // Count leave requests created by this user where backdated === true and matches filter
      const count = await leaveRepo.count({ where });
      res.json({ status: 'success', data: { count } });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // New API: /user-profile - Get current user profile information for card display
  router.get('/user-profile', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      
      // Get repositories
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const userRepo = AppDataSource.getRepository('User');
      const adminRepo = AppDataSource.getRepository('Admin');
      const superadminRepo = AppDataSource.getRepository('SuperAdmin');
      const departmentRepo = AppDataSource.getRepository('Department');
      const positionRepo = AppDataSource.getRepository('Position');

      // Find ProcessCheck entry by Repid (userId)
      const processCheck = await processRepo.findOne({ where: { Repid: userId } });
      if (!processCheck) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'User not found in ProcessCheck table' 
        });
      }

      // Get user details based on role
      let userProfile = null;
      let role = processCheck.Role;

      if (role === 'admin') {
        userProfile = await adminRepo.findOne({ where: { id: userId } });
      } else if (role === 'superadmin') {
        userProfile = await superadminRepo.findOne({ where: { id: userId } });
      } else {
        // Default to user
        userProfile = await userRepo.findOne({ where: { id: userId } });
      }

      if (!userProfile) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'User profile not found' 
        });
      }

      // Get user name based on role
      let userName = '';
      if (role === 'admin') {
        userName = userProfile.admin_name || '';
      } else if (role === 'superadmin') {
        userName = userProfile.superadmin_name || '';
      } else {
        userName = userProfile.User_name || '';
      }

      // Get department information
      let departmentInfo = {
        id: null,
        name_th: 'No Department',
        name_en: 'No Department'
      };
      if (userProfile.department) {
        const department = await departmentRepo.findOne({ where: { id: userProfile.department } });
        if (department) {
          departmentInfo = {
            id: department.id,
            name_th: department.department_name_th || 'No Department',
            name_en: department.department_name_en || 'No Department'
          };
        }
      }

      // Get position information
      let positionInfo = {
        id: null,
        name_th: 'No Position',
        name_en: 'No Position'
      };
      if (userProfile.position) {
        const position = await positionRepo.findOne({ where: { id: userProfile.position } });
        if (position) {
          positionInfo = {
            id: position.id,
            name_th: position.position_name_th || 'No Position',
            name_en: position.position_name_en || 'No Position'
          };
        }
      }

      res.json({
        status: 'success',
        data: {
          name: userName,
          email: processCheck.Email,
          avatar: processCheck.avatar_url,
          role: role,
          department: departmentInfo,
          position: positionInfo
        },
        message: 'User profile fetched successfully'
      });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });
  
  return router;
};

