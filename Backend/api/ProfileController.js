const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

console.log('ProfileController is being loaded...');

module.exports = (AppDataSource) => {
  console.log('ProfileController module function is being executed...');
  const router = express.Router();

  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, '../uploads/avatars');
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Generate unique filename with timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
      // Check file type
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    }
  });

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
        payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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

      if (role === 'admin') {
        const adminRepo = AppDataSource.getRepository('admin');
        const admin = await adminRepo.findOne({ where: { id: repid } });
        if (!admin) {
          return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        const department = admin.department ? await departmentRepo.findOne({ where: { id: admin.department } }) : null;
        const position = admin.position ? await positionRepo.findOne({ where: { id: admin.position } }) : null;
        profile.name = admin.admin_name;
        profile.position = position ? position.position_name : '';
        profile.department = department ? department.department_name : '';
      } else {
        const userRepo = AppDataSource.getRepository('User');
        const user = await userRepo.findOne({ where: { id: repid } });
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
        const department = user.department ? await departmentRepo.findOne({ where: { id: user.department } }) : null;
        const position = user.position ? await positionRepo.findOne({ where: { id: user.position } }) : null;
        profile.name = user.User_name;
        profile.position = position ? position.position_name : '';
        profile.department = department ? department.department_name : '';
      }

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
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }
      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const processCheck = await processRepo.findOne({ where: { Token: token } });
      if (!processCheck) {
        return res.status(404).json({ success: false, message: 'User not found in ProcessCheck' });
      }
      const { Role: role, Repid: repid, Email: email } = processCheck;
      const { name, email: newEmail, position, department, password } = req.body;
      const departmentRepo = AppDataSource.getRepository('Department');
      const positionRepo = AppDataSource.getRepository('Position');
      let updated;
      let hashedPassword = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }
      if (role === 'admin') {
        const adminRepo = AppDataSource.getRepository('admin');
        const admin = await adminRepo.findOne({ where: { id: repid } });
        if (!admin) {
          return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        let departmentEntity = null;
        let positionEntity = null;
        if (department) departmentEntity = await departmentRepo.findOne({ where: { department_name: department } });
        if (position) positionEntity = await positionRepo.findOne({ where: { position_name: position } });
        admin.admin_name = name || admin.admin_name;
        admin.email = newEmail || admin.email;
        admin.department = departmentEntity ? departmentEntity.id : admin.department;
        admin.position = positionEntity ? positionEntity.id : admin.position;
        if (hashedPassword) admin.password = hashedPassword;
        updated = await adminRepo.save(admin);
      } else {
        const userRepo = AppDataSource.getRepository('User');
        const user = await userRepo.findOne({ where: { id: repid } });
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
        let departmentEntity = null;
        let positionEntity = null;
        if (department) departmentEntity = await departmentRepo.findOne({ where: { department_name: department } });
        if (position) positionEntity = await positionRepo.findOne({ where: { position_name: position } });
        user.User_name = name || user.User_name;
        user.email = newEmail || user.email;
        user.department = departmentEntity ? departmentEntity.id : user.department;
        user.position = positionEntity ? positionEntity.id : user.position;
        if (hashedPassword) user.password = hashedPassword;
        updated = await userRepo.save(user);
      }
      // Update password in ProcessCheck if changed
      if (hashedPassword) {
        processCheck.Password = hashedPassword;
        await processRepo.save(processCheck);
      }
      // Return updated profile in the same format as GET
      let profile = { email: updated.email || email };
      if (role === 'admin') {
        profile.name = updated.admin_name;
        profile.position = updated.position ? (await positionRepo.findOne({ where: { id: updated.position } }))?.position_name : '';
        profile.department = updated.department ? (await departmentRepo.findOne({ where: { id: updated.department } }))?.department_name : '';
      } else {
        profile.name = updated.User_name;
        profile.position = updated.position ? (await positionRepo.findOne({ where: { id: updated.position } }))?.position_name : '';
        profile.department = updated.department ? (await departmentRepo.findOne({ where: { id: updated.department } }))?.department_name : '';
      }
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
        payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }

      // 3. Find user in ProcessCheck table by token
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const processCheck = await processRepo.findOne({ where: { Token: token } });
      if (!processCheck) {
        return res.status(404).json({ success: false, message: 'User not found in ProcessCheck' });
      }

      // 4. Handle file upload
      upload.single('avatar')(req, res, async function (err) {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({ success: false, message: 'File size too large. Maximum 5MB allowed.' });
            }
          }
          return res.status(400).json({ success: false, message: err.message || 'File upload error' });
        }

        if (!req.file) {
          return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        try {
          // 5. Generate relative URL for the uploaded file
          const avatarUrl = `/uploads/avatars/${req.file.filename}`;

          // 6. Update ProcessCheck table with new avatar URL
          processCheck.avatar_url = avatarUrl;
          await processRepo.save(processCheck);

          return res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            avatar_url: avatarUrl
          });
        } catch (updateErr) {
          console.error('Avatar update error:', updateErr);
          // If database update fails, delete the uploaded file
          if (req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(500).json({ success: false, message: 'Failed to update avatar URL' });
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
        payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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
        payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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
        const filePath = path.join(__dirname, '..', processCheck.avatar_url);
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
        payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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

      // 6. For each leave type, calculate quota and used (sick, personal, vacation, maternity)
      const allowedTypes = ['sick', 'personal', 'vacation', 'maternity', 'ลาป่วย', 'ลากิจ', 'ลาพักผ่อน', 'ลาคลอด'];
      const result = [];
      for (const leaveType of leaveTypes) {
        if (!allowedTypes.includes(leaveType.leave_type)) continue;
        // Find quota for this leave type
        const quotaRow = quotas.find(q => q.leaveTypeId === leaveType.id);
        const quota = quotaRow ? quotaRow.quota : 0;
        // Calculate used leave for this type
        let used = 0;
        for (const lr of leaveRequests) {
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
        const remaining = Math.max(0, quota - used);
        result.push({ type: leaveType.leave_type, used: Math.round(used * 100) / 100, quota, remaining });
      }
      return res.json({ success: true, data: result });
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
