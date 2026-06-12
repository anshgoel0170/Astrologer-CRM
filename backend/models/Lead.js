const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ['New', 'Contacted', 'Converted', 'Lost'], default: 'New' }
}, { timestamps: true });

module.exports = mongoose.model('Lead', LeadSchema);