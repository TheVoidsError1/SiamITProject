const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/positions:
 *   get:
 *     summary: Get all positions
 *     tags:
 *       - Positions
 *     responses:
 *       200:
 *         description: A list of positions
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

module.exports = (AppDataSource) => {
  router.get('/positions', async (req, res) => {
    try {
      const positionRepo = AppDataSource.getRepository('Position');
      const positions = await positionRepo.find();
      res.json({ status: 'success', data: positions, message: 'Positions fetched successfully' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: [], message: err.message });
    }
  });

  /**
   * @swagger
   * /api/positions:
   *   post:
   *     summary: Create a new position
   *     tags:
   *       - Positions
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               position_name:
   *                 type: string
   *     responses:
   *       201:
   *         description: Position created
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
  router.post('/positions', async (req, res) => {
    try {
      const positionRepo = AppDataSource.getRepository('Position');
      const position = positionRepo.create(req.body);
      const saved = await positionRepo.save(position);
      res.status(201).json({ status: 'success', data: saved, message: 'Position created successfully' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  /**
   * @swagger
   * /api/positions/{id}:
   *   delete:
   *     summary: Delete a position by ID
   *     tags:
   *       - Positions
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The position ID
   *     responses:
   *       200:
   *         description: Position deleted
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
  router.delete('/positions/:id', async (req, res) => {
    try {
      const positionRepo = AppDataSource.getRepository('Position');
      const result = await positionRepo.delete(req.params.id);
      if (result.affected === 0) {
        return res.status(404).json({ status: 'error', data: null, message: 'Position not found' });
      }
      res.json({ status: 'success', data: null, message: 'Position deleted successfully' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  return router;
};
