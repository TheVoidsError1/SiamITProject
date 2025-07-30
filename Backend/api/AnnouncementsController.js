const express = require('express');
const multer = require('multer');
const path = require('path');

module.exports = (AppDataSource) => {
  const router = express.Router();

  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../uploads/announcements'));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'announcement-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
      // Accept only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

  /**
   * @swagger
   * /api/announcements:
   *   get:
   *     summary: Get all announcements
   *     tags:
   *       - Announcements
   *     responses:
   *       200:
   *         description: A list of announcements
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                 message:
   *                   type: string
   */
  // Get all announcements
  router.get('/announcements', async (req, res) => {
    try {
      const announcementRepo = AppDataSource.getRepository('Announcements');
      const announcements = await announcementRepo.find();
      res.json({ status: 'success', data: announcements, message: 'Fetched all announcements' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  /**
   * @swagger
   * /api/announcements/feed:
   *   get:
   *     summary: Get all announcements with avatar data
   *     tags:
   *       - Announcements
   *     responses:
   *       200:
   *         description: A list of announcements with avatar data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       subject:
   *                         type: string
   *                       detail:
   *                         type: string
   *                       createdAt:
   *                         type: string
   *                       createdBy:
   *                         type: string
   *                       Image:
   *                         type: string
   *                       avatar:
   *                         type: string
   *                 message:
   *                   type: string
   */
  // Get all announcements with avatar data
  router.get('/announcements/feed', async (req, res) => {
    try {
      const announcementRepo = AppDataSource.getRepository('Announcements');
      const processCheckRepo = AppDataSource.getRepository('ProcessCheck');
      
      // Get all announcements
      const announcements = await announcementRepo.find({
        order: {
          createdAt: 'DESC'
        }
      });

      // Get avatar data for each announcement
      const announcementsWithAvatar = await Promise.all(
        announcements.map(async (announcement) => {
          let avatar = null;
          
          if (announcement.createdBy) {
            // First, find the user by name in User, Admin, and SuperAdmin tables
            const userRepo = AppDataSource.getRepository('User');
            const adminRepo = AppDataSource.getRepository('Admin');
            const superadminRepo = AppDataSource.getRepository('SuperAdmin');
            
            // Try to find user in User table
            let user = await userRepo.findOne({
              where: { User_name: announcement.createdBy }
            });
            
            // If not found in User table, try Admin table
            if (!user) {
              user = await adminRepo.findOne({
                where: { admin_name: announcement.createdBy }
              });
            }
            
            // If not found in Admin table, try SuperAdmin table
            if (!user) {
              user = await superadminRepo.findOne({
                where: { superadmin_name: announcement.createdBy }
              });
            }
            
            // If user found, get their avatar from ProcessCheck table
            if (user) {
              const processCheck = await processCheckRepo.findOne({
                where: { Repid: user.id }
              });
              
              if (processCheck && processCheck.avatar_url) {
                avatar = processCheck.avatar_url;
              }
            }
          }

          return {
            subject: announcement.subject,
            detail: announcement.detail,
            createdAt: announcement.createdAt,
            createdBy: announcement.createdBy,
            Image: announcement.Image,
            avatar: avatar
          };
        })
      );

      res.json({ 
        status: 'success', 
        data: announcementsWithAvatar, 
        message: 'Fetched all announcements with avatar data' 
      });
    } catch (err) {
      console.error('Error fetching announcements feed:', err);
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  /**
   * @swagger
   * /api/announcements/{id}:
   *   get:
   *     summary: Get announcement by ID
   *     tags:
   *       - Announcements
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Announcement found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                 data:
   *                   type: object
   *                 message:
   *                   type: string
   *       404:
   *         description: Announcement not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                 data:
   *                   type: object
   *                 message:
   *                   type: string
   */
  // Get announcement by ID
  router.get('/announcements/:id', async (req, res) => {
    try {
      const announcementRepo = AppDataSource.getRepository('Announcements');
      const announcement = await announcementRepo.findOneBy({ id: req.params.id });
      if (!announcement) {
        return res.status(404).json({ status: 'error', data: null, message: 'Announcement not found' });
      }
      res.json({ status: 'success', data: announcement, message: 'Fetched announcement' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  /**
   * @swagger
   * /api/announcements:
   *   post:
   *     summary: Create a new announcement
   *     tags:
   *       - Announcements
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               subject:
   *                 type: string
   *               detail:
   *                 type: string
   *               Image:
   *                 type: string
   *               createdBy:
   *                 type: string
   *     responses:
   *       200:
   *         description: Announcement created
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                 data:
   *                   type: object
   *                 message:
   *                   type: string
   */
  // Create announcement
  router.post('/announcements', upload.single('Image'), async (req, res) => {
    try {
      const announcementRepo = AppDataSource.getRepository('Announcements');
      const { subject, detail, createdBy } = req.body;
      
      // Handle file upload
      let imagePath = '';
      if (req.file) {
        imagePath = `/uploads/announcements/${req.file.filename}`;
      }
      
      const newAnnouncement = announcementRepo.create({ 
        subject, 
        detail, 
        Image: imagePath, 
        createdBy 
      });
      await announcementRepo.save(newAnnouncement);
      res.json({ status: 'success', data: newAnnouncement, message: 'Announcement created' });
    } catch (err) {
      console.error('Error creating announcement:', err);
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  /**
   * @swagger
   * /api/announcements/{id}:
   *   put:
   *     summary: Update an announcement
   *     tags:
   *       - Announcements
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               subject:
   *                 type: string
   *               detail:
   *                 type: string
   *               Image:
   *                 type: string
   *               createdBy:
   *                 type: string
   *     responses:
   *       200:
   *         description: Announcement updated
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                 data:
   *                   type: object
   *                 message:
   *                   type: string
   *       404:
   *         description: Announcement not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                 data:
   *                   type: object
   *                 message:
   *                   type: string
   */
  // Update announcement
  router.put('/announcements/:id', async (req, res) => {
    try {
      const announcementRepo = AppDataSource.getRepository('Announcements');
      const { subject, detail, Image, createdBy } = req.body;
      let announcement = await announcementRepo.findOneBy({ id: req.params.id });
      if (!announcement) {
        return res.status(404).json({ status: 'error', data: null, message: 'Announcement not found' });
      }
      announcement.subject = subject;
      announcement.detail = detail;
      announcement.Image = Image;
      announcement.createdBy = createdBy;
      await announcementRepo.save(announcement);
      res.json({ status: 'success', data: announcement, message: 'Announcement updated' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  /**
   * @swagger
   * /api/announcements/{id}:
   *   delete:
   *     summary: Delete an announcement
   *     tags:
   *       - Announcements
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Announcement deleted
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                 data:
   *                   type: object
   *                 message:
   *                   type: string
   *       404:
   *         description: Announcement not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                 data:
   *                   type: object
   *                 message:
   *                   type: string
   */
  // Delete announcement
  router.delete('/announcements/:id', async (req, res) => {
    try {
      const announcementRepo = AppDataSource.getRepository('Announcements');
      const announcement = await announcementRepo.findOneBy({ id: req.params.id });
      if (!announcement) {
        return res.status(404).json({ status: 'error', data: null, message: 'Announcement not found' });
      }
      await announcementRepo.remove(announcement);
      res.json({ status: 'success', data: null, message: 'Announcement deleted' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  return router;
};