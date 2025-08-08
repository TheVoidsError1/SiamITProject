const express = require('express');
const router = express.Router();

// Leave management routes
const leaveRequestController = require('../api/LeaveRequestController');
const leaveHistoryController = require('../api/LeaveHistoryController');
const leaveQuotaController = require('../api/LeaveQuotaController');
const typeLeaveController = require('../api/TpyeLeaveController');
const leaveUsedController = require('../api/LeaveUsedController');

const initializeLeaveRoutes = (AppDataSource) => {
  // Leave request routes
  router.use('/leave-request', leaveRequestController(AppDataSource));
  
  // Leave history routes
  router.use('/leave-history', leaveHistoryController(AppDataSource));
  
  // Leave quota routes
  router.use('/leave-quota', leaveQuotaController(AppDataSource));
  
  // Leave type routes
  router.use('/', typeLeaveController(AppDataSource));
  
  // Leave used routes
  router.use('/leave-used', leaveUsedController(AppDataSource));
  
  return router;
};

module.exports = initializeLeaveRoutes; 