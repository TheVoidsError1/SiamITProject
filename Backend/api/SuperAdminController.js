/**
 * @swagger
 * tags:
 *   name: SuperAdmin
 *   description: API for managing superadmins
 */

/**
 * @swagger
 * /api/superadmin:
 *   post:
 *     summary: Create a new superadmin
 *     tags: [SuperAdmin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               superadmin_name:
 *                 type: string
 *               department:
 *                 type: string
 *               position:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Superadmin created successfully
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
 *       400:
 *         description: Duplicate name or email, or invalid department/position
 *       500:
 *         description: Internal server error
 *
 * /api/superadmin/{id}:
 *   delete:
 *     summary: Delete a superadmin by ID
 *     tags: [SuperAdmin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The superadmin's ID
 *     responses:
 *       200:
 *         description: Superadmin deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Superadmin not found
 *       500:
 *         description: Internal server error
 */
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (AppDataSource) => {
  const router = require('express').Router();

  // Create superadmin
  router.post('/superadmin', async (req, res) => {
    try {
      const { superadmin_name, department, position, email, password } = req.body;
      const superadminRepo = AppDataSource.getRepository('SuperAdmin');
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const departmentRepo = AppDataSource.getRepository('department');
      const positionRepo = AppDataSource.getRepository('position');

      // Check for duplicate name
      const nameExist = await superadminRepo.findOneBy({ superadmin_name });
      if (nameExist) {
        return res.status(400).json({ success: false, data: null, message: 'Superadmin name already exists' });
      }

      // Check for duplicate email
      const exist = await processRepo.findOneBy({ Email: email });
      if (exist) {
        return res.status(400).json({ success: false, data: null, message: 'Email already exists' });
      }

      // Accept department as name or ID
      let departmentId = null;
      if (department) {
        // Check if department is a valid UUID (36 chars, dashes)
        const uuidRegex = /^[0-9a-fA-F-]{36}$/;
        if (uuidRegex.test(department)) {
          departmentId = department;
        } else {
          const deptEntity = await departmentRepo.findOne({ where: { department_name: department } });
          if (!deptEntity) {
            return res.status(400).json({ success: false, data: null, message: 'Department not found' });
          }
          departmentId = deptEntity.id;
        }
      }

      // Accept position as name or ID
      let positionId = null;
      if (position) {
        const uuidRegex = /^[0-9a-fA-F-]{36}$/;
        if (uuidRegex.test(position)) {
          positionId = position;
        } else {
          const posEntity = await positionRepo.findOne({ where: { position_name: position } });
          if (!posEntity) {
            return res.status(400).json({ success: false, data: null, message: 'Position not found' });
          }
          positionId = posEntity.id;
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create superadmin
      const superadmin = superadminRepo.create({
        id: uuidv4(),
        superadmin_name,
        department: departmentId,
        position: positionId
      });
      await superadminRepo.save(superadmin);

      // Create JWT Token
      const token = jwt.sign(
        { userId: superadmin.id, email: email },
        'your_secret_key',
        { expiresIn: '1h' }
      );

      // Create process_check with Token and Repid
      const processCheck = processRepo.create({
        id: uuidv4(),
        Email: email,
        Password: hashedPassword,
        Token: token,
        Repid: superadmin.id,
        Role: 'superadmin',
        avatar_url: null
      });
      await processRepo.save(processCheck);

      res.status(201).json({
        success: true,
        data: { ...superadmin, token, repid: superadmin.id },
        message: 'Superadmin created successfully'
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY' && err.message.includes('Email')) {
        return res.status(400).json({ success: false, data: null, message: 'Email already exists' });
      }
      if (err.code === 'ER_DUP_ENTRY' && err.message.includes('superadmin_name')) {
        return res.status(400).json({ success: false, data: null, message: 'Superadmin name already exists' });
      }
      res.status(500).json({ success: false, data: null, message: err.message });
    }
  });

  // Delete superadmin
  router.delete('/superadmin/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const superadminRepo = AppDataSource.getRepository('SuperAdmin');
      const processRepo = AppDataSource.getRepository('ProcessCheck');

      // Delete from process_check
      await processRepo.delete({ Repid: id, Role: 'superadmin' });
      // Delete from superadmin table
      const result = await superadminRepo.delete({ id });
      if (result.affected === 0) {
        return res.status(404).json({ success: false, message: 'Superadmin not found' });
      }
      res.json({ success: true, message: 'Superadmin deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}; 