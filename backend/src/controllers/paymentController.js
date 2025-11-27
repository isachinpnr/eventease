import axios from 'axios';
import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { hasEventStarted } from '../utils/eventDateTime.js';
import { sendBookingConfirmationEmail } from '../utils/emailService.js';
import { generateBookingPDF } from '../utils/pdfGenerator.js';
import { sendBookingConfirmationNotification } from '../utils/pushNotification.js';

// UroPay API configuration
const UROPAY_API_URL = process.env.UROPAY_API_URL || 'https://api.uropay.me';
const UROPAY_API_KEY = process.env.UROPAY_API_KEY?.trim();
const UROPAY_API_SECRET = process.env.UROPAY_API_SECRET?.trim();

// Helper function to check if API secret is valid (not a placeholder)
const isUroPaySecretValid = (secret) => {
  if (!secret) return false;
  // Check for common placeholder patterns
  const placeholderPatterns = [
    'your_uropay',
    'your_actual',
    'replace_with',
    '1234@',
    'placeholder',
    'example'
  ];
  const secretLower = secret.toLowerCase();
  return !placeholderPatterns.some(pattern => secretLower.includes(pattern));
};

// @desc    Create payment (without creating booking)
// @route   POST /api/payments/create-payment
// @access  Private
export const createPayment = async (req, res) => {
  try {
    // Check if body is parsed
    if (!req.body) {
      return res.status(400).json({ message: 'Request body is missing' });
    }
    
    const { eventId, seats } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }
    
    if (!seats || seats < 1 || seats > 2) {
      return res.status(400).json({ message: 'You can book 1-2 seats only' });
    }
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if event has started
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
    
    // Check capacity (only count confirmed bookings)
    const confirmedBookings = await Booking.countDocuments({
      event: eventId,
      status: 'Confirmed'
    });
    
    if (confirmedBookings + seats > event.capacity) {
      return res.status(400).json({ message: 'Not enough seats available' });
    }
    
    const totalAmount = event.price * seats;
    
    // Generate a unique payment reference for tracking
    const paymentReference = `EVT-${eventId.slice(-6)}-${req.user._id.toString().slice(-6)}-${Date.now().toString().slice(-8)}`;
    
    // Create a pending booking to track this payment attempt
    // This will be confirmed when payment is verified
    const pendingBooking = await Booking.create({
      user: req.user._id,
      event: eventId,
      seats,
      totalAmount,
      status: 'Pending',
      paymentStatus: 'pending',
      paymentIntentId: paymentReference // Store payment reference
    });
    
    // Try UroPay API if available (optional)
    if (UROPAY_API_KEY && UROPAY_API_SECRET) {
      // Check if API secret is valid (not a placeholder)
      if (!isUroPaySecretValid(UROPAY_API_SECRET)) {
        console.warn('⚠️ UroPay API Secret appears to be a placeholder. Please update with your actual live API secret.');
        console.warn('⚠️ Current secret:', UROPAY_API_SECRET.substring(0, 20) + '...');
        console.warn('⚠️ Falling back to direct UPI payment (auto-verification will not work)');
      } else {
        try {
          console.log('🔄 Attempting to create UroPay payment link...');
          const paymentLinkResponse = await axios.post(
            `${UROPAY_API_URL}/api/v1/payment-links`,
            {
              amount: totalAmount,
              currency: 'INR',
              description: `Event Booking: ${event.title} - ${seats} seat(s)`,
              customer: {
                name: req.user.name,
                email: req.user.email,
                contact: req.user.phone || ''
              },
              notes: {
                eventId: eventId,
                eventTitle: event.title,
                seats: seats.toString(),
                userId: req.user._id.toString()
              },
              callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-callback`,
              return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`
            },
            {
              headers: {
                'Authorization': `Bearer ${UROPAY_API_KEY}`,
                'Content-Type': 'application/json',
                'X-API-Key': UROPAY_API_KEY,
                'X-API-Secret': UROPAY_API_SECRET
              },
              timeout: 10000
            }
          );
          
          const paymentLink = paymentLinkResponse.data;
          const linkId = paymentLink.id || paymentLink.payment_link_id || paymentLink.data?.id;
          
          console.log('✅ UroPay payment link created successfully:', linkId);
          
          return res.status(200).json({
            paymentLinkId: linkId,
            paymentUrl: paymentLink.short_url || paymentLink.url || paymentLink.data?.url,
            amount: totalAmount,
            currency: 'INR',
            bookingData: {
              userId: req.user._id.toString(),
              eventId: eventId,
              seats: seats,
              totalAmount: totalAmount,
              bookingId: pendingBooking._id.toString()
            },
            eventTitle: event.title,
            paymentReference: paymentReference,
            qrCode: paymentLink.qr_code || paymentLink.data?.qr_code || null
          });
        } catch (uropayError) {
          // Log detailed error for debugging
          console.error('❌ UroPay API error details:');
          console.error('Status:', uropayError.response?.status);
          console.error('Status Text:', uropayError.response?.statusText);
          console.error('Response Data:', JSON.stringify(uropayError.response?.data, null, 2));
          console.error('Error Message:', uropayError.message);
          console.error('API URL:', `${UROPAY_API_URL}/api/v1/payment-links`);
          console.error('API Key:', UROPAY_API_KEY ? `${UROPAY_API_KEY.substring(0, 10)}...` : 'NOT SET');
          console.error('API Secret:', UROPAY_API_SECRET ? 'SET (hidden)' : 'NOT SET');
          
          // Continue to fallback (direct UPI)
          console.warn('⚠️ Falling back to direct UPI payment (no gateway verification available)');
          console.warn('⚠️ User will need to manually confirm payment after completing transaction');
        }
      }
    } else {
      // UroPay API keys are missing or invalid
      if (!UROPAY_API_KEY || !UROPAY_API_SECRET) {
        console.warn('⚠️ UroPay API keys not configured. Using direct UPI payment.');
        console.warn('   - UROPAY_API_KEY:', UROPAY_API_KEY ? 'SET' : 'NOT SET');
        console.warn('   - UROPAY_API_SECRET:', UROPAY_API_SECRET ? 'SET (but may be placeholder)' : 'NOT SET');
        console.warn('   - To fix: Update UROPAY_API_SECRET in backend/.env with your actual live secret from UroPay dashboard');
      } else if (!isUroPaySecretValid(UROPAY_API_SECRET)) {
        console.warn('⚠️ UroPay API Secret is a placeholder. Using direct UPI payment.');
        console.warn('   - Current secret:', UROPAY_API_SECRET.substring(0, 30) + '...');
        console.warn('   - To fix: Replace with your actual live API secret from UroPay dashboard');
        console.warn('   - File: backend/.env');
      }
    }
    
    // Return payment details with pending booking ID
    res.status(200).json({
      paymentLinkId: null,
      paymentUrl: null,
      amount: totalAmount,
      currency: 'INR',
      bookingData: {
        userId: req.user._id.toString(),
        eventId: eventId,
        seats: seats,
        totalAmount: totalAmount,
        bookingId: pendingBooking._id.toString()
      },
      eventTitle: event.title,
      paymentReference: paymentReference
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ message: error.message || 'Failed to create payment' });
  }
};

