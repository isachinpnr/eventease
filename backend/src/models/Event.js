import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide event title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide event description'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please provide event category'],
    enum: ['Music', 'Tech', 'Business', 'Sports', 'Education', 'Other'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Please provide event location'],
    enum: ['Online', 'In-Person'],
    trim: true
  },
  venue: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Please provide event date']
  },
  time: {
    type: String,
    required: [true, 'Please provide event time']
  },
  capacity: {
    type: Number,
    required: [true, 'Please provide event capacity'],
    min: 1
  },
  bookedSeats: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed'],
    default: 'Upcoming'
  }
}, {
  timestamps: true
});

// Index for efficient queries
eventSchema.index({ date: 1, category: 1, location: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;

