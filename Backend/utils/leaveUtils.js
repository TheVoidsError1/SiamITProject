/**
 * Leave Management Utility Functions
 * Centralized utilities for leave-related operations and data processing
 */

const config = require('../config');



/**
 * Check if time is within working hours
 * @param {string} timeStr - Time string in HH:MM format
 * @returns {boolean} True if within working hours
 */
const isWithinWorkingHours = (timeStr) => {
  if (!timeStr || !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
    return false;
  }
  
  const [h, m] = timeStr.split(':').map(Number);
  const minutes = h * 60 + m;
  
  return minutes >= config.business.workingStartHour * 60 && 
         minutes <= config.business.workingEndHour * 60;
};

/**
 * Calculate working hours for a given number of days
 * @param {number} days - Number of days
 * @returns {number} Total working hours
 */
const calculateWorkingHours = (days) => {
  return days * config.business.workingHoursPerDay;
};

/**
 * Convert hours to days using working hours per day (9 hours = 1 day)
 * @param {number} hours - Number of hours
 * @returns {Object} Object with days and remaining hours
 */
const convertHoursToDays = (hours) => {
  if (hours < config.business.workingHoursPerDay) {
    return { days: 0, hours: hours };
  }
  
  const days = Math.floor(hours / config.business.workingHoursPerDay);
  const remainingHours = hours % config.business.workingHoursPerDay;
  
  return { days, hours: remainingHours };
};

/**
 * Get leave usage from LeaveUsed table for a specific user and leave type
 * @param {string} userId - User ID
 * @param {string} leaveTypeId - Leave type ID
 * @param {number} year - Year to filter (optional)
 * @param {Object} AppDataSource - TypeORM DataSource
 * @returns {Promise<Object>} Leave usage data
 */
const getLeaveUsageFromTable = async (userId, leaveTypeId, year = null, AppDataSource) => {
  try {
    const leaveUsedRepo = AppDataSource.getRepository('LeaveUsed');
    const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
    
    let whereClause = { 
      user_id: userId, 
      leave_type_id: leaveTypeId 
    };
    
    // Add year filtering if provided
    if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);
      whereClause.created_at = { $gte: startDate, $lte: endDate };
    }
    
    const leaveUsedRecord = await leaveUsedRepo.findOne({ where: whereClause });
    const leaveType = await leaveTypeRepo.findOneBy({ id: leaveTypeId });
    
    if (!leaveUsedRecord) {
      return {
        user_id: userId,
        leave_type_id: leaveTypeId,
        leave_type_name_th: leaveType?.leave_type_th || 'ไม่ระบุ',
        leave_type_name_en: leaveType?.leave_type_en || 'Unknown',
        days: 0,
        hours: 0,
        total_days: 0
      };
    }
    
    // Calculate total days (including hours converted to days)
    const totalDays = leaveUsedRecord.days + (leaveUsedRecord.hour / config.business.workingHoursPerDay);
    
    return {
      id: leaveUsedRecord.id,
      user_id: leaveUsedRecord.user_id,
      leave_type_id: leaveUsedRecord.leave_type_id,
      leave_type_name_th: leaveType?.leave_type_th || 'ไม่ระบุ',
      leave_type_name_en: leaveType?.leave_type_en || 'Unknown',
      days: leaveUsedRecord.days || 0,
      hours: leaveUsedRecord.hour || 0,
      total_days: totalDays,
      created_at: leaveUsedRecord.created_at,
      updated_at: leaveUsedRecord.updated_at
    };
  } catch (error) {
    console.error('Error getting leave usage from table:', error);
    throw error;
  }
};

/**
 * Get user's leave quota for a specific leave type
 * @param {string} userId - User ID
 * @param {string} leaveTypeId - Leave type ID
 * @param {Object} AppDataSource - TypeORM DataSource
 * @returns {Promise<number>} Leave quota in days
 */
