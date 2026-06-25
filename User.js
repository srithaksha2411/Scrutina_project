const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters'],
    maxlength: [50, 'Full name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: false, // Optional for Google users
    minlength: [6, 'Password must be at least 6 characters']
  },
  uid: {
    type: String,
    sparse: true,
    unique: true
  },
  photo: {
    type: String,
    default: null
  },
  loginProvider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
userSchema.index({ email: 1, loginProvider: 1 });

module.exports = mongoose.model('User', userSchema);
