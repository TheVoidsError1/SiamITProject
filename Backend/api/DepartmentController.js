const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: Get all departments
 *     tags:
 *       - Departments
 *     responses:
 *       200:
 *         description: A list of departments
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
  router.get('/departments', async (req, res) => {
    try {
      const departmentRepo = AppDataSource.getRepository('Department');
      const departments = await departmentRepo.find();
      res.json({ status: 'success', data: departments, message: 'Departments fetched successfully' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: [], message: err.message });
    }
  });

  /**
   * @swagger
   * /api/departments:
   *   post:
   *     summary: Create a new department
   *     tags:
   *       - Departments
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               department_name:
   *                 type: string
   *     responses:
   *       201:
   *         description: Department created
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
  router.post('/departments', async (req, res) => {
    try {
      const departmentRepo = AppDataSource.getRepository('Department');
      const department = departmentRepo.create(req.body);
      const saved = await departmentRepo.save(department);
      res.status(201).json({ status: 'success', data: saved, message: 'Department created successfully' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  /**
   * @swagger
   * /api/departments/{id}:
   *   delete:
   *     summary: Delete a department by ID
   *     tags:
   *       - Departments
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The department ID
   *     responses:
   *       200:
   *         description: Department deleted
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
  router.delete('/departments/:id', async (req, res) => {
    try {
      const departmentRepo = AppDataSource.getRepository('Department');
      const result = await departmentRepo.delete(req.params.id);
      if (result.affected === 0) {
        return res.status(404).json({ status: 'error', data: null, message: 'Department not found' });
      }
      res.json({ status: 'success', data: null, message: 'Department deleted successfully' });
    } catch (err) {
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  /**
  @swagger
  /api/departments:
  get:
  summary: Get all departments
  tags:
  Departments
  responses:
  200:
  description: A list of departments
  content:
  application/json:
  schema:
  type: object
  properties:
  status:
  type: string
  data:
  type: array
  items:
  type: object
  message:
  type: string*/

    router.get('/departments', async (req, res) => {
      try {
        const departmentRepo = AppDataSource.getRepository('Department');
        const departments = await departmentRepo.find();
        res.json({ status: 'success', data: departments, message: 'Departments fetched successfully' });
      } catch (err) {
        res.status(500).json({ status: 'error', data: [], message: err.message });
      }
    });

  return router;
};
