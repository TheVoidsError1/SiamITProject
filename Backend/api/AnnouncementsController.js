const express = require('express');

module.exports = (AppDataSource) => {
  const router = express.Router();

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
  router.post('/announcements', async (req, res) => {
    try {
      const announcementRepo = AppDataSource.getRepository('Announcements');
      const { subject, detail, Image, createdBy } = req.body;
      const newAnnouncement = announcementRepo.create({ subject, detail, Image, createdBy });
      await announcementRepo.save(newAnnouncement);
      res.json({ status: 'success', data: newAnnouncement, message: 'Announcement created' });
    } catch (err) {
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