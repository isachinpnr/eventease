import express from 'express';
import {
  createPayment,
  verifyPayment,
  getPaymentStatus,
  handleUroPayWebhook,
  checkPaymentStatus,
  manualVerifyPayment,
  confirmPayment
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Webhook route (UroPay sends JSON) - uses JSON parser
router.post('/webhook', express.json(), handleUroPayWebhook);

// Protected routes - these need JSON body parser (already applied globally)
router.post('/create-payment', protect, createPayment);
router.post('/verify', protect, verifyPayment);
router.post('/check-payment', protect, checkPaymentStatus);
router.post('/confirm-payment', protect, confirmPayment); // User confirms payment after paying
router.post('/manual-verify', protect, manualVerifyPayment); // Admin can verify payments manually
router.get('/status/:bookingId', protect, getPaymentStatus);

export default router;
