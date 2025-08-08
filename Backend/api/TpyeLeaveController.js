const express = require('express');
const router = express.Router();
const { BaseController, sendSuccess, sendError, sendNotFound } = require('../utils');

/**
 * @swagger
 * /api/leave-types:
 *   get:
 *     summary: Get all leave types
 *     tags:
 *       - LeaveTypes
 *     responses:
 *       200:
 *         description: A list of leave types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /api/leave-types:
 *   post:
 *     summary: Create a new leave type
 *     tags:
 *       - LeaveTypes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leave_type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Leave type created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /api/leave-types/{id}:
 *   put:
 *     summary: Update a leave type by ID
 *     tags:
 *       - LeaveTypes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The leave type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leave_type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Leave type updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /api/leave-types/{id}:
 *   delete:
 *     summary: Delete a leave type by ID
 *     tags:
 *       - LeaveTypes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The leave type ID
 *     responses:
 *       200:
 *         description: Leave type deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 */

module.exports = (AppDataSource) => {
  // Create base controller instance for LeaveType
  const leaveTypeController = new BaseController('LeaveType');

  // GET all leave types
  router.get('/leave-types', async (req, res) => {
    try {
      const leaveTypes = await leaveTypeController.findAll(AppDataSource);
      sendSuccess(res, leaveTypes, 'Fetched leave types successfully');
    } catch (err) {
      sendError(res, err.message, 500);
    }
  });

  // CREATE leave type
  router.post('/leave-types', async (req, res) => {
    try {
      const leaveTypeData = {
        leave_type_en: req.body.leave_type_en,
        leave_type_th: req.body.leave_type_th,
        require_attachment: req.body.require_attachment ?? false
      };
      const saved = await leaveTypeController.create(AppDataSource, leaveTypeData);
      sendSuccess(res, saved, 'Created leave type successfully', 201);
    } catch (err) {
      sendError(res, err.message, 500);
    }
  });

  // UPDATE leave type
  router.put('/leave-types/:id', async (req, res) => {
    try {
      const updateData = {
        leave_type_en: req.body.leave_type_en,
        leave_type_th: req.body.leave_type_th
      };
      if (typeof req.body.require_attachment !== 'undefined') {
        updateData.require_attachment = req.body.require_attachment;
      }
      const updated = await leaveTypeController.update(AppDataSource, req.params.id, updateData);
      sendSuccess(res, updated, 'Updated leave type successfully');
    } catch (err) {
      if (err.message === 'Record not found') {
        return sendNotFound(res, 'Leave type not found');
      }
      sendError(res, err.message, 500);
    }
  });

  // DELETE leave type
  router.delete('/leave-types/:id', async (req, res) => {
    try {
      await leaveTypeController.delete(AppDataSource, req.params.id);
      sendSuccess(res, null, 'Deleted leave type successfully');
    } catch (err) {
      if (err.message === 'Record not found') {
        return sendNotFound(res, 'Leave type not found');
      }
      sendError(res, err.message, 500);
    }
  });

  return router;
};
