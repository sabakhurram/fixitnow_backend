const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Trigger config validation and initialization on boot
require('./src/config/firebase');
require('./src/config/supabase');

const userRoutes = require('./src/routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Security & Logging Middleware
app.use(helmet());
app.use(cors({
  origin: '*', // In production, replace with frontend origin URL
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// Bind modular routes
app.use('/api/users', userRoutes);
const inspectionRoutes = require('./src/routes/inspectionRoutes');
app.use('/api/inspections', inspectionRoutes);
const repairRoutes = require('./src/routes/repairRoutes');
app.use('/api/repairs', repairRoutes);
const amcRoutes = require('./src/routes/amcRoutes');
app.use('/api/amc', amcRoutes);
const productRoutes = require('./src/routes/productRoutes');
app.use('/api/products', productRoutes);
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Express Global Error Handler:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Listening
app.listen(PORT, () => {
  console.log(`Server successfully active on port ${PORT}`);
});
