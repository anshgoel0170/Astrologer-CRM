const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead', // This must match your Lead model name EXACTLY
    required: true
  },
  astrologerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Astrologer', // This must match your Astrologer model name EXACTLY
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);