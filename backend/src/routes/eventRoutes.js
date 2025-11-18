import express from 'express';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventAttendees
} from '../controllers/eventController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEvent);
router.get('/:id/attendees', protect, admin, getEventAttendees);
router.post('/', protect, admin, createEvent);
router.put('/:id', protect, admin, updateEvent);
router.delete('/:id', protect, admin, deleteEvent);

export default router;

