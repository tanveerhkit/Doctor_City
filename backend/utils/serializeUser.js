const serializeUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  location: user.location,
  profilePictureUrl: user.profilePictureUrl || null,
  isProfileComplete: user.isProfileComplete(),
});

module.exports = {
  serializeUser,
};
