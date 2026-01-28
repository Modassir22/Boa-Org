const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { promisePool } = require('../config/database');
const { ACTIVITY_TYPES, createActivityNotification } = require('../utils/activity-logger');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Register User
exports.register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const {
      title, first_name, surname, email, password, mobile, phone,
      gender, dob, membership_no, is_boa_member,
      house, street, landmark, city, state, country, pin_code
    } = req.body;

    // Check if user already exists
    const [existingUser] = await promisePool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [userResult] = await promisePool.query(
      `INSERT INTO users (title, first_name, surname, email, password, mobile, phone, 
       gender, dob, membership_no, is_boa_member) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, first_name, surname, email, hashedPassword, mobile, phone, 
       gender, dob, membership_no, is_boa_member || false]
    );

    const userId = userResult.insertId;

    // Insert address
    await promisePool.query(
      `INSERT INTO addresses (user_id, house, street, landmark, city, state, country, pin_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, house, street, landmark, city, state, country || 'India', pin_code]
    );

    // Generate token
    const token = generateToken(userId);

    // Create activity notification for admin
    await createActivityNotification(ACTIVITY_TYPES.NEW_USER, {
      name: `${title} ${first_name} ${surname}`,
      email: email
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        email,
        first_name,
        surname
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user
    const [users] = await promisePool.query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        surname: user.surname,
        role: user.role,
        membership_no: user.membership_no
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Login with Membership Number
exports.loginWithMembership = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { membership_no, password } = req.body;
    // Find user by membership number
    const [users] = await promisePool.query(
      'SELECT * FROM users WHERE membership_no = ? AND is_active = TRUE',
      [membership_no]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid membership number or password'
      });
    }

    const user = users[0];
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid membership number or password'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        surname: user.surname,
        role: user.role,
        membership_no: user.membership_no
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};
