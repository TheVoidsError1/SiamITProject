const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

module.exports = (AppDataSource) => {
  router.get('/dashboard-stats', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      // Fetch all leave requests where the current user is the requester
      const leaveHistory = await leaveRepo.find({ where: { Repid: userId } });
      // Calculate days used
      let daysUsed = 0;
      leaveHistory.forEach(lr => {
        const start = new Date(lr.startDate);
        const end = new Date(lr.endDate);
        daysUsed += (end - start) / (1000 * 60 * 60 * 24) + 1;
      });
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
          pendingRequests,
          approvalRate,
          remainingDays
        },
        message: 'Dashboard stats fetched successfully'
      });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });
  return router;
};
