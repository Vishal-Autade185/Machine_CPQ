const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// Protect all customer endpoints
router.use(requireAuth);

// GET /api/customers - List all customers/leads
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM customers ORDER BY company_name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch customers error:", err.message);
    res.status(500).json({ error: "Server error fetching customer directory." });
  }
});

// POST /api/customers - Add a new customer/lead
router.post('/', async (req, res) => {
  const { companyName, contactName, phone, email } = req.body;

  if (!companyName || !contactName) {
    return res.status(400).json({ error: "Missing required fields: companyName, contactName." });
  }

  try {
    const result = await db.query(
      'INSERT INTO customers (company_name, contact_name, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [companyName, contactName, phone || null, email || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create customer error:", err.message);
    res.status(500).json({ error: "Server error registering new customer." });
  }
});

module.exports = router;
