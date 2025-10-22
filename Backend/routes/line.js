const express = require('express');
const router = express.Router();

// LINE integration routes
const LineController = require('../api/LineController');
const LineLoginController = require('../api/LineLoginController');
const authMiddleware = require('../middleware/authMiddleware');

const initializeLineRoutes = (AppDataSource) => {
  // LINE Bot webhook
  router.post('/line/webhook', LineController.webhook);
  
  // LINE notification sending
  router.post('/line/send-notification', async (req, res) => {
    const { userId, message } = req.body;
    const result = await LineController.sendNotification(userId, message);
    res.json(result);
  });

  // Test LINE Bot methods
  router.post('/line/test-methods', LineController.testLineBotMethods);
  
  // Debug LINE user linking
  router.post('/line/debug-user', LineController.debugLineUser);
  
  // Test LINE Bot configuration
  router.get('/line/test-config', LineController.testBotConfig);

  // LINE Login routes
  router.get('/line/login-url', authMiddleware, LineLoginController.getLoginUrl);
  router.get('/line/callback', LineLoginController.handleCallback);
  router.get('/line/link-status', authMiddleware, LineLoginController.checkLinkStatus);
  router.post('/line/unlink', authMiddleware, LineLoginController.unlinkAccount);
  router.post('/line/send-friend-invitation', authMiddleware, LineLoginController.sendManualFriendInvitation);
  router.get('/line/debug', LineLoginController.debugConfig);
  
  return router;
};

module.exports = initializeLineRoutes; 