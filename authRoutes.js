const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleAuth } = require('../controllers/authController');

// Email/Password Authentication Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Google Authentication Route
router.post('/google', googleAuth);

module.exports = router;
