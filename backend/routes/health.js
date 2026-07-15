const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/health - Public health check & keep-alive DB query
router.get('/', async (req, res) => {
  try {
    // Run simple query to check database connectivity
    const dbCheck = await db.query('SELECT 1');
    
    res.status(200).json({
      status: "healthy",
      timestamp: new Date(),
      database: "connected",
      uptime: process.uptime()
    });
  } catch (err) {
    console.error("Health check error:", err.message);
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date(),
      database: "disconnected",
      error: err.message
    });
  }
});

module.exports = router;
