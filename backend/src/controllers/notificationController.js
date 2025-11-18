import User from '../models/User.js';
import { getVAPIDPublicKey } from '../utils/pushNotification.js';

// @desc    Get VAPID public key
// @route   GET /api/notifications/vapid-key
// @access  Public
export const getVAPIDKey = async (req, res) => {
  try {
    const publicKey = getVAPIDPublicKey();
    res.json({ publicKey });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Subscribe user to push notifications
// @route   POST /api/notifications/subscribe
// @access  Private
export const subscribeToNotifications = async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription data' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Store push subscription
    user.pushSubscription = subscription;
    await user.save();
    
    res.json({ 
      message: 'Successfully subscribed to push notifications',
      subscribed: true 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unsubscribe user from push notifications
// @route   POST /api/notifications/unsubscribe
// @access  Private
export const unsubscribeFromNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove push subscription
    user.pushSubscription = null;
    await user.save();
    
    res.json({ 
      message: 'Successfully unsubscribed from push notifications',
      subscribed: false 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user notification subscription status
// @route   GET /api/notifications/status
// @access  Private
export const getNotificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      subscribed: !!user.pushSubscription,
      hasSubscription: !!user.pushSubscription
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