// @desc    Verify payment and CREATE booking
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { paymentLinkId, transactionId, bookingData } = req.body;
    
    if (!bookingData || !bookingData.eventId || !bookingData.seats) {
      return res.status(400).json({ message: 'Booking data is required' });
    }
    
    const { eventId, seats, totalAmount, userId } = bookingData;
    
    // Verify user matches
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Check if booking already exists (prevent duplicates)
    const existingBooking = await Booking.findOne({
      user: req.user._id,
      event: eventId,
      status: 'Confirmed'
    });
    
    if (existingBooking) {
      // Booking already exists, return it
      const booking = await Booking.findById(existingBooking._id)
        .populate('user', 'name email')
        .populate('event', 'title date location venue category eventId');
      
      // Generate PDF
      let pdfBase64 = null;
      try {
        const pdfBuffer = await generateBookingPDF(booking, booking.event, booking.user);
        pdfBase64 = pdfBuffer.toString('base64');
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
      }
      
      return res.json({
        ...booking.toObject(),
        pdfConfirmation: pdfBase64,
        message: 'Booking already confirmed!'
      });
    }
    
    // Verify payment with UroPay API if payment link ID exists
    let paymentVerified = false;
    if (paymentLinkId && UROPAY_API_KEY) {
      try {
        const paymentStatusResponse = await axios.get(
          `${UROPAY_API_URL}/api/v1/payment-links/${paymentLinkId}`,
          {
            headers: {
              'Authorization': `Bearer ${UROPAY_API_KEY}`
            }
          }
        );
        
        const paymentData = paymentStatusResponse.data;
        if (paymentData.status === 'paid' || paymentData.status === 'success') {
          paymentVerified = true;
        }
      } catch (uropayError) {
        console.error('UroPay verification error:', uropayError.response?.data || uropayError.message);
      }
    }
    
    // If transaction ID is provided, consider payment verified
    // In production, you should verify this transaction ID with your bank/UPI provider
    if (transactionId && transactionId.trim()) {
      paymentVerified = true;
    }
    
    if (!paymentVerified) {
      return res.status(400).json({ message: 'Payment verification failed. Please provide transaction ID.' });
    }
    
    // Now create the booking (only after payment is verified)
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Double-check capacity
    const confirmedBookings = await Booking.countDocuments({
      event: eventId,
      status: 'Confirmed'
    });
    
    if (confirmedBookings + seats > event.capacity) {
      return res.status(400).json({ message: 'Not enough seats available. Event may be fully booked now.' });
    }
    
    // Create confirmed booking
    const booking = await Booking.create({
      user: req.user._id,
      event: eventId,
      seats,
      totalAmount: totalAmount || event.price * seats,
      status: 'Confirmed',
      paymentStatus: 'paid',
      paymentId: transactionId || paymentLinkId || null,
      paymentIntentId: paymentLinkId || null
    });
    
    // Update event booked seats
    event.bookedSeats += seats;
    await event.save();
    
    // Populate booking
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('event', 'title date location venue category eventId');
    
    // Send confirmation email
    sendBookingConfirmationEmail(populatedBooking, populatedBooking.event, populatedBooking.user)
      .catch(err => {
        console.error('Booking email error:', err);
      });
    
    // Send push notification
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
    
    // Generate PDF
    let pdfBase64 = null;
    try {
      const pdfBuffer = await generateBookingPDF(populatedBooking, populatedBooking.event, populatedBooking.user);
      pdfBase64 = pdfBuffer.toString('base64');
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
    }
    
    res.json({
      ...populatedBooking.toObject(),
      pdfConfirmation: pdfBase64,
      message: 'Payment verified and booking confirmed!'
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: error.message || 'Payment verification failed' });
  }
};

