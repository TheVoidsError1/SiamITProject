const express = require('express');

module.exports = (AppDataSource) => {
  const router = express.Router();

  /**
   * @swagger
   * /api/dashboard/leave-status-count:
   *   get:
   *     summary: Get only pending leave request count
   *     tags: [AdminDashboard]
   *     responses:
   *       200:
   *         description: Pending count retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     pending:
   *                       type: integer
   *                       description: Number of requests with null status
   *       500:
   *         description: Server error
   */
  router.get('/dashboard/leave-status-count', async (req, res) => {
    try {
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const pending = await leaveRepo.count({ where: { status: null } });
      res.json({
        success: true,
        data: { pending },
        message: 'Pending count retrieved successfully'
      });
    } catch (err) {
      console.error('Pending count error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * @swagger
   * /api/dashboard/approved-this-month:
   *   get:
   *     summary: Get count of approved leave requests for the current month (by startDate)
   *     tags: [AdminDashboard]
   *     responses:
   *       200:
   *         description: Approved count for this month retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: integer
   *                   description: Number of approved leave requests for this month
   *       500:
   *         description: Server error
   */
  router.get('/dashboard/approved-this-month', async (req, res) => {
    try {
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // JS months are 0-based
      // Format YYYY-MM for LIKE query
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      // Use queryBuilder for flexible date filtering
      const count = await leaveRepo.createQueryBuilder('leave')
        .where("leave.status = :status", { status: 'approved' })
        .andWhere("DATE_FORMAT(leave.startDate, '%Y-%m') = :month", { month: monthStr })
        .getCount();
      res.json({
        success: true,
        data: count,
        message: 'Approved count for this month retrieved successfully'
      });
    } catch (err) {
      console.error('Approved-this-month error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * @swagger
   * /api/dashboard/user-count:
   *   get:
   *     summary: Get count of all users from ProcessCheck table
   *     tags: [AdminDashboard]
   *     responses:
   *       200:
   *         description: User count retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: integer
   *                   description: Number of users in ProcessCheck table
   *       500:
   *         description: Server error
   */
  router.get('/dashboard/user-count', async (req, res) => {
    try {
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const count = await processRepo.count();
      res.json({
        success: true,
        data: count,
        message: 'User count retrieved successfully'
      });
    } catch (err) {
      console.error('User count error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * @swagger
   * /api/dashboard/average-day-off:
   *   get:
   *     summary: Get average number of days off for all leave requests
   *     tags: [AdminDashboard]
   *     responses:
   *       200:
   *         description: Average day off retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: number
   *                   format: float
   *                   description: Average number of days off (float, 2 decimals)
   *       500:
   *         description: Server error
   */
  router.get('/dashboard/average-day-off', async (req, res) => {
    try {
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const leaves = await leaveRepo.find();
      if (leaves.length === 0) {
        return res.json({ success: true, data: 0, message: 'Average day off retrieved successfully' });
      }
      let totalDays = 0;
      for (const leave of leaves) {
        if (leave.startTime && leave.endTime) {
          // Calculate hours difference and convert to days (9 hours = 1 day)
          const [startHour, startMinute] = leave.startTime.split(':').map(Number);
          const [endHour, endMinute] = leave.endTime.split(':').map(Number);
          let start = new Date();
          let end = new Date();
          start.setHours(startHour, startMinute || 0, 0, 0);
          end.setHours(endHour, endMinute || 0, 0, 0);
          let diffMs = end - start;
          if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // handle overnight
          const diffHours = diffMs / (1000 * 60 * 60);
          const days = parseFloat((diffHours / 9).toFixed(2));
          totalDays += days > 0 ? days : 1;
        } else if (leave.startDate && leave.endDate) {
          // Always count as 1 day regardless of date difference
          totalDays += 1;
        } else {
          totalDays += 1;
        }
      }
      const average = parseFloat((totalDays / leaves.length).toFixed(2));
      res.json({
        success: true,
        data: average,
        message: 'Average day off retrieved successfully'
      });
    } catch (err) {
      console.error('Average day off error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}; 