const getUserLeaveQuota = async (userId, leaveTypeId, AppDataSource) => {
  try {
    const leaveQuotaRepo = AppDataSource.getRepository('LeaveQuota');
    const userRepo = AppDataSource.getRepository('User');
    const adminRepo = AppDataSource.getRepository('Admin');
    const superAdminRepo = AppDataSource.getRepository('SuperAdmin');
    
    // Check which user table the user belongs to
    let user = await userRepo.findOneBy({ id: userId });
    let userTable = 'User';
    
    if (!user) {
      user = await adminRepo.findOneBy({ id: userId });
      userTable = 'Admin';
    }
    
    if (!user) {
      user = await superAdminRepo.findOneBy({ id: userId });
      userTable = 'SuperAdmin';
    }
    
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    
    // Get leave quota
    const quota = await leaveQuotaRepo.findOne({
      where: { 
        user_id: userId, 
        leave_type_id: leaveTypeId 
      }
    });
    
    return quota ? quota.quota : 0;
  } catch (error) {
    console.error('Error getting user leave quota:', error);
    throw error;
  }
};

/**
 * Calculate remaining leave for a user and leave type
 * @param {string} userId - User ID
 * @param {string} leaveTypeId - Leave type ID
 * @param {number} year - Year to filter (optional)
 * @param {Object} AppDataSource - TypeORM DataSource
 * @returns {Promise<Object>} Remaining leave data
 */
const calculateRemainingLeave = async (userId, leaveTypeId, year = null, AppDataSource) => {
  try {
    const quota = await getUserLeaveQuota(userId, leaveTypeId, AppDataSource);
    const usage = await getLeaveUsageFromTable(userId, leaveTypeId, year, AppDataSource);
    
    const totalQuotaDays = quota;
    const totalUsedDays = usage.total_days;
    const remainingDays = Math.max(0, totalQuotaDays - totalUsedDays);
    
    return {
      user_id: userId,
      leave_type_id: leaveTypeId,
      leave_type_name_th: usage.leave_type_name_th,
      leave_type_name_en: usage.leave_type_name_en,
      quota_days: totalQuotaDays,
      used_days: usage.days,
      used_hours: usage.hours,
      total_used_days: totalUsedDays,
      remaining_days: remainingDays
    };
  } catch (error) {
    console.error('Error calculating remaining leave:', error);
    throw error;
  }
};

/**
 * Get leave usage summary for a user across all leave types
 * @param {string} userId - User ID
 * @param {number} year - Year to filter (optional)
 * @param {Object} AppDataSource - TypeORM DataSource
 * @returns {Promise<Array>} Array of leave usage summary objects
 */
const getLeaveUsageSummary = async (userId, year = null, AppDataSource) => {
  try {
    const leaveUsedRepo = AppDataSource.getRepository('LeaveUsed');
    const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
    const leaveQuotaRepo = AppDataSource.getRepository('LeaveQuota');
    
    let whereClause = { user_id: userId };
    
    // Add year filtering if provided
    if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);
      whereClause.created_at = { $gte: startDate, $lte: endDate };
    }
    
    const leaveUsedRecords = await leaveUsedRepo.find({ where: whereClause });
    
    // Get all leave types to ensure we include types with 0 usage
    const allLeaveTypes = await leaveTypeRepo.find();
    
    const summary = await Promise.all(
      allLeaveTypes.map(async (leaveType) => {
        const usage = leaveUsedRecords.find(record => record.leave_type_id === leaveType.id);
        const quota = await leaveQuotaRepo.findOne({
          where: { user_id: userId, leave_type_id: leaveType.id }
        });
        
        const quotaDays = quota ? quota.quota : 0;
        const usedDays = usage ? usage.days : 0;
        const usedHours = usage ? usage.hour : 0;
        const totalUsedDays = usage ? (usedDays + (usedHours / config.business.workingHoursPerDay)) : 0;
        const remainingDays = Math.max(0, quotaDays - totalUsedDays);
        
        return {
          leave_type_id: leaveType.id,
          leave_type_name_th: leaveType.leave_type_th,
          leave_type_name_en: leaveType.leave_type_en,
          quota_days: quotaDays,
          used_days: usedDays,
          used_hours: usedHours,
          total_used_days: totalUsedDays,
          remaining_days: remainingDays
        };
      })
    );
    
    return summary;
  } catch (error) {
    console.error('Error getting leave usage summary:', error);
    throw error;
  }
};

/**
 * Process leave data with department and position information
 * @param {Array} leaves - Array of leave objects
 * @param {Object} AppDataSource - TypeORM DataSource
 * @returns {Promise<Array>} Processed leave data
 */
