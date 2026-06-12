const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const crmRoutes = require('./routes/crmRoutes');
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to Local MongoDB Database Instance'))
  .catch(err => console.error('❌ Database connectivity error:', err));

app.use('/api', crmRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 CRM Backend operational on port ${PORT}`));