const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { avatarUpload, handleUploadError } = require('../middleware/fileUploadMiddleware');
const { 
  hashPassword, 
  verifyToken, 
  sendSuccess, 
  sendError, 
  sendUnauthorized,
  toDayHour,
  calculateDaysBetween,
  convertTimeRangeToDecimal
} = require('../utils');

console.log('ProfileController is being loaded...');

module.exports = (AppDataSource) => {
  console.log('ProfileController module function is being executed...');
  const router = express.Router();

  // File upload middleware is now imported from fileUploadMiddleware.js

  /**
   * @swagger
   * /api/profile:
   *   get:
   *     summary: Get the logged-in user's profile information
   *     description: >
   *       Returns the name, email, position, and department of the currently logged-in user.
   *       The system checks the JWT token, finds the user in the ProcessCheck table by token,
   *       and then fetches profile info from the User or Admin table based on the user's role.
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile data for the logged-in user
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     name:
   *                       type: string
   *                       example: John Doe
   *                     email:
   *                       type: string
   *                       example: john@example.com
   *                     position:
   *                       type: string
   *                       example: Software Developer
   *                     department:
   *                       type: string
   *                       example: IT Department
   *       401:
   *         description: No or invalid token provided
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: Access token required
   *       403:
   *         description: Invalid token
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: Invalid token
   *       404:
   *         description: User not found in ProcessCheck/User/Admin table
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: User not found in ProcessCheck
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  router.get('/profile', async (req, res) => {
    try {
      // 1. Get token from Authorization header
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }

      // 2. Decode token to get payload
      let payload;
      try {
        payload = jwt.verify(token, config.server.jwtSecret);
      } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }

      // 3. Find user in ProcessCheck table by token
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const processCheck = await processRepo.findOne({ where: { Token: token } });
      if (!processCheck) {
        return res.status(404).json({ success: false, message: 'User not found in ProcessCheck' });
      }

      const { Role: role, Repid: repid, Email: email } = processCheck;
      let profile = { email };

      const departmentRepo = AppDataSource.getRepository('Department');
      const positionRepo = AppDataSource.getRepository('Position');
      let userEntity = null;
      if (role === 'admin') {
        const adminRepo = AppDataSource.getRepository('Admin');
        userEntity = await adminRepo.findOne({ where: { id: repid } });
        if (!userEntity) return res.status(404).json({ success: false, message: 'Admin not found' });
        profile.name = userEntity.admin_name;
      } else if (role === 'superadmin') {
        const superadminRepo = AppDataSource.getRepository('SuperAdmin');
        userEntity = await superadminRepo.findOne({ where: { id: repid } });
        if (!userEntity) return res.status(404).json({ success: false, message: 'SuperAdmin not found' });
        profile.name = userEntity.superadmin_name;
      } else {
        const userRepo = AppDataSource.getRepository('User');
        userEntity = await userRepo.findOne({ where: { id: repid } });
        if (!userEntity) return res.status(404).json({ success: false, message: 'User not found' });
        profile.name = userEntity.User_name;
      }
      // Department
      let department = null;
      if (userEntity.department) {
        department = await departmentRepo.findOne({ where: { id: userEntity.department } });
      }
      const lang = (req.headers['accept-language'] || 'en').toLowerCase().startsWith('th') ? 'th' : 'en';
      profile.department_id = department ? department.id : '';
      profile.department_name = department ? (lang === 'th' ? department.department_name_th : department.department_name_en) : '';
      profile.department_name_th = department ? department.department_name_th : '';
      profile.department_name_en = department ? department.department_name_en : '';
      // Position
      let position = null;
      if (userEntity.position) {
        position = await positionRepo.findOne({ where: { id: userEntity.position } });
      }
      profile.position_id = position ? position.id : '';
      profile.position_name = position ? (lang === 'th' ? position.position_name_th : position.position_name_en) : '';
      profile.position_name_th = position ? position.position_name_th : '';
      profile.position_name_en = position ? position.position_name_en : '';
      
      // Add nested objects for frontend compatibility
      profile.position = position ? {
        id: position.id,
        name_th: position.position_name_th,
        name_en: position.position_name_en
      } : null;
      
      profile.department = department ? {
        id: department.id,
        name_th: department.department_name_th,
        name_en: department.department_name_en
      } : null;
      
      return res.json({ success: true, data: profile });
    } catch (err) {
      console.error('Profile error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  /**
   * @swagger
   * /api/profile:
   *   put:
   *     summary: Update the logged-in user's profile information
   *     description: >
   *       Allows the user to update their name, email, position, and department. The system checks the JWT token, finds the user in the ProcessCheck table by token, and updates the User or Admin table based on the user's role.
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *               position:
   *                 type: string
   *               department:
   *                 type: string
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *       401:
   *         description: No or invalid token provided
   *       403:
   *         description: Invalid token
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  router.put('/profile', async (req, res) => {
    try {
      const lang = (req.headers['accept-language'] || 'en').toLowerCase().startsWith('th') ? 'th' : 'en';
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }
      let payload;
      try {
        payload = jwt.verify(token, config.server.jwtSecret);
      } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const processCheck = await processRepo.findOne({ where: { Token: token } });
      if (!processCheck) {
        return res.status(404).json({ success: false, message: 'User not found in ProcessCheck' });
      }
      const { Role: role, Repid: repid, Email: email } = processCheck;
      const { name, email: newEmail, position_id, department_id, password } = req.body;
      const departmentRepo = AppDataSource.getRepository('Department');
      const positionRepo = AppDataSource.getRepository('Position');
      let updated;
      let hashedPassword = null;
      if (password) {
        hashedPassword = await hashPassword(password);
      }
      let userEntity = null;
      if (role === 'admin') {
        const adminRepo = AppDataSource.getRepository('Admin');
        userEntity = await adminRepo.findOne({ where: { id: repid } });
        if (!userEntity) return res.status(404).json({ success: false, message: 'Admin not found' });
        userEntity.admin_name = name || userEntity.admin_name;
        userEntity.email = newEmail || userEntity.email;
        userEntity.department = department_id || userEntity.department;
        userEntity.position = position_id || userEntity.position;
        if (hashedPassword) userEntity.password = hashedPassword;
        updated = await adminRepo.save(userEntity);
      } else if (role === 'superadmin') {
        const superadminRepo = AppDataSource.getRepository('SuperAdmin');
        userEntity = await superadminRepo.findOne({ where: { id: repid } });
        if (!userEntity) return res.status(404).json({ success: false, message: 'SuperAdmin not found' });
        userEntity.superadmin_name = name || userEntity.superadmin_name;
        userEntity.email = newEmail || userEntity.email;
        userEntity.department = department_id || userEntity.department;
        userEntity.position = position_id || userEntity.position;
        if (hashedPassword) userEntity.password = hashedPassword;
        updated = await superadminRepo.save(userEntity);
      } else {
        const userRepo = AppDataSource.getRepository('User');
        userEntity = await userRepo.findOne({ where: { id: repid } });
        if (!userEntity) return res.status(404).json({ success: false, message: 'User not found' });
        userEntity.User_name = name || userEntity.User_name;
        userEntity.email = newEmail || userEntity.email;
        userEntity.department = department_id || userEntity.department;
        userEntity.position = position_id || userEntity.position;
        if (hashedPassword) userEntity.password = hashedPassword;
        updated = await userRepo.save(userEntity);
      }
      // Update password in ProcessCheck if changed
      if (hashedPassword) {
        processCheck.Password = hashedPassword;
        await processRepo.save(processCheck);
      }
      // Return updated profile in the same format as GET
      let profile = { email: updated.email || email };
      // Department
      let department = null;
      if (updated.department) {
        department = await departmentRepo.findOne({ where: { id: updated.department } });
      }
      profile.department_id = department ? department.id : '';
      profile.department_name = department ? (lang === 'th' ? department.department_name_th : department.department_name_en) : '';
      profile.department_name_th = department ? department.department_name_th : '';
      profile.department_name_en = department ? department.department_name_en : '';
      // Position
      let position = null;
      if (updated.position) {
        position = await positionRepo.findOne({ where: { id: updated.position } });
      }
      profile.position_id = position ? position.id : '';
      profile.position_name = position ? (lang === 'th' ? position.position_name_th : position.position_name_en) : '';
      profile.position_name_th = position ? position.position_name_th : '';
      profile.position_name_en = position ? position.position_name_en : '';
      // Name
      if (role === 'admin') profile.name = updated.admin_name;
      else if (role === 'superadmin') profile.name = updated.superadmin_name;
      else profile.name = updated.User_name;
      return res.json({ success: true, data: profile });
    } catch (err) {
      console.error('Profile update error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  /**
   * @swagger
   * /api/avatar:
   *   post:
   *     summary: Upload avatar image for logged-in user
   *     description: >
   *       Uploads an avatar image for the currently logged-in user and stores the URL in the ProcessCheck table.
   *       The image is saved to the server and the avatar_url field is updated in the database.
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               avatar:
   *                 type: string
   *                 format: binary
   *                 description: Image file to upload (max 5MB)
   *     responses:
   *       200:
   *         description: Avatar uploaded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Avatar uploaded successfully
   *                 avatar_url:
   *                   type: string
   *                   example: /uploads/avatars/avatar-1234567890.jpg
   *       400:
   *         description: Invalid file or no file provided
   *       401:
   *         description: No or invalid token provided
   *       403:
   *         description: Invalid token
   *       404:
   *         description: User not found in ProcessCheck
   *       500:
   *         description: Internal server error
   */
  router.post('/avatar', async (req, res) => {
    try {
      // 1. Get token from Authorization header
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }

      // 2. Decode token to get payload
      let payload;
      try {
        payload = jwt.verify(token, config.server.jwtSecret);
      } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }

      // 3. Find user in ProcessCheck table by token
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const processCheck = await processRepo.findOne({ where: { Token: token } });
      if (!processCheck) {
        return res.status(404).json({ success: false, message: 'User not found in ProcessCheck' });
      }

      // 4. Handle file upload using new middleware
      avatarUpload.single('avatar')(req, res, async function (err) {
        if (err) {
          return handleUploadError(err, req, res, () => {});
        }

        if (!req.file) {
          return sendError(res, 'No file uploaded', 400);
        }

        try {
          // 5. Generate relative URL for the uploaded file
          const avatarUrl = `/uploads/avatars/${req.file.filename}`;

          // 6. Update ProcessCheck table with new avatar URL
          processCheck.avatar_url = avatarUrl;
          await processRepo.save(processCheck);

          return sendSuccess(res, { avatar_url: avatarUrl }, 'Avatar uploaded successfully');
        } catch (updateErr) {
          console.error('Avatar update error:', updateErr);
          // If database update fails, delete the uploaded file
          if (req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          return sendError(res, 'Failed to update avatar URL', 500);
        }
      });
    } catch (err) {
      console.error('Avatar upload error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  /**
   * @swagger
   * /api/avatar:
   *   get:
   *     summary: Get avatar URL for logged-in user
   *     description: >
   *       Returns the avatar URL for the currently logged-in user from the ProcessCheck table.
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Avatar URL retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 avatar_url:
   *                   type: string
   *                   example: /uploads/avatars/avatar-1234567890.jpg
   *       401:
   *         description: No or invalid token provided
   *       403:
   *         description: Invalid token
   *       404:
   *         description: User not found in ProcessCheck
   *       500:
   *         description: Internal server error
   */
  router.get('/avatar', async (req, res) => {
    try {
      // 1. Get token from Authorization header
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }

      // 2. Decode token to get payload
      let payload;
      try {
        payload = jwt.verify(token, config.server.jwtSecret);
      } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }

      // 3. Find user in ProcessCheck table by token
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const processCheck = await processRepo.findOne({ where: { Token: token } });
      if (!processCheck) {
        return res.status(404).json({ success: false, message: 'User not found in ProcessCheck' });
      }

      return res.json({
        success: true,
        avatar_url: processCheck.avatar_url || null
      });
    } catch (err) {
      console.error('Avatar get error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  /**
   * @swagger
   * /api/avatar:
   *   delete:
   *     summary: Delete avatar for logged-in user
   *     description: >
   *       Deletes the avatar image for the currently logged-in user and removes the URL from the ProcessCheck table.
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Avatar deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Avatar deleted successfully
   *       401:
   *         description: No or invalid token provided
   *       403:
   *         description: Invalid token
   *       404:
   *         description: User not found in ProcessCheck
   *       500:
   *         description: Internal server error
   */
  router.delete('/avatar', async (req, res) => {
    try {
      // 1. Get token from Authorization header
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }

      // 2. Decode token to get payload
      let payload;
      try {
        payload = jwt.verify(token, config.server.jwtSecret);
      } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }

      // 3. Find user in ProcessCheck table by token
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const processCheck = await processRepo.findOne({ where: { Token: token } });
      if (!processCheck) {
        return res.status(404).json({ success: false, message: 'User not found in ProcessCheck' });
      }

      // 4. Delete the file if it exists
      if (processCheck.avatar_url) {
        const filePath = path.join(config.getAvatarsUploadPath(), path.basename(processCheck.avatar_url));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // 5. Update ProcessCheck table to remove avatar URL
      processCheck.avatar_url = null;
      await processRepo.save(processCheck);

      return res.json({
        success: true,
        message: 'Avatar deleted successfully'
      });
    } catch (err) {
      console.error('Avatar delete error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  /**
   * @swagger
   * /api/leave-quota/me:
   *   get:
   *     summary: Get leave quota for the logged-in user
   *     description: Returns leave quota and usage for the current user.
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Leave quota data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       type:
   *                         type: string
   *                       used:
   *                         type: number
   *                       total:
   *                         type: number
   *       401:
   *         description: No or invalid token provided
   *       403:
   *         description: Invalid token
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  router.get('/leave-quota/me', async (req, res) => {
    try {
      // 1. Get token from Authorization header
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }

      // 2. Decode token to get payload
      let payload;
      try {
        payload = jwt.verify(token, config.server.jwtSecret);
      } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }

      // 3. Find user in ProcessCheck table by token
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const processCheck = await processRepo.findOne({ where: { Token: token } });
      if (!processCheck) {
        return res.status(404).json({ success: false, message: 'User not found in ProcessCheck' });
      }

      const { Repid: repid, Role: role } = processCheck;

      // 4. Get positionId from user/admin
      let positionId = null;
      if (role === 'admin') {
        const adminRepo = AppDataSource.getRepository('Admin');
        const admin = await adminRepo.findOne({ where: { id: repid } });
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
        positionId = admin.position;
      } else if (role === 'superadmin') {
        const superadminRepo = AppDataSource.getRepository('SuperAdmin');
        const superadmin = await superadminRepo.findOne({ where: { id: repid } });
        if (!superadmin) return res.status(404).json({ success: false, message: 'SuperAdmin not found' });
        positionId = superadmin.position;
      } else {
        const userRepo = AppDataSource.getRepository('User');
        const user = await userRepo.findOne({ where: { id: repid } });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        positionId = user.position;
      }
      if (!positionId) return res.status(404).json({ success: false, message: 'Position not found' });

      // 5. Query all leaveQuota rows for this position
      const leaveQuotaRepo = AppDataSource.getRepository('LeaveQuota');
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      const leaveRequestRepo = AppDataSource.getRepository('LeaveRequest');
      const quotas = await leaveQuotaRepo.find({ where: { positionId } });
      const leaveTypes = await leaveTypeRepo.find();
      const leaveRequests = await leaveRequestRepo.find({ where: { Repid: repid, status: 'approved' } });

      // Helper: แปลงค่าทศนิยมวันเป็นวัน/ชั่วโมง (configurable working hours per day)
      // Using utility function instead of local function

      // 6. For each leave type, calculate quota and used (sick, personal, vacation, maternity)
      const result = [];
      for (const leaveType of leaveTypes) {
        // Find quota for this leave type
        const quotaRow = quotas.find(q => q.leaveTypeId === leaveType.id);
        const quota = quotaRow ? quotaRow.quota : 0;
        // Calculate used leave for this type
        let used = 0;
        for (const lr of leaveRequests) {
          let leaveTypeName = lr.leaveType;
          if (leaveTypeName && leaveTypeName.length > 20) {
            const leaveTypeEntity = await leaveTypeRepo.findOneBy({ id: leaveTypeName });
            if (leaveTypeEntity && leaveTypeEntity.leave_type_en) {
              leaveTypeName = leaveTypeEntity.leave_type_en;
            }
          }
          if (
            leaveTypeName === leaveType.leave_type_en ||
            leaveTypeName === leaveType.leave_type_th ||
            leaveTypeName === leaveType.id
          ) {
            // Personal leave: may be by hour or day
            if (leaveType.leave_type_en?.toLowerCase() === 'personal' || leaveType.leave_type_th === 'ลากิจ') {
              if (lr.startTime && lr.endTime) {
                const timeRange = convertTimeRangeToDecimal(
                  ...lr.startTime.split(":").map(Number),
                  ...lr.endTime.split(":").map(Number)
                );
                let diff = timeRange.end - timeRange.start;
                if (diff < 0) diff += 24;
                used += diff / config.business.workingHoursPerDay; // configurable working hours per day
              } else if (lr.startDate && lr.endDate) {
                const start = new Date(lr.startDate);
                const end = new Date(lr.endDate);
                let days = calculateDaysBetween(start, end);
                if (days < 0 || isNaN(days)) days = 0;
                used += days;
              }
            } else {
              // Other types: by day
              if (lr.startDate && lr.endDate) {
                const start = new Date(lr.startDate);
                const end = new Date(lr.endDate);
                let days = calculateDaysBetween(start, end);
                if (days < 0 || isNaN(days)) days = 0;
                used += days;
              }
            }
          }
        }
        const remaining = Math.max(0, quota - used);
        const usedObj = toDayHour(used);
        const remainingObj = toDayHour(remaining);
        result.push({
          id: leaveType.id,
          leave_type_en: leaveType.leave_type_en,
          leave_type_th: leaveType.leave_type_th,
          quota: quota,
          used_day: usedObj.day,
          used_hour: usedObj.hour,
          remaining_day: remainingObj.day,
          remaining_hour: remainingObj.hour
        });
      }
      return sendSuccess(res, result);
    } catch (err) {
      console.error('Leave quota error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Test route to verify ProfileController is working
  router.get('/test', (req, res) => {
    res.json({ message: 'ProfileController is working!' });
  });

  console.log('ProfileController router created successfully');
  return router;
};
