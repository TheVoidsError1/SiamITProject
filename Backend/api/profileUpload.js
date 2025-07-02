const express = require('express');
const multer = require('multer');
const path = require('path');

const upload = multer({
  dest: path.join(__dirname, '../../public/profile-uploads'),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

/**
 * @swagger
 * /api/profile/upload:
 *   post:
 *     summary: อัปโหลดรูปโปรไฟล์
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               profileImg:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: อัปโหลดรูปสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 avatar_url:
 *                   type: string
 *       400:
 *         description: No file uploaded
 *       404:
 *         description: User not found
 */

module.exports = (AppDataSource) => {
  const router = express.Router();
  const processRepo = AppDataSource.getRepository('ProcessCheck');

  // อัปโหลดรูปโปรไฟล์
  router.post('/profile/upload', upload.single('profileImg'), async (req, res) => {
    try {
      const { userId } = req.body;
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      // อัปเดต path รูปใน process_check
      const processUser = await processRepo.findOneBy({ id: userId });
      if (!processUser) return res.status(404).json({ error: 'User not found' });

      processUser.avatar_url = `/profile-uploads/${req.file.filename}`;
      await processRepo.save(processUser);

      res.json({ message: 'อัปโหลดรูปสำเร็จ', avatar_url: processUser.avatar_url });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ดึง path รูปโปรไฟล์
  /**
   * @swagger
   * /api/profile/{userId}/image:
   *   get:
   *     summary: ดึง path รูปโปรไฟล์
   *     tags: [Profile]
   *     parameters:
   *       - in: path
   *         name: userId
   *         schema:
   *           type: string
   *         required: true
   *         description: รหัสผู้ใช้
   *     responses:
   *       200:
   *         description: คืน path รูปโปรไฟล์
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 avatar_url:
   *                   type: string
   *       404:
   *         description: Image not found
   */
  router.get('/profile/:userId/image', async (req, res) => {
    try {
      const { userId } = req.params;
      const processUser = await processRepo.findOneBy({ id: userId });
      if (!processUser || !processUser.avatar_url) return res.status(404).json({ error: 'Image not found' });

      res.json({ avatar_url: processUser.avatar_url });
      // หรือจะส่งไฟล์จริง
      // res.sendFile(path.join(__dirname, '../../public', processUser.avatar_url));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
