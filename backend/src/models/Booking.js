import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  seats: {
    type: Number,
    required: true,
    min: 1,
    max: 2
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Cancelled'],
    default: 'Confirmed'
  },
  totalAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
bookingSchema.index({ user: 1, event: 1 });
// Note: Duplicate booking prevention is handled in the controller

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;

