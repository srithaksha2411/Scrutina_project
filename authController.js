const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyIdToken, isInitialized } = require('../config/firebase-admin');

// Email validation regex
const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

// Password validation (min 6 chars, at least 1 letter, 1 number)
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields' 
      });
    }

    // Validate full name
    if (fullName.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        message: 'Full name must be at least 2 characters' 
      });
    }

    // Validate email
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid email address' 
      });
    }

    // Validate password strength
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters and contain at least one letter and one number' 
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Passwords do not match' 
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });

    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'An account with this email already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      loginProvider: 'email'
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          createdAt: user.createdAt
        }
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      });
    }

    // Validate email format
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid email address' 
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check if user registered with Google
    if (user.loginProvider === 'google') {
      return res.status(401).json({ 
        success: false,
        message: 'This account uses Google sign-in. Please sign in with Google.' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          photo: user.photo,
          loginProvider: user.loginProvider
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
};

// @desc    Google authentication with Firebase ID token verification
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    console.log('\n🔐 Google Authentication Request Received');
    console.log('============================================');
    
    const { idToken } = req.body;

    // Check if Firebase Admin SDK is initialized
    if (!isInitialized) {
      console.error('❌ Firebase Admin SDK not initialized');
      return res.status(503).json({ 
        success: false,
        message: 'Google authentication is temporarily unavailable. Service configuration error.',
        technicalError: 'Firebase Admin SDK not initialized - service account missing'
      });
    }

    // Validate ID token presence
    if (!idToken) {
      console.error('❌ No idToken provided in request body');
      return res.status(400).json({ 
        success: false,
        message: 'Firebase ID token is required' 
      });
    }

    console.log('✅ ID token received from frontend');
    console.log('📊 Token type:', typeof idToken);
    console.log('📊 Token length:', idToken.length);

    // Verify Firebase ID token
    console.log('🔍 Verifying token with Firebase Admin SDK...');
    const verificationResult = await verifyIdToken(idToken);

    if (!verificationResult.success) {
      console.error('❌ Token verification failed');
      console.error('❌ Error:', verificationResult.error);
      console.error('❌ Details:', verificationResult.details);
      console.error('❌ Code:', verificationResult.code);
      
      return res.status(401).json({ 
        success: false,
        message: verificationResult.error,
        technicalError: verificationResult.details
      });
    }

    console.log('✅ Token verified successfully');

    // Extract verified user data from token
    const decodedToken = verificationResult.data;
    const { uid, email, name, picture } = decodedToken;

    console.log('📋 Extracted user data:');
    console.log('   - UID:', uid);
    console.log('   - Email:', email);
    console.log('   - Name:', name);
    console.log('   - Picture:', picture ? 'Yes' : 'No');

    // Validate required fields from token
    if (!uid || !email) {
      console.error('❌ Missing required fields from decoded token');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid token data: missing uid or email' 
      });
    }

    // Check if user exists by Firebase UID (primary identifier)
    console.log('🔍 Checking if user exists by UID...');
    let user = await User.findOne({ uid: uid });

    if (!user) {
      console.log('❌ User not found by UID');
      console.log('🔍 Checking if email exists with different provider...');
      
      // Check if email exists with different provider
      const existingEmailUser = await User.findOne({ email: email.toLowerCase() });
      
      if (existingEmailUser && existingEmailUser.loginProvider === 'email') {
        console.log('❌ Email already registered with email/password method');
        return res.status(409).json({ 
          success: false,
          message: 'An account with this email already exists. Please sign in with email and password.' 
        });
      }

      console.log('✅ Email is available');
      console.log('📝 Creating new Google user...');

      // Create new Google user
      user = await User.create({
        fullName: name || email.split('@')[0], // Fallback to email username if name not provided
        email: email.toLowerCase(),
        uid: uid,
        photo: picture || null,
        loginProvider: 'google',
        password: null, // No password for Google users
        lastLogin: Date.now()
      });

      console.log(`✅ New Google user created: ${email}`);
      console.log(`✅ User ID: ${user._id}`);
    } else {
      console.log('✅ User found by UID');
      console.log('📝 Updating last login and photo...');
      
      // Update existing user's last login and photo
      user.lastLogin = Date.now();
      if (picture) {
        user.photo = picture;
      }
      await user.save();

      console.log(`✅ Existing Google user logged in: ${email}`);
    }

    // Generate JWT token using existing system
    console.log('🔑 Generating JWT token...');
    const token = jwt.sign(
      { id: user._id, email: user.email, uid: user.uid },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ JWT token generated');
    console.log('✅ Authentication successful!');
    console.log('============================================\n');

    // Return success response
    res.status(200).json({
      success: true,
      message: user.createdAt.getTime() === user.lastLogin.getTime() 
        ? 'Account created successfully' 
        : 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          photo: user.photo,
          uid: user.uid,
          loginProvider: user.loginProvider
        }
      }
    });

  } catch (error) {
    console.error('\n❌ Google auth error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('============================================\n');
    
    res.status(500).json({ 
      success: false,
      message: 'Server error during Google authentication. Please try again later.',
      technicalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleAuth
};
