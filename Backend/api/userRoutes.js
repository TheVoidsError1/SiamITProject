const express = require('express');
const UserController = require('./userController');

const router = express.Router();
let userController;

const setController = (dataSource) => {
  userController = new UserController(dataSource);
};

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
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
 *     responses:
 *       201:
 *         description: User created
 */
router.get('/', (req, res) => {
  if (!userController) return res.status(500).json({ success: false, message: 'Controller not initialized' });
  userController.getAllUsers(req, res);
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
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
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.get('/:id', (req, res) => {
  if (!userController) return res.status(500).json({ success: false, message: 'Controller not initialized' });
  userController.getUserById(req, res);
});

router.post('/', (req, res) => {
  if (!userController) return res.status(500).json({ success: false, message: 'Controller not initialized' });
  userController.createUser(req, res);
});

router.put('/:id', (req, res) => {
  if (!userController) return res.status(500).json({ success: false, message: 'Controller not initialized' });
  userController.updateUser(req, res);
});

router.delete('/:id', (req, res) => {
  if (!userController) return res.status(500).json({ success: false, message: 'Controller not initialized' });
  userController.deleteUser(req, res);
});

module.exports = { router, setController }; 