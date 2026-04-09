const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, default: null },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: null },
  role: { type: String, default: 'user' }, // could be 'admin' or 'user'
  location: { type: String, default: null },
  profilePictureUrl: { type: String, default: null },
}, { timestamps: true });

// Method to check if profile is complete
userSchema.methods.isProfileComplete = function() {
  return Boolean(this.name && this.email && this.location);
};

module.exports = mongoose.model('User', userSchema);