// @desc    Get payment status
// @route   GET /api/payments/status/:bookingId
// @access  Private
export const getPaymentStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('event', 'title date time location venue category eventId')
      .populate('user', 'name email');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user owns this booking
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Generate PDF if booking is confirmed
    let pdfBase64 = null;
    if (booking.status === 'Confirmed') {
      try {
        const pdfBuffer = await generateBookingPDF(booking, booking.event, booking.user);
        pdfBase64 = pdfBuffer.toString('base64');
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
      }
    }
    
    res.json({
      ...booking.toObject(),
      pdfConfirmation: pdfBase64
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Manually verify payment (for admin/owner after receiving UPI payment)
// @route   POST /api/payments/manual-verify
// @access  Private (Admin or Owner)
export const manualVerifyPayment = async (req, res) => {
  try {
    const { bookingId, transactionId, amount } = req.body;
    
    if (!bookingId || !transactionId) {
      return res.status(400).json({ message: 'Booking ID and Transaction ID are required' });
    }
    
    // Find pending booking
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email')
      .populate('event', 'title date location venue category eventId');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.status === 'Confirmed') {
      // Already confirmed, return it
      let pdfBase64 = null;
      try {
        const pdfBuffer = await generateBookingPDF(booking, booking.event, booking.user);
        pdfBase64 = pdfBuffer.toString('base64');
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
      }
      
      return res.json({
        ...booking.toObject(),
        pdfConfirmation: pdfBase64,
        message: 'Booking already confirmed!'
      });
    }
    
    // Verify amount matches
    if (amount && Math.abs(amount - booking.totalAmount) > 0.01) {
      return res.status(400).json({ message: 'Amount mismatch. Please verify the payment amount.' });
    }
    
    // Confirm the booking
    booking.status = 'Confirmed';
    booking.paymentStatus = 'paid';
    booking.paymentId = transactionId;
    await booking.save();
    
    // Update event booked seats
    const event = await Event.findById(booking.event._id);
    if (event) {
      event.bookedSeats += booking.seats;
      await event.save();
    }
    
    // Populate booking
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('event', 'title date location venue category eventId');
    
    // Send confirmation email
    sendBookingConfirmationEmail(populatedBooking, populatedBooking.event, populatedBooking.user)
      .catch(err => {
        console.error('Booking email error:', err);
      });
    
    // Send push notification
    const userWithSubscription = await User.findById(booking.user._id).select('pushSubscription');
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
    
    // Generate PDF
    let pdfBase64 = null;
    try {
      const pdfBuffer = await generateBookingPDF(populatedBooking, populatedBooking.event, populatedBooking.user);
      pdfBase64 = pdfBuffer.toString('base64');
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
    }
    
    res.json({
      ...populatedBooking.toObject(),
      pdfConfirmation: pdfBase64,
      message: 'Payment verified and booking confirmed!'
    });
  } catch (error) {
    console.error('Manual payment verification error:', error);
    res.status(500).json({ message: error.message || 'Payment verification failed' });
  }
};

// @desc    User confirms payment after completing UPI payment
// @route   POST /api/payments/confirm-payment
// @access  Private
export const confirmPayment = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }
    
    // Find pending booking
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email')
      .populate('event', 'title date location venue category eventId');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user owns this booking
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (booking.status === 'Confirmed') {
      // Already confirmed, return it
      let pdfBase64 = null;
      try {
        const pdfBuffer = await generateBookingPDF(booking, booking.event, booking.user);
        pdfBase64 = pdfBuffer.toString('base64');
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
      }
      
      return res.json({
        ...booking.toObject(),
        pdfConfirmation: pdfBase64,
        message: 'Booking already confirmed!'
      });
    }
    
    // Verify amount matches (optional check)
    if (amount && Math.abs(amount - booking.totalAmount) > 0.01) {
      return res.status(400).json({ message: 'Amount mismatch. Please verify the payment amount.' });
    }
    
    // Confirm the booking (trust-based - user confirms they paid)
    booking.status = 'Confirmed';
    booking.paymentStatus = 'paid';
    booking.paymentId = `UPI-${Date.now()}`; // Generate a payment ID
    await booking.save();
    
    // Update event booked seats
    const event = await Event.findById(booking.event._id);
    if (event) {
      event.bookedSeats += booking.seats;
      await event.save();
    }
    
    // Populate booking
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('event', 'title date location venue category eventId');
    
    // Send confirmation email
    sendBookingConfirmationEmail(populatedBooking, populatedBooking.event, populatedBooking.user)
      .catch(err => {
        console.error('Booking email error:', err);
      });
    
    // Send push notification
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
    
    // Generate PDF
    let pdfBase64 = null;
    try {
      const pdfBuffer = await generateBookingPDF(populatedBooking, populatedBooking.event, populatedBooking.user);
      pdfBase64 = pdfBuffer.toString('base64');
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
    }
    
    res.json({
      ...populatedBooking.toObject(),
      pdfConfirmation: pdfBase64,
      message: 'Payment confirmed and booking successful!'
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ message: error.message || 'Payment confirmation failed' });
  }
};

