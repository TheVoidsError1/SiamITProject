const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const { In } = require('typeorm');

module.exports = (AppDataSource) => {
  // Get unread notifications for current user
  router.get('/notifications', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const lang = (req.headers['accept-language'] || 'en').toLowerCase().startsWith('th') ? 'th' : 'en';
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const userRepo = AppDataSource.getRepository('User');
      const adminRepo = AppDataSource.getRepository('Admin');
      const superadminRepo = AppDataSource.getRepository('SuperAdmin');
      
      // Get user info for display
      let userName = '';
      const user = await userRepo.findOne({ where: { id: userId } });
      if (user) {
        userName = user.User_name;
      } else {
        const admin = await adminRepo.findOne({ where: { id: userId } });
        if (admin) {
          userName = admin.admin_name;
        } else {
          const superadmin = await superadminRepo.findOne({ where: { id: userId } });
          if (superadmin) {
            userName = superadmin.superadmin_name;
          }
        }
      }

      const leaveRequests = await leaveRepo.find({
        where: {
          Repid: userId,
          isRead: false,
          status: In(['approved', 'rejected', 'deleted'])
        },
        select: ['id', 'startDate', 'endDate', 'status', 'leaveType', 'createdAt']
      });

      // Transform data to match new notification format
      const notifications = leaveRequests.map(request => {
        const isApproved = request.status === 'approved';
        const isRejected = request.status === 'rejected';
        const isDeleted = request.status === 'deleted';
        const startDate = new Date(request.startDate);
        const endDate = new Date(request.endDate);
        const createdAt = new Date(request.createdAt);
        const now = new Date();
        
        // Calculate time ago
        const timeDiff = now - createdAt;
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const daysAgo = Math.floor(hoursAgo / 24);
        
        let timestamp = '';
        if (lang === 'th') {
          if (daysAgo > 0) {
            timestamp = `${daysAgo} วันที่แล้ว`;
          } else if (hoursAgo > 0) {
            timestamp = `${hoursAgo} ชั่วโมงที่แล้ว`;
          } else {
            timestamp = 'ไม่กี่นาทีที่แล้ว';
          }
        } else {
          if (daysAgo > 0) {
            timestamp = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
          } else if (hoursAgo > 0) {
            timestamp = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
          } else {
            timestamp = 'A few minutes ago';
          }
        }

        // Format dates for display
        const formatDate = (date) => {
          if (lang === 'th') {
            return date.toLocaleDateString('th-TH', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
          } else {
            return date.toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
          }
        };

        const startDateFormatted = formatDate(startDate);
        const endDateFormatted = formatDate(endDate);

        if (isApproved) {
          return {
            id: request.id,
            title: lang === 'th' ? 'คำขอลาได้รับการอนุมัติ' : 'Leave Request Approved',
            message: lang === 'th' 
              ? `คำขอลาพักผ่อนวันที่ ${startDateFormatted} - ${endDateFormatted} ได้รับการอนุมัติแล้ว`
              : `Leave request for ${startDateFormatted} - ${endDateFormatted} has been approved`,
            timestamp: timestamp,
            status: 'unread',
            type: 'approval'
          };
        } else if (isRejected) {
          return {
            id: request.id,
            title: lang === 'th' ? 'คำขอลาถูกปฏิเสธ' : 'Leave Request Rejected',
            message: lang === 'th'
              ? `คำขอลาพักผ่อนวันที่ ${startDateFormatted} - ${endDateFormatted} ถูกปฏิเสธ`
              : `Leave request for ${startDateFormatted} - ${endDateFormatted} was rejected`,
            timestamp: timestamp,
            status: 'unread',
            type: 'rejection'
          };
        } else if (isDeleted) {
          return {
            id: request.id,
            title: lang === 'th' ? 'คำขอลาถูกลบ' : 'Leave Request Deleted',
            message: lang === 'th'
              ? `คำขอลาพักผ่อนวันที่ ${startDateFormatted} - ${endDateFormatted} ถูกลบแล้ว`
              : `Leave request for ${startDateFormatted} - ${endDateFormatted} has been deleted`,
            timestamp: timestamp,
            status: 'unread',
            type: 'deletion'
          };
        }
      });

      // Add reminder notifications (example)
      const reminderNotifications = [
        {
          id: 'reminder-1',
          title: lang === 'th' ? 'เตือนวันลาคงเหลือ' : 'Leave Days Reminder',
          message: lang === 'th' ? 'คุณมีวันลาพักผ่อนเหลือ 7 วัน สำหรับปีนี้' : 'You have 7 vacation days remaining for this year',
          timestamp: lang === 'th' ? '1 วันที่แล้ว' : '1 day ago',
          status: 'unread',
          type: 'reminder'
        }
      ];

      // Combine all notifications
      const allNotifications = [...notifications, ...reminderNotifications];

      res.json({ status: 'success', data: allNotifications });
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
        .andWhere('status IN (:...statuses)', { statuses: ['approved', 'rejected', 'deleted'] })
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
        .andWhere('status IN (:...statuses)', { statuses: ['approved', 'rejected', 'deleted'] })
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