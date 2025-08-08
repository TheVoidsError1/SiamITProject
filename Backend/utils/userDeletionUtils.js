/**
 * User Deletion Utilities
 * Provides comprehensive deletion functionality for users, admins, and superadmins
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Parse attachments JSON string safely (same as LeaveRequestController)
 * @param {string} val - JSON string of attachments
 * @returns {Array} Array of attachment filenames
 */
function parseAttachments(val) {
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch (e) {
    console.error('Invalid attachments JSON:', val, e);
    return [];
  }
}

/**
 * Delete all files and data related to a user
 * @param {Object} AppDataSource - Database connection
 * @param {string} userId - User ID to delete
 * @param {string} userRole - User role ('user', 'admin', 'superadmin')
 * @returns {Promise<Object>} Deletion summary
 */
async function deleteUserData(AppDataSource, userId, userRole) {
  const processRepo = AppDataSource.getRepository('ProcessCheck');
  const leaveRequestRepo = AppDataSource.getRepository('LeaveRequest');
  const leaveUsedRepo = AppDataSource.getRepository('LeaveUsed');
  
  const deletionSummary = {
    avatarDeleted: false,
    leaveRequestsDeleted: 0,
    leaveAttachmentsDeleted: 0,
    leaveUsageRecordsDeleted: 0,
    errors: []
  };

  try {
    // Get process check info for avatar cleanup
    const processCheck = await processRepo.findOneBy({ Repid: userId, Role: userRole });

    // Delete avatar file if exists
    if (processCheck && processCheck.avatar_url) {
      try {
        const avatarPath = path.join(config.getAvatarsUploadPath(), path.basename(processCheck.avatar_url));
        if (fs.existsSync(avatarPath)) {
          fs.unlinkSync(avatarPath);
          deletionSummary.avatarDeleted = true;
          console.log(`Deleted avatar file: ${avatarPath}`);
        }
      } catch (avatarError) {
        console.error('Error deleting avatar file:', avatarError);
        deletionSummary.errors.push(`Avatar deletion error: ${avatarError.message}`);
      }
    }

    // Delete all leave requests by this user
    const leaveRequests = await leaveRequestRepo.findBy({ Repid: userId });
    for (const leave of leaveRequests) {
      // Delete attachment files for each leave request (using same logic as LeaveRequestController)
      if (leave.attachments) {
        try {
          const attachments = parseAttachments(leave.attachments);
          const leaveUploadsPath = config.getLeaveUploadsPath();
          
          for (const attachment of attachments) {
            const filePath = path.join(leaveUploadsPath, attachment);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              deletionSummary.leaveAttachmentsDeleted++;
              console.log(`Deleted leave attachment: ${filePath}`);
            } else {
              console.log(`Leave attachment file not found: ${filePath}`);
            }
          }
        } catch (fileError) {
          console.error('Error deleting leave attachments:', fileError);
          deletionSummary.errors.push(`Leave attachment deletion error: ${fileError.message}`);
        }
      }
    }
    
    await leaveRequestRepo.delete({ Repid: userId });
    deletionSummary.leaveRequestsDeleted = leaveRequests.length;
    console.log(`Deleted ${leaveRequests.length} leave requests for ${userRole} ${userId}`);

    // Delete leave usage records
    const leaveUsedRecords = await leaveUsedRepo.findBy({ user_id: userId });
    await leaveUsedRepo.delete({ user_id: userId });
    deletionSummary.leaveUsageRecordsDeleted = leaveUsedRecords.length;
    console.log(`Deleted ${leaveUsedRecords.length} leave usage records for ${userRole} ${userId}`);

    // Delete from process_check
    await processRepo.delete({ Repid: userId, Role: userRole });

  } catch (error) {
    console.error(`Error in deleteUserData for ${userRole} ${userId}:`, error);
    deletionSummary.errors.push(`General deletion error: ${error.message}`);
  }

  return deletionSummary;
}

/**
 * Delete user with comprehensive cleanup
 * @param {Object} AppDataSource - Database connection
 * @param {string} userId - User ID to delete
 * @param {string} userRole - User role ('user', 'admin', 'superadmin')
 * @param {Object} userRepo - User repository (User, Admin, or SuperAdmin)
 * @returns {Promise<Object>} Deletion result
 */
async function deleteUserComprehensive(AppDataSource, userId, userRole, userRepo) {
  try {
    // Check if user exists
    const user = await userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new Error(`${userRole} not found`);
    }

    // Delete all related data and files
    const deletionSummary = await deleteUserData(AppDataSource, userId, userRole);

    // Delete from user table
    const result = await userRepo.delete({ id: userId });
    if (result.affected === 0) {
      throw new Error(`${userRole} not found`);
    }

    return {
      success: true,
      message: `${userRole} and all related data deleted successfully`,
      deletionSummary
    };

  } catch (error) {
    throw error;
  }
}

module.exports = {
  deleteUserData,
  deleteUserComprehensive,
  parseAttachments
};