// @desc    Check payment status (for automatic polling - Traditional payment app logic)
// @route   POST /api/payments/check-payment
// @access  Private
export const checkPaymentStatus = async (req, res) => {
  try {
    const { bookingData, paymentReference, paymentLinkId, amount } = req.body;
    
    if (paymentReference) {
      console.log(`🔍 Checking payment status for reference: ${paymentReference}`);
    }
    
    if (!bookingData) {
      return res.json({ verified: false, message: 'Invalid booking data' });
    }
    
    // First, check with payment gateway if paymentLinkId exists (Traditional approach)
    if (paymentLinkId && UROPAY_API_KEY && UROPAY_API_SECRET) {
      try {
        // Verify payment status with UroPay API (like traditional payment apps)
        const paymentStatusResponse = await axios.get(
          `${UROPAY_API_URL}/api/v1/payment-links/${paymentLinkId}`,
          {
            headers: {
              'Authorization': `Bearer ${UROPAY_API_KEY}`,
              'X-API-Key': UROPAY_API_KEY,
              'X-API-Secret': UROPAY_API_SECRET
            },
            timeout: 5000
          }
        );
        
        const paymentData = paymentStatusResponse.data;
        
        // Log payment status for debugging
        console.log(`UroPay payment status check for link ${paymentLinkId}:`, {
          status: paymentData.status,
          payment_id: paymentData.payment_id || paymentData.id,
          amount: paymentData.amount
        });
        
        // Check if payment is successful according to gateway
        // UroPay might return different status values, check all possible success states
        const successStatuses = ['paid', 'success', 'captured', 'completed', 'succeeded'];
        const paymentStatus = paymentData.status?.toLowerCase() || '';
        
        if (successStatuses.includes(paymentStatus) || paymentData.paid === true) {
          // Payment verified by gateway - now confirm the booking
          let booking = null;
          
          if (bookingData.bookingId) {
            booking = await Booking.findById(bookingData.bookingId)
              .populate('user', 'name email')
              .populate('event', 'title date location venue category eventId');
          } else {
            // Find pending booking
            booking = await Booking.findOne({
              user: bookingData.userId,
              event: bookingData.eventId,
              status: 'Pending'
            })
            .populate('user', 'name email')
            .populate('event', 'title date location venue category eventId');
          }
          
          if (booking && booking.status === 'Pending') {
            // Confirm the booking
            booking.status = 'Confirmed';
            booking.paymentStatus = 'paid';
            booking.paymentId = paymentData.transaction_id || paymentData.payment_id || paymentLinkId;
            await booking.save();
            
            // Update event booked seats
            const event = await Event.findById(booking.event._id);
            if (event) {
              event.bookedSeats += booking.seats;
              await event.save();
            }
            
            // Populate booking
            const populatedBooking = await Booking.findById(booking._id)
              .populate('user', 'name email')
              .populate('event', 'title date location venue category eventId');
            
            // Send confirmation email
            sendBookingConfirmationEmail(populatedBooking, populatedBooking.event, populatedBooking.user)
              .catch(err => {
                console.error('Booking email error:', err);
              });
            
            // Send push notification
            const userWithSubscription = await User.findById(bookingData.userId).select('pushSubscription');
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
            
            // Generate PDF
            let pdfBase64 = null;
            try {
              const pdfBuffer = await generateBookingPDF(populatedBooking, populatedBooking.event, populatedBooking.user);
              pdfBase64 = pdfBuffer.toString('base64');
            } catch (pdfError) {
              console.error('PDF generation error:', pdfError);
            }
            
            return res.json({
              verified: true,
              booking: {
                ...populatedBooking.toObject(),
                pdfConfirmation: pdfBase64
              }
            });
          }
        }
      } catch (gatewayError) {
        console.error('Payment gateway check error:', gatewayError.response?.data || gatewayError.message);
        // Continue to check booking status as fallback
      }
    }
    
    // Fallback: Check if booking is already confirmed
    let booking = null;
    if (bookingData.bookingId) {
      booking = await Booking.findById(bookingData.bookingId)
        .populate('user', 'name email')
        .populate('event', 'title date location venue category eventId');
    } else {
      booking = await Booking.findOne({
        user: bookingData.userId,
        event: bookingData.eventId,
        status: 'Confirmed',
        totalAmount: amount
      })
      .populate('user', 'name email')
      .populate('event', 'title date location venue category eventId');
    }
    
    if (booking && booking.status === 'Confirmed') {
      // Generate PDF
      let pdfBase64 = null;
      try {
        const pdfBuffer = await generateBookingPDF(booking, booking.event, booking.user);
        pdfBase64 = pdfBuffer.toString('base64');
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
      }
      
      return res.json({
        verified: true,
        booking: {
          ...booking.toObject(),
          pdfConfirmation: pdfBase64
        }
      });
    }
    
    // Payment not verified yet
    return res.json({ verified: false });
  } catch (error) {
    console.error('Check payment status error:', error);
    return res.json({ verified: false, error: error.message });
  }
};