const processLeaveData = async (leaves, AppDataSource) => {
  const userRepo = AppDataSource.getRepository('User');
  const departmentRepo = AppDataSource.getRepository('Department');
  const positionRepo = AppDataSource.getRepository('Position');
  
  return await Promise.all(leaves.map(async (leave) => {
    try {
      // Get user information
      const user = await userRepo.findOne({
        where: { id: leave.user_id },
        relations: ['department', 'position']
      });
      
      if (user) {
        leave.user = {
          id: user.id,
          name: user.User_name,
          department: user.department?.department_name || 'Unknown',
          position: user.position?.position_name || 'Unknown'
        };
      }
      
      // Normalize leave type
      leave.leaveType = normalizeLeaveType(leave.leaveType);
      
      return leave;
    } catch (error) {
      console.error('Error processing leave data:', error);
      return leave;
    }
  }));
};

/**
 * Validate leave request data
 * @param {Object} leaveData - Leave request data
 * @returns {Object} Validation result with isValid and errors
 */
const validateLeaveRequest = (leaveData) => {
  const errors = [];
  
  // Required fields
  if (!leaveData.startDate) errors.push('Start date is required');
  if (!leaveData.endDate) errors.push('End date is required');
  if (!leaveData.leaveType) errors.push('Leave type is required');
  if (!leaveData.reason) errors.push('Reason is required');
  
  // Date validation
  if (leaveData.startDate && leaveData.endDate) {
    const startDate = new Date(leaveData.startDate);
    const endDate = new Date(leaveData.endDate);
    
    if (startDate > endDate) {
      errors.push('Start date cannot be after end date');
    }
    
    if (startDate < new Date(config.business.minDate)) {
      errors.push(`Start date cannot be before ${config.business.minDate}`);
    }
    
    if (endDate > new Date(config.business.maxDate)) {
      errors.push(`End date cannot be after ${config.business.maxDate}`);
    }
  }
  
  // Time validation for partial day leaves
  if (leaveData.startTime && leaveData.endTime) {
    if (!isWithinWorkingHours(leaveData.startTime)) {
      errors.push(`Start time must be within working hours (${config.business.workingStartHour}:00 - ${config.business.workingEndHour}:00)`);
    }
    
    if (!isWithinWorkingHours(leaveData.endTime)) {
      errors.push(`End time must be within working hours (${config.business.workingStartHour}:00 - ${config.business.workingEndHour}:00)`);
    }
  }
  
  // Leave type length validation
  if (leaveData.leaveType && leaveData.leaveType.length > 20) {
    errors.push('Leave type name cannot exceed 20 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculate leave statistics
 * @param {Array} leaves - Array of leave objects
 * @returns {Object} Leave statistics
 */
const calculateLeaveStats = (leaves) => {
  const stats = {
    total: leaves.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    byType: {}
  };
  
  leaves.forEach(leave => {
    // Count by status
    switch (leave.status?.toLowerCase()) {
      case 'pending':
        stats.pending++;
        break;
      case 'approved':
        stats.approved++;
        break;
      case 'rejected':
        stats.rejected++;
        break;
    }
    
    // Count by type
    const type = normalizeLeaveType(leave.leaveType);
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  });
  
  return stats;
};

/**
 * Format leave duration for display
 * @param {number} days - Number of days
 * @param {number} hours - Number of hours
 * @returns {string} Formatted duration string
 */
const formatLeaveDuration = (days, hours) => {
  if (days > 0 && hours > 0) {
    return `${days} day(s) ${hours} hour(s)`;
  } else if (days > 0) {
    return `${days} day(s)`;
  } else if (hours > 0) {
    return `${hours} hour(s)`;
  }
  return '0 hours';
};

/**
 * Get leave status color for UI
 * @param {string} status - Leave status
 * @returns {string} CSS color class
 */
const getLeaveStatusColor = (status) => {
  const statusColors = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger',
    'cancelled': 'secondary'
  };
  
  return statusColors[status?.toLowerCase()] || 'info';
};

module.exports = {
  isWithinWorkingHours,
  calculateWorkingHours,
  convertHoursToDays,
  getLeaveUsageFromTable,
  getUserLeaveQuota,
  calculateRemainingLeave,
  getLeaveUsageSummary,
  processLeaveData,
  validateLeaveRequest,
  calculateLeaveStats,
  formatLeaveDuration,
  getLeaveStatusColor
}; 