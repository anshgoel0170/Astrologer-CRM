const mongoose = require('mongoose');

const AstrologerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: [String],
  experience: { type: Number, required: true },
  status: { type: String, enum: ['Available', 'Busy', 'Offline'], default: 'Available' },
  hourlyRate: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Astrologer', AstrologerSchema);