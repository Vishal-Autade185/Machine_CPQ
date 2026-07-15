const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

// All quote endpoints require authentication
router.use(requireAuth);

// GET /api/quotes - History of all quotes (Admin only)
router.get('/', requireRole(['admin']), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM quotes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch quotes error:", err.message);
    res.status(500).json({ error: "Server error fetching quotes log." });
  }
});

// POST /api/quotes - Finalize & save a configured quote (Employees and Admins)
router.post('/', async (req, res) => {
  const { customerId, machineName, items, total } = req.body;

  if (!customerId || !machineName || !items || !Array.isArray(items) || total === undefined) {
    return res.status(400).json({ error: "Missing required fields: customerId, machineName, items, total." });
  }

  try {
    // 1. Fetch customer to snapshot contact details
    const custRes = await db.query('SELECT * FROM customers WHERE id = $1', [customerId]);
    if (custRes.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found." });
    }
    const customer = custRes.rows[0];
    const customerDetails = {
      companyName: customer.company_name,
      contactName: customer.contact_name,
      phone: customer.phone,
      email: customer.email
    };

    // 2. Generate a sequential Quote Number: QT-YYYY-XXXX (e.g. QT-2026-0001)
    const currentYear = new Date().getFullYear();
    const startOfYear = `${currentYear}-01-01T00:00:00.000Z`;
    
    const countRes = await db.query(
      'SELECT COUNT(*) FROM quotes WHERE created_at >= $1',
      [startOfYear]
    );
    const count = parseInt(countRes.rows[0].count, 10);
    const nextSeq = count + 1;
    const quoteNumber = `QT-${currentYear}-${String(nextSeq).padStart(4, '0')}`;

    // 3. Stringify JSONB structures for Postgres
    const customerDetailsJson = JSON.stringify(customerDetails);
    const itemsJson = JSON.stringify(items);

    // 4. Insert Quote
    const insertRes = await db.query(
      `INSERT INTO quotes (quote_number, customer_id, customer_details, machine_name, items, total)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [quoteNumber, customerId, customerDetailsJson, machineName, itemsJson, parseFloat(total)]
    );

    res.status(201).json(insertRes.rows[0]);

  } catch (err) {
    console.error("Create quote error:", err.message);
    res.status(500).json({ error: "Server error finalizing quote." });
  }
});

module.exports = router;
