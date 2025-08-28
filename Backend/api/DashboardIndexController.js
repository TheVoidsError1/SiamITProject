const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const { Between } = require('typeorm');
const config = require('../config');
const { 
  convertToMinutes, 
  calculateDaysBetween,
  convertTimeRangeToDecimal
} = require('../utils');

module.exports = (AppDataSource) => {
  // Test endpoint to verify database connection
  router.get('/test-db', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      console.log('Test DB endpoint - userId:', userId);
      
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const count = await leaveRepo.count({ where: { Repid: userId } });
      
      res.json({ 
        status: 'success', 
        data: { 
          userId, 
          totalLeaveRequests: count,
          message: 'Database connection working'
        } 
      });
    } catch (err) {
      console.error('Test DB error:', err);
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  router.get('/dashboard-stats', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      console.log('Dashboard stats requested for userId:', userId);
      
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      
      // --- เพิ่ม filter เดือน/ปี และ user เฉพาะคนนั้น ---
      const month = req.query.month ? parseInt(req.query.month) : null;
      const year = req.query.year ? parseInt(req.query.year) : null;
      console.log('Filter params - month:', month, 'year:', year);
      
      let where = { Repid: userId };
      if (month && year) {
        // filter เฉพาะ startDate ที่อยู่ในเดือน/ปีนั้น
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        console.log('Date range - start:', startDate, 'end:', endDate);
        where = {
          ...where,
          startDate: Between(startDate, endDate)
        };
      } else if (year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        console.log('Date range - start:', startDate, 'end:', endDate);
        where = {
          ...where,
          startDate: Between(startDate, endDate)
        };
      }
      console.log('Query where clause:', JSON.stringify(where, null, 2));
      
      const leaveHistory = await leaveRepo.find({ where });
      console.log('Found leave history count:', leaveHistory.length);
      
      // Recalculate usage directly from approved leave requests (reflect deletions immediately)
      let rawDays = 0;
      let rawHours = 0;
      const approvedLeaves = leaveHistory.filter(lr => lr.status === 'approved');
      for (const lr of approvedLeaves) {
        if (lr.startTime && lr.endTime) {
          const startMinutes = convertToMinutes(...lr.startTime.split(':').map(Number));
          const endMinutes = convertToMinutes(...lr.endTime.split(':').map(Number));
          let durationHours = (endMinutes - startMinutes) / 60;
          if (durationHours < 0 || isNaN(durationHours)) durationHours = 0;
          rawHours += Math.floor(durationHours);
        } else if (lr.startDate && lr.endDate) {
          const start = new Date(lr.startDate);
          const end = new Date(lr.endDate);
          let days = calculateDaysBetween(start, end);
          if (days < 0 || isNaN(days)) days = 0;
          rawDays += days;
        }
      }
      const additionalDays = Math.floor(rawHours / config.business.workingHoursPerDay);
      const remainingHours = Math.round(rawHours % config.business.workingHoursPerDay);
      const daysUsed = rawDays + additionalDays;
      const hoursUsed = remainingHours;
      
      // Convert to leaveTypeStats format for backward compatibility
      const leaveTypeStats = {};
      // keep previous structure but values may not be exact breakdown here
      
      // Pending requests for this user
      const pendingRequests = leaveHistory.filter(lr => lr.status === 'pending').length;
      // Approved requests
      const approvedRequests = leaveHistory.filter(lr => lr.status === 'approved').length;
      // Approval rate
      const totalRequests = leaveHistory.length;
      const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;
      // Remaining days (configurable limit)
      const remainingDays = Math.max(0, config.business.maxLeaveDays - daysUsed);
      
      console.log('Final stats - daysUsed:', daysUsed, 'hoursUsed:', remainingHours, 'remainingDays:', remainingDays);
      
      res.json({
        status: 'success',
        data: {
          leaveHistory,
          daysUsed,
          hoursUsed: remainingHours, // ชั่วโมงที่เหลือหลังแปลงเป็นวัน
          pendingRequests,
          approvalRate,
          remainingDays,
          leaveTypeStats
        },
        message: 'Dashboard stats fetched successfully'
      });
    } catch (err) {
      console.error('Dashboard stats error:', err);
      console.error('Error stack:', err.stack);
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
      // Use centralized utility function for leave usage summary
      const { getLeaveUsageSummary } = require('../utils/leaveUtils');
      const leaveUsageSummary = await getLeaveUsageSummary(userId, year, AppDataSource);
      
      // Calculate total hours from all leave types
      let totalHours = 0;
      leaveUsageSummary.forEach(item => {
        totalHours += (item.used_days * config.business.workingHoursPerDay) + item.used_hours;
      });
      
      // Convert to days and hours
      const days = Math.floor(totalHours / config.business.workingHoursPerDay);
      const hours = Math.round(totalHours % config.business.workingHoursPerDay);
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
      // Helper to calculate duration - using utility function
      
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
          const startMinutes = convertToMinutes(...lr.startTime.split(':').map(Number));
          const endMinutes = convertToMinutes(...lr.endTime.split(':').map(Number));
          let durationHours = (endMinutes - startMinutes) / 60;
          if (durationHours < 0 || isNaN(durationHours)) durationHours = 0;
          // แสดงเป็นจำนวนเต็มเท่านั้น (ปัดเศษทิ้ง)
          duration = `${Math.floor(durationHours)} hour`;
          
        } else if (lr.startDate && lr.endDate) {
          // Day-based
          const start = new Date(lr.startDate);
          const end = new Date(lr.endDate);
          let days = calculateDaysBetween(start, end);
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

