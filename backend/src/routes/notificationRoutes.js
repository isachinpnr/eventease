import express from 'express';
import {
  getVAPIDKey,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  getNotificationStatus
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/vapid-key', getVAPIDKey);
router.get('/status', protect, getNotificationStatus);
router.post('/subscribe', protect, subscribeToNotifications);
router.post('/unsubscribe', protect, unsubscribeFromNotifications);

export default router;

