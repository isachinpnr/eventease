import express from 'express';
import {
  createBooking,
  getUserBookings,
  getBooking,
  cancelBooking,
  downloadBookingPDF
} from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';
import { bookingLogger } from '../middleware/bookingLogger.js';

const router = express.Router();

router.post('/', protect, bookingLogger, createBooking);
router.get('/', protect, getUserBookings);
router.get('/:id', protect, getBooking);
router.get('/:id/pdf', protect, downloadBookingPDF);
router.put('/:id/cancel', protect, cancelBooking);

export default router;