// @desc    UroPay webhook handler
// @route   POST /api/payments/webhook
// @access  Public (UroPay webhook)
export const handleUroPayWebhook = async (req, res) => {
  try {
    // UroPay sends webhook when payment is confirmed
    const { event, data } = req.body;
    
    // Handle payment success event
    if (event === 'payment.success' || event === 'payment.captured') {
      try {
        const paymentLinkId = data.payment_link_id || data.id;
        const transactionId = data.transaction_id || data.payment_id;
        const notes = data.notes || {};
        
        // Create booking from webhook data
        if (notes.eventId && notes.userId && notes.seats) {
          // Check if booking already exists
          const existingBooking = await Booking.findOne({
            user: notes.userId,
            event: notes.eventId,
            status: 'Confirmed'
          });
          
          if (!existingBooking) {
            const event = await Event.findById(notes.eventId);
            if (event) {
              // Check capacity
              const confirmedBookings = await Booking.countDocuments({
                event: notes.eventId,
                status: 'Confirmed'
              });
              
              if (confirmedBookings + parseInt(notes.seats) <= event.capacity) {
                const booking = await Booking.create({
                  user: notes.userId,
                  event: notes.eventId,
                  seats: parseInt(notes.seats),
                  totalAmount: data.amount ? data.amount / 100 : 0, // Convert from paise
                  status: 'Confirmed',
                  paymentStatus: 'paid',
                  paymentId: transactionId,
                  paymentIntentId: paymentLinkId
                });
                
                // Update event booked seats
                event.bookedSeats += parseInt(notes.seats);
                await event.save();
                
                console.log(`Booking ${booking._id} created via UroPay webhook`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error creating booking from webhook:', error);
      }
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ received: true }); // Always return 200 to acknowledge
  }
};
