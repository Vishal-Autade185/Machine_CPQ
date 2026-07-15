const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize express app
const app = express();

// Set up CORS configurations
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Body-parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import database to trigger pool loading check
require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');
const customerRoutes = require('./routes/customers');
const inventoryRoutes = require('./routes/inventory');
const machineRoutes = require('./routes/machines');
const quoteRoutes = require('./routes/quotes');
const uploadRoutes = require('./routes/upload');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/upload', uploadRoutes);

// Root path fallback
app.get('/', (req, res) => {
  res.json({
    message: "Welcome to the Machine CPQ API",
    documentation: "Endpoints are protected. Use /api/health for database status check."
  });
});

// Centralized error handler middleware
app.use((err, req, res, next) => {
  console.error("Unhandle server error:", err.stack);
  res.status(err.status || 500).json({
    error: err.message || "An internal server error occurred."
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in production mode on port ${PORT}`);
});

module.exports = app; // Export for serverless Vercel testing
