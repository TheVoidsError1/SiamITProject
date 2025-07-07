const express = require('express');
const jwt = require('jsonwebtoken');

console.log('ProfileController is being loaded...');

module.exports = (AppDataSource) => {
  console.log('ProfileController module function is being executed...');
  const router = express.Router();

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
        const adminRepo = AppDataSource.getRepository('Admin');
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

  console.log('ProfileController router created successfully');
  return router;
};
