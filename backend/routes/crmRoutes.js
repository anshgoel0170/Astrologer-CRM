const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Astrologer = require('../models/Astrologer');
const Booking = require('../models/Booking');

// --- ADMIN AUTHENTICATION API ---
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'Chitkara2026') {
    return res.status(200).json({ success: true, token: 'secure-crm-admin-session-token' });
  } else {
    return res.status(401).json({ error: "Invalid administrative credentials. Access denied." });
  }
});

// --- LEADS API ENDPOINTS ---
router.post('/leads', async (req, res) => {
  try {
    const newLead = new Lead(req.body);
    await newLead.save();
    res.status(201).json(newLead);
  } catch (err) {
    res.status(400).json({ error: "Failed to write lead to cloud database." });
  }
});

router.get('/leads', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ASTROLOGERS API ENDPOINTS ---
router.get('/astrologers', async (req, res) => {
  try {
    let astrologers = await Astrologer.find();
    if (astrologers.length === 0) {
      astrologers = await Astrologer.insertMany([
        { name: 'Pandit Ramesh Shastri', specialty: ['Vedic Astrology', 'Kundli Dosha'], experience: 15, status: 'Available', hourlyRate: 500 },
        { name: 'Acharya Ananya', specialty: ['Tarot Card Reading', 'Numerology'], experience: 8, status: 'Busy', hourlyRate: 400 },
        { name: 'Dr. Sunita Sharma', specialty: ['Vastu Shastra', 'Palmistry'], experience: 20, status: 'Available', hourlyRate: 800 },
        { name: 'Yogi Anand Dewangan', specialty: ['Gemstone Recommendation', 'KP System'], experience: 12, status: 'Available', hourlyRate: 600 },
        { name: 'Maulana Kabir Khan', specialty: ['Lal Kitab Specialist', 'Astrological Remedology'], experience: 18, status: 'Busy', hourlyRate: 750 },
        { name: 'Srimati Rajlaxmi Iyer', specialty: ['Nadi Astrology', 'Prashna Kundli'], experience: 22, status: 'Available', hourlyRate: 900 }
      ]);
    }
    res.status(200).json(astrologers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- LIVE APPOINTMENT HANDLERS ---
router.post('/bookings', async (req, res) => {
  try {
    const { leadId, astrologerId, scheduledTime } = req.body;
    
    if (!leadId || !astrologerId || !scheduledTime) {
      return res.status(400).json({ error: "Validation Failed: Please select a valid Lead, Astrologer, and Date/Time." });
    }

    const bookingDate = new Date(scheduledTime);
    const currentDate = new Date();

    if (bookingDate < currentDate) {
      return res.status(400).json({ error: "Validation Rejected: Appointment slots cannot be booked for past dates." });
    }
    
    const newBooking = new Booking({
      leadId,
      astrologerId,
      scheduledTime,
      status: 'Scheduled'
    });
    await newBooking.save();

    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('leadId')
      .populate('astrologerId');

    res.status(201).json(populatedBooking);
  } catch (err) {
    console.error("Database Booking Error:", err);
    res.status(400).json({ error: `Database Write Failed: ${err.message}. Please verify references.` });
  }
});

router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('leadId')
      .populate('astrologerId')
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMINISTRATIVE BOOKING CONTROL ---
router.put('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledTime, status } = req.body;

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { scheduledTime, status },
      { new: true }
    ).populate('leadId').populate('astrologerId');

    if (!updatedBooking) {
      return res.status(404).json({ error: "Target booking node not found inside cluster." });
    }

    res.status(200).json(updatedBooking);
  } catch (err) {
    res.status(400).json({ error: "Administrative database write execution failed." });
  }
});

module.exports = router;