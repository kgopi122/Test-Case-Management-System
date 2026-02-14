const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Team = require('../models/Team');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('mode').optional().isIn(['individual', 'team']).withMessage('Invalid signup mode'),
  body('teamName').if(body('mode').equals('team')).notEmpty().withMessage('Team name is required for team registration')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { name, email, password, mode = 'individual', teamName } = req.body;

    // Check if user exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    let user;
    let team;

    if (mode === 'team') {
      // Check if team name exists
      const existingTeam = await Team.findOne({ name: teamName });
      if (existingTeam) {
        return res.status(400).json({ success: false, message: 'Team name already exists' });
      }

      // 1. Create Team (temporarily without lead)
      team = new Team({ name: teamName, lead: new mongoose.Types.ObjectId() }); // Placeholder ID

      // 2. Create User (Lead)
      user = new User({
        name,
        email,
        password,
        role: 'admin',
        accessMode: 'team_lead',
        team: team._id
      });

      // 3. Fix Team Lead ID and save both
      team.lead = user._id;
      // Also add lead to members list? Usually lead is distinct or also a member. Let's add to members too for simplicity in queries.
      team.members.push(user._id);

      await team.save();
      await user.save();

    } else {
      // Individual Mode
      user = new User({
        name,
        email,
        password,
        role: 'tester',
        accessMode: 'individual'
      });
      await user.save();
    }

    const token = user.generateAuthToken();

    // Populate team data before sending response
    await user.populate('team');

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user: user.toJSON(), token }
    });

  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
  }
});

// @route   POST /api/auth/signin
// @desc    Authenticate user and get token
// @access  Public
router.post('/signin', [
  body('password').notEmpty().withMessage('Password is required'),
  // Validation handles two cases: Email OR (TeamName + Username)
  body('email').if(body('username').not().exists()).isEmail().withMessage('Valid email required for individual/lead login'),
  body('teamName').if(body('email').not().exists()).notEmpty().withMessage('Team name required for member login'),
  body('username').if(body('email').not().exists()).notEmpty().withMessage('Username required for member login')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email, password, teamName, username } = req.body;
    let user;

    if (teamName && username) {
      // Team Member Login
      const team = await Team.findOne({ name: teamName });
      if (!team) {
        return res.status(400).json({ success: false, message: 'Team not found' });
      }
      user = await User.findOne({ username, team: team._id });
    } else if (email) {
      // Individual / Lead Login
      user = await User.findOne({ email });
    } else {
      return res.status(400).json({ success: false, message: 'Please provide Email or Team Credentials' });
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = user.generateAuthToken();

    // Populate team data
    await user.populate('team');

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: user.toJSON(), token }
    });

  } catch (error) {
    console.error('Signin error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    await req.user.populate('team');
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/auth/users
// @desc    Get all users (for dropdowns)
// @access  Private
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Get all users error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;


