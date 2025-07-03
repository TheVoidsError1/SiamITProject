const express = require('express');
const ProfileController = require('./profileController');

const router = express.Router();
let profileController;

const setController = (dataSource) => {
  profileController = new ProfileController(dataSource);
};

// PUT /api/profile/:id
router.put('/:id', (req, res) => {
  if (!profileController) return res.status(500).json({ success: false, message: 'Controller not initialized' });
  profileController.updateProfile(req, res);
});

module.exports = { router, setController }; 