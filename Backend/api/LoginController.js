const express = require('express');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

module.exports = (AppDataSource) => {
  const router = require('express').Router();

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const processRepo = AppDataSource.getRepository('ProcessCheck');
    const processCheck = await processRepo.findOneBy({ Email: email });
    if (!processCheck) {
      return res.status(401).json({ success: false, data: null, message: 'Email หรือ Password ไม่ถูกต้อง' });
    }
    const isPasswordValid = await bcrypt.compare(password, processCheck.Password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, data: null, message: 'Email หรือ Password ไม่ถูกต้อง' });
    }
    // เพิ่ม role ลงใน token
    const token = jwt.sign({ userId: processCheck.Repid, role: processCheck.Role }, 'your_secret_key', { expiresIn: '1h' });
    res.json({ success: true, data: { token, role: processCheck.Role }, message: 'Login successful' });
  });
  return router;
};
