const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

// All inventory endpoints require authentication
router.use(requireAuth);

// GET /api/inventory - Get active inventory items (for Sales portal dropdowns)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM inventory WHERE is_active = true ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch inventory error:", err.message);
    res.status(500).json({ error: "Server error fetching inventory." });
  }
});

// GET /api/inventory/all - Get all inventory items (active + soft-deleted, Admin Master list)
router.get('/all', requireRole(['admin']), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM inventory ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch all inventory error:", err.message);
    res.status(500).json({ error: "Server error fetching master inventory list." });
  }
});

// POST /api/inventory - Create a new part (Admin only)
router.post('/', requireRole(['admin']), async (req, res) => {
  const { sku, name, category, rate } = req.body;

  if (!sku || !name || rate === undefined) {
    return res.status(400).json({ error: "Missing required fields: sku, name, rate." });
  }

  try {
    // Check if SKU already exists
    const skuCheck = await db.query('SELECT * FROM inventory WHERE sku = $1', [sku.toUpperCase()]);
    if (skuCheck.rows.length > 0) {
      return res.status(400).json({ error: `Part with SKU ${sku.toUpperCase()} already exists.` });
    }

    const result = await db.query(
      'INSERT INTO inventory (sku, name, category, rate) VALUES ($1, $2, $3, $4) RETURNING *',
      [sku.toUpperCase(), name, category || null, parseFloat(rate)]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create inventory item error:", err.message);
    res.status(500).json({ error: "Server error adding inventory item." });
  }
});

// PUT /api/inventory/:id - Update an inventory item (Admin only)
router.put('/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { sku, name, category, rate, is_active } = req.body;

  if (!sku || !name || rate === undefined) {
    return res.status(400).json({ error: "Missing required fields: sku, name, rate." });
  }

  try {
    // Check if SKU exists on another item
    const skuCheck = await db.query('SELECT * FROM inventory WHERE sku = $1 AND id != $2', [sku.toUpperCase(), id]);
    if (skuCheck.rows.length > 0) {
      return res.status(400).json({ error: `Another part with SKU ${sku.toUpperCase()} already exists.` });
    }

    const result = await db.query(
      'UPDATE inventory SET sku = $1, name = $2, category = $3, rate = $4, is_active = $5 WHERE id = $6 RETURNING *',
      [sku.toUpperCase(), name, category || null, parseFloat(rate), is_active !== undefined ? is_active : true, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Inventory item not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update inventory error:", err.message);
    res.status(500).json({ error: "Server error updating inventory item." });
  }
});

// DELETE /api/inventory/:id - SOFT DELETE an inventory item (Admin only)
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    // Soft delete: sets is_active = false
    const result = await db.query(
      'UPDATE inventory SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Inventory item not found." });
    }

    res.json({ message: `Part ${result.rows[0].name} (SKU: ${result.rows[0].sku}) soft-deleted successfully.`, item: result.rows[0] });
  } catch (err) {
    console.error("Delete inventory error:", err.message);
    res.status(500).json({ error: "Server error performing soft delete." });
  }
});

module.exports = router;
