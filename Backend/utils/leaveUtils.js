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
  processLeaveData,
  validateLeaveRequest,
  calculateLeaveStats,
  formatLeaveDuration,
  getLeaveStatusColor
}; 