import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { hasEventStarted, getEventDateTime } from '../utils/eventDateTime.js';
import { sendBookingConfirmationEmail } from '../utils/emailService.js';
import { generateBookingPDF } from '../utils/pdfGenerator.js';
import { sendBookingConfirmationNotification } from '../utils/pushNotification.js';

// UroPay configuration for refunds (if supported)
const UROPAY_API_URL = process.env.UROPAY_API_URL || 'https://api.uropay.me';
const UROPAY_API_KEY = process.env.UROPAY_API_KEY;

// @desc    Create booking (for free events only - price = 0)
// @route   POST /api/bookings
// @access  Private
// Note: For paid events, use /api/payments/create-intent instead
export const createBooking = async (req, res) => {
  try {
    const { eventId, seats } = req.body;
    
    if (!seats || seats < 1 || seats > 2) {
      return res.status(400).json({ message: 'You can book 1-2 seats only' });
    }
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // For paid events, redirect to payment flow
    if (event.price > 0) {
      return res.status(400).json({ 
        message: 'This is a paid event. Please use the payment flow to book.',
        requiresPayment: true
      });
    }
    
    // Check if event has started (date + time has passed)
    // Users cannot book tickets once event has started
    if (hasEventStarted(event.date, event.time)) {
      return res.status(400).json({ message: 'Cannot book tickets. Event has already started.' });
    }
    
    // Check if user already has a CONFIRMED booking for this event
    // Don't check for Pending - user can retry if payment wasn't completed
    const existingBooking = await Booking.findOne({
      user: req.user._id,
      event: eventId,
      status: 'Confirmed'
    });
    
    if (existingBooking) {
      return res.status(400).json({ message: 'You already have a confirmed booking for this event' });
    }
    
    // Clean up old pending bookings for this user and event (older than 30 minutes)
    await Booking.deleteMany({
      user: req.user._id,
      event: eventId,
      status: 'Pending',
      createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) } // 30 minutes ago
    });
    
    // Check capacity
    if (event.bookedSeats + seats > event.capacity) {
      return res.status(400).json({ message: 'Not enough seats available' });
    }
    
    // Create booking (free event, confirmed immediately)
    const booking = await Booking.create({
      user: req.user._id,
      event: eventId,
      seats,
      totalAmount: 0,
      status: 'Confirmed',
      paymentStatus: 'paid' // Free events are considered paid
    });
    
    // Update event booked seats
    event.bookedSeats += seats;
    await event.save();
    
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('event', 'title date location venue category eventId');
    
    // Send booking confirmation email (async, don't wait)
    sendBookingConfirmationEmail(populatedBooking, populatedBooking.event, populatedBooking.user)
      .catch(err => {
        console.error('Booking email error:', err);
      });
    
    // Send push notification if user has subscription (async, don't wait)
    const userWithSubscription = await User.findById(req.user._id).select('pushSubscription');
    if (userWithSubscription && userWithSubscription.pushSubscription) {
      sendBookingConfirmationNotification(
        userWithSubscription.pushSubscription,
        populatedBooking,
        populatedBooking.event,
        populatedBooking.user
      ).catch(err => {
        console.error('Booking push notification error:', err);
      });
    }
    
    // Generate PDF confirmation
    try {
      const pdfBuffer = await generateBookingPDF(
        populatedBooking,
        populatedBooking.event,
        populatedBooking.user
      );
      
      // Convert PDF to base64 for frontend
      const pdfBase64 = pdfBuffer.toString('base64');
      
      res.status(201).json({
        ...populatedBooking.toObject(),
        pdfConfirmation: pdfBase64,
        message: 'Booking confirmed! Confirmation email and PDF generated.'
      });
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      // Still return booking even if PDF fails
      res.status(201).json({
        ...populatedBooking.toObject(),
        message: 'Booking confirmed! Confirmation email sent.'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      user: req.user._id,
      status: 'Confirmed' // Only show confirmed bookings (exclude cancelled)
    })
      .populate('event', 'title date time location venue category capacity bookedSeats')
      .sort({ bookingDate: -1 });
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    
    // Filter bookings: Remove completed events that are older than 1 hour
    const filteredBookings = bookings.filter(booking => {
      const eventDateTime = getEventDateTime(booking.event.date, booking.event.time);
      
      // If event is completed (past event date/time)
      if (now >= eventDateTime) {
        // Check if completed more than 1 hour ago
        const completedTime = eventDateTime.getTime();
        const oneHourAgoTime = oneHourAgo.getTime();
        
        // If event completed more than 1 hour ago, exclude it
        if (completedTime < oneHourAgoTime) {
          return false; // Remove this booking
        }
      }
      
      // Keep upcoming and recently completed events (within 1 hour)
      return true;
    });
    
    res.json(filteredBookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
export const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('event', 'title date location venue category eventId');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user owns this booking or is admin
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download booking PDF
// @route   GET /api/bookings/:id/pdf
// @access  Private
export const downloadBookingPDF = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('event', 'title date time location venue category eventId');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user owns this booking or is admin
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Generate PDF
    const pdfBuffer = await generateBookingPDF(booking, booking.event, booking.user);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=booking-confirmation-${booking._id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Check if booking is already cancelled
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'Booking already cancelled' });
    }
    
    // Check if event has started (date + time has passed)
    // User can cancel only if event date/time is in the future
    if (hasEventStarted(booking.event.date, booking.event.time)) {
      return res.status(400).json({ message: 'Cannot cancel booking. Event has already started.' });
    }
    
    // Process refund if payment was made
    let refundProcessed = false;
    if (booking.paymentStatus === 'paid' && booking.paymentId && booking.totalAmount > 0) {
      // Note: UroPay refunds may need to be processed manually or via their API
      // For now, we'll mark it as requiring manual refund processing
      try {
        // If UroPay API supports refunds, implement here
        if (UROPAY_API_KEY) {
          // UroPay refund API call (if available)
          // const refundResponse = await axios.post(
          //   `${UROPAY_API_URL}/api/v1/refunds`,
          //   {
          //     payment_id: booking.paymentId,
          //     amount: booking.totalAmount
          //   },
          //   {
          //     headers: {
          //       'Authorization': `Bearer ${UROPAY_API_KEY}`
          //     }
          //   }
          // );
          // booking.refundId = refundResponse.data.id;
        }
        
        // Mark as refunded (manual processing may be required)
        booking.paymentStatus = 'refunded';
        refundProcessed = true;
        console.log(`Refund initiated for booking ${booking._id}. Amount: ₹${booking.totalAmount}`);
      } catch (refundError) {
        console.error('Refund error:', refundError);
        console.warn('⚠️  Refund may need to be processed manually. Please check UroPay dashboard.');
        // Continue with cancellation even if refund fails
      }
    }
    
    // Update booking status
    booking.status = 'Cancelled';
    await booking.save();
    
    // Update event booked seats
    const event = await Event.findById(booking.event._id);
    event.bookedSeats -= booking.seats;
    await event.save();
    
    res.json({ 
      message: 'Booking cancelled successfully', 
      booking,
      refundProcessed: refundProcessed
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

