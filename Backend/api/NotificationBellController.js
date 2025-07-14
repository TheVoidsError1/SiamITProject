const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const { In } = require('typeorm');

module.exports = (AppDataSource) => {
  // Get unread notifications for current user
  router.get('/notifications', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const notifications = await leaveRepo.find({
        where: {
          Repid: userId,
          isRead: false,
          status: In(['approved', 'rejected'])
        },
        select: ['id', 'startDate', 'endDate', 'status']
      });
      res.json({ status: 'success', data: notifications });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  // Mark all notifications as read for current user
  router.post('/notifications/read', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      await leaveRepo
        .createQueryBuilder()
        .update()
        .set({ isRead: true })
        .where('Repid = :userId', { userId })
        .andWhere('isRead = false')
        .andWhere('status IN (:...statuses)', { statuses: ['approved', 'rejected'] })
        .execute();
      res.json({ status: 'success' });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // Mark a single notification as read for current user
  router.post('/notifications/:id/read', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const notificationId = req.params.id;
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const result = await leaveRepo
        .createQueryBuilder()
        .update()
        .set({ isRead: true })
        .where('id = :id', { id: notificationId })
        .andWhere('Repid = :userId', { userId })
        .andWhere('isRead = false')
        .andWhere('status IN (:...statuses)', { statuses: ['approved', 'rejected'] })
        .execute();
      if (result.affected > 0) {
        res.json({ status: 'success' });
      } else {
        res.status(404).json({ status: 'error', message: 'Notification not found or already read.' });
      }
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  return router;
}; 