const express = require('express');
const router = express.Router();

module.exports = (AppDataSource) => {
  // ดึงข้อมูล user ทั้งหมด
  router.get('/users', async (req, res) => {
    try {
      const userRepo = AppDataSource.getRepository('User');
      const users = await userRepo.find();
      res.json({ status: 'success', data: users, message: 'Users fetched successfully' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: [], message: err.message });
    }
  });

  // ดึงข้อมูล admin ทั้งหมด
  router.get('/admins', async (req, res) => {
    try {
      const adminRepo = AppDataSource.getRepository('admin');
      const admins = await adminRepo.find();
      res.json({ status: 'success', data: admins, message: 'Admins fetched successfully' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: [], message: err.message });
    }
  });

  return router;
};
