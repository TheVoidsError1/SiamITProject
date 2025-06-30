const express = require('express');
const multer = require('multer');
const path = require('path');

const upload = multer({
  dest: path.join(__dirname, '../../public/leave-uploads'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = (AppDataSource) => {
  const router = express.Router();

  // POST /api/leave-request (รองรับอัปโหลดไฟล์)
  router.post('/leave-request', upload.single('imgLeave'), async (req, res) => {
    try {
      const leaveRepo = AppDataSource.getRepository('LeaveRequest');
      const data = req.body;
      let imgLeave = null;
      if (req.file) {
        imgLeave = `/leave-uploads/${req.file.filename}`;
      }
      const leave = leaveRepo.create({
        ...data,
        imgLeave,
      });
      await leaveRepo.save(leave);
      res.json({ message: 'บันทึกคำขอลาสำเร็จ', leave });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}; 