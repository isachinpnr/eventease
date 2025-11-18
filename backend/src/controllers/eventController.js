import Event from '../models/Event.js';
import { generateEventId } from '../utils/generateEventId.js';
import { getEventStatus } from '../utils/eventStatus.js';

// @desc    Get all events (with filters)
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res) => {
  try {
    const { category, location, startDate, endDate } = req.query;
    
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (location) {
      query.location = location;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }
    
    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .sort({ date: 1 });
    
    // Update status for each event
    const eventsWithStatus = await Promise.all(
      events.map(async (event) => {
        const status = getEventStatus(event.date, event.time);
        if (event.status !== status) {
          event.status = status;
          await event.save(); // Save updated status
        }
        return event;
      })
    );
    
    res.json(eventsWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Update status
    const status = getEventStatus(event.date, event.time);
    if (event.status !== status) {
      event.status = status;
      await event.save();
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private/Admin
export const createEvent = async (req, res) => {
  try {
    const eventId = generateEventId();
    
    const event = await Event.create({
      ...req.body,
      eventId,
      createdBy: req.user._id,
      status: getEventStatus(req.body.date, req.body.time)
    });
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin
export const updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Update status if date or time changed
    if (req.body.date || req.body.time) {
      const dateToCheck = req.body.date || event.date;
      const timeToCheck = req.body.time || event.time;
      req.body.status = getEventStatus(dateToCheck, timeToCheck);
    }
    
    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    await event.deleteOne();
    res.json({ message: 'Event removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get event attendees
// @route   GET /api/events/:id/attendees
// @access  Private/Admin
export const getEventAttendees = async (req, res) => {
  try {
    const Booking = (await import('../models/Booking.js')).default;
    
    const bookings = await Booking.find({ 
      event: req.params.id,
      status: 'Confirmed'
    })
      .populate('user', 'name email')
      .populate('event', 'title date');
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

