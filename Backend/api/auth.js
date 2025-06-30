const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

module.exports = (AppDataSource) => {
  const router = express.Router();

  // สมัครสมาชิก
  router.post('/register', async (req, res) => {
    try {
      const { User_name, position, department, Email, Password } = req.body;
      const userRepo = AppDataSource.getRepository('User');
      const processRepo = AppDataSource.getRepository('ProcessCheck');

      // ตรวจสอบ email ซ้ำ
      const exist = await processRepo.findOneBy({ Email });
      if (exist) {
        return res.status(400).json({ error: 'Email นี้ถูกใช้ไปแล้ว' });
      }

      // hash password
      const hashedPassword = await bcrypt.hash(Password, 10);

      // สร้าง ProcessCheck
      const processCheck = processRepo.create({ Email, Password: hashedPassword });
      await processRepo.save(processCheck);

      // สร้าง User
      const user = userRepo.create({ User_name, position, department });
      await userRepo.save(user);

      // สร้าง JWT
      const token = jwt.sign({ userId: user.User_id, email: Email }, 'your_secret_key', { expiresIn: '1h' });

      // อัปเดต token ใน ProcessCheck (optional)
      processCheck.Token = token;
      await processRepo.save(processCheck);

      res.json({ token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: สมัครสมาชิก
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               User_name:
 *                 type: string
 *               position:
 *                 type: string
 *               department:
 *                 type: string
 *               Email:
 *                 type: string
 *               Password:
 *                 type: string
 *     responses:
 *       200:
 *         description: สมัครสมาชิกสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 */

  return router;
}; 