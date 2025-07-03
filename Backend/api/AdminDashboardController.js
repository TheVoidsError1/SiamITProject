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
      const pending = await leaveRepo.createQueryBuilder("leave").where("leave.status IS NULL OR leave.status = ''").getCount();
      res.json({
        success: true,
        data: { pending },
        message: 'Pending count retrieved successfully'});} catch (err) {
      console.error('Pending count error:', err);
      res.status(500).json({ success: false, error: err.message });}});

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
      
      console.log('Total leaves found:', leaves.length);
      
      if (leaves.length === 0) {
        return res.json({ success: true, data: 0, message: 'Average day off retrieved successfully' });
      }
      
      let totalDays = 0;
      let processedLeaves = 0;
      
      for (const leave of leaves) {
        console.log('Processing leave:', {
          id: leave.id,
          startDate: leave.startDate,
          endDate: leave.endDate,
          startTime: leave.startTime,
          endTime: leave.endTime
        });
        
        let daysForThisLeave = 0;
        
        if (leave.startDate && leave.endDate) {
          // Handle different date formats that might come from the database
          let startDate, endDate;
          
          // If dates are already Date objects
          if (leave.startDate instanceof Date && leave.endDate instanceof Date) {
            startDate = leave.startDate;
            endDate = leave.endDate;
          } else {
            // If dates are strings, parse them
            startDate = new Date(leave.startDate);
            endDate = new Date(leave.endDate);
          }
          
          console.log('Parsed dates:', { startDate, endDate });
          
          // Check if dates are valid
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.log('Invalid dates, defaulting to 1 day');
            daysForThisLeave = 1;
          } else {
            // Calculate difference in days (inclusive of both start and end dates)
            const timeDiff = endDate.getTime() - startDate.getTime();
            const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 for inclusive counting
            
            daysForThisLeave = Math.max(1, dayDiff); // Minimum 1 day
            
            console.log('Date calculation:', { timeDiff, dayDiff, daysForThisLeave });
            
            // If startTime and endTime are provided, adjust for partial days
            if (leave.startTime && leave.endTime) {
              const [startHour, startMinute] = leave.startTime.split(':').map(Number);
              const [endHour, endMinute] = leave.endTime.split(':').map(Number);
              
              // Calculate hours difference
              let startTime = new Date();
              let endTime = new Date();
              startTime.setHours(startHour, startMinute || 0, 0, 0);
              endTime.setHours(endHour, endMinute || 0, 0, 0);
              
              let diffMs = endTime - startTime;
              if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // handle overnight
              
              const diffHours = diffMs / (1000 * 60 * 60);
              
              // If it's the same day, calculate based on hours (9 hours = 1 day)
              if (dayDiff === 1) {
                daysForThisLeave = parseFloat((diffHours / 9).toFixed(2));
                daysForThisLeave = Math.max(0.5, daysForThisLeave); // Minimum 0.5 day
                console.log('Time calculation:', { diffHours, daysForThisLeave });
              }
            }
          }
        } else {
          // If no dates provided, default to 1 day
          daysForThisLeave = 1;
          console.log('No dates provided, defaulting to 1 day');
        }
        
        totalDays += daysForThisLeave;
        processedLeaves++;
        
        console.log('Leave processed:', { daysForThisLeave, totalDays, processedLeaves });
      }
      
      const average = processedLeaves > 0 ? parseFloat((totalDays / processedLeaves).toFixed(2)) : 0;
      
      console.log('Final calculation:', { totalDays, processedLeaves, average });
      
      // Ensure we return a valid number, not null
      const finalAverage = isNaN(average) ? 0 : average;
      
      res.json({
        success: true,
        data: finalAverage,
        message: 'Average day off retrieved successfully'
      });
    } catch (err) {
      console.error('Average day off error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}; 