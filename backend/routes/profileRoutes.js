const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/validate');
const { 
  getCurrentUserProfile,
  updateUserProfile, 
  createOrUpdateUserProfile,
  uploadProfilePicture
} = require('../controllers/profileControllers.js');
const upload = require('../middlewares/upload');

// Get the current user's profile
router.get('/me', verifyToken, getCurrentUserProfile);

// Update user profile
router.put('/me', verifyToken, updateUserProfile);

// Create or update the current user's profile
router.post('/me', verifyToken, createOrUpdateUserProfile);

// Upload optional profile picture
router.post('/me/profile-picture', verifyToken, upload.single('image'), uploadProfilePicture);

module.exports = router;
