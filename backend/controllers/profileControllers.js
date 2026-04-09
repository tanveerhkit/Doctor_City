const User = require('../models/userModel.js');
const xss = require('xss');
const { asyncHandler } = require('../utils/asyncHandler.js');
const { uploadOnCloudinary } = require('../utils/cloudinary.js');
const { serializeUser } = require('../utils/serializeUser.js');

const getCurrentUser = async (req) => {
  if (!req.user?.sub) {
    return null;
  }

  return User.findById(req.user.sub);
};

const resolveUserRole = (email, existingRole) => {
  if (existingRole === 'admin') {
    return existingRole;
  }

  return email.endsWith(process.env.DOMAIN_NAME || '@admin.com') ? 'admin' : 'user';
};

// Get user profile for the currently authenticated user
const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(serializeUser(user));
});

// Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, location, profilePictureUrl } = req.body;

  // Validate required fields
  if (!name || !email || !location) {
    return res.status(400).json({ 
      error: 'Name, email, and location are required' 
    });
  }

  // Sanitize inputs
  const sanitizedName = xss(String(name).trim());
  const sanitizedEmail = xss(String(email).trim().toLowerCase());
  const sanitizedLocation = xss(location);

  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if email is already taken by another user
  const existingUser = await User.findOne({ 
    email: sanitizedEmail, 
    _id: { $ne: currentUser._id } 
  });
  
  if (existingUser) {
    return res.status(409).json({ error: 'Email already taken by another user' });
  }

  // Find and update user
  const user = await User.findOneAndUpdate(
    { _id: currentUser._id },
    { 
      name: sanitizedName, 
      email: sanitizedEmail, 
      location: sanitizedLocation,
      role: resolveUserRole(sanitizedEmail, currentUser.role),
      ...(profilePictureUrl ? { profilePictureUrl: xss(profilePictureUrl) } : {})
    },
    { new: true, runValidators: true }
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    ...serializeUser(user),
    message: 'Profile updated successfully',
  });
});

// Create or update the current user's profile
const createOrUpdateUserProfile = asyncHandler(async (req, res) => {
  const { email, name, location, profilePictureUrl } = req.body;

  if (!req.user?.sub || !email) {
    return res.status(400).json({ 
      error: 'Authenticated user and email are required' 
    });
  }

  const sanitizedEmail = xss(String(email).trim().toLowerCase());
  const sanitizedName = name ? xss(String(name).trim()) : null;
  const sanitizedLocation = location ? xss(location) : null;
  const sanitizedProfilePictureUrl = profilePictureUrl ? xss(profilePictureUrl) : null;

  const user = await getCurrentUser(req);

  if (!user) {
    return res.status(404).json({
      error: 'User not found'
    });
  }

  user.email = sanitizedEmail;
  if (sanitizedName) user.name = sanitizedName;
  if (sanitizedLocation) user.location = sanitizedLocation;
  if (sanitizedProfilePictureUrl) user.profilePictureUrl = sanitizedProfilePictureUrl;
  user.role = resolveUserRole(sanitizedEmail, user.role);
  await user.save();

  res.json({
    ...serializeUser(user),
    message: user.isProfileComplete() ? 'Profile complete' : 'Profile incomplete'
  });
});

module.exports = {
  getCurrentUserProfile,
  updateUserProfile,
  createOrUpdateUserProfile,
  // Upload and set user's profile picture
  uploadProfilePicture: asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const localFilePath = req.file.path;
    const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

    if (!cloudinaryResponse) {
      return res.status(500).json({ error: 'Failed to upload image' });
    }

    const imageUrl = cloudinaryResponse.secure_url;

    const user = await getCurrentUser(req);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.profilePictureUrl = imageUrl;
    await user.save();

    return res.json({ profilePictureUrl: imageUrl });
  })
};
