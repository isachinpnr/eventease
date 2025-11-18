import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { sendRegistrationEmail } from '../utils/emailService.js';
import { sendRegistrationNotification } from '../utils/pushNotification.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    if (user) {
      // Send registration welcome email (async, don't wait)
      sendRegistrationEmail(user).catch(err => {
        console.error('Registration email error:', err);
      });
      
      // Send push notification if user has subscription (async, don't wait)
      // Note: New users won't have subscription yet, but we'll send it after they subscribe
      // This is handled in the frontend after subscription
      
      // Log registration notification
      console.log('='.repeat(60));
      console.log('🎉 NEW USER REGISTRATION NOTIFICATION');
      console.log('='.repeat(60));
      console.log(`User: ${user.name} (${user.email})`);
      console.log(`Role: ${user.role}`);
      console.log(`Registered at: ${new Date().toISOString()}`);
      console.log('='.repeat(60));
      
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        message: 'Registration successful! Welcome email sent.'
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

