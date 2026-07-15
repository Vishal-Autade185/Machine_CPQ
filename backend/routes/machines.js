const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

// All machine endpoints require authentication
router.use(requireAuth);

// GET /api/machines - List all machines
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM machines ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch machines error:", err.message);
    res.status(500).json({ error: "Server error fetching machine configurations." });
  }
});

// POST /api/machines - Create a new machine configuration (Admin only)
router.post('/', requireRole(['admin']), async (req, res) => {
  const { name, imageUrl, hotspots } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Machine name is required." });
  }

  try {
    const hotspotsJson = hotspots ? JSON.stringify(hotspots) : '[]';
    const result = await db.query(
      'INSERT INTO machines (name, image_url, hotspots) VALUES ($1, $2, $3) RETURNING *',
      [name, imageUrl || null, hotspotsJson]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create machine error:", err.message);
    res.status(500).json({ error: "Server error creating machine configuration." });
  }
});

// PUT /api/machines/:id - Save hotspot coordinates and dropdown details (Admin only)
router.put('/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { name, imageUrl, hotspots } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Machine name is required." });
  }

  try {
    const hotspotsJson = hotspots ? JSON.stringify(hotspots) : '[]';
    const result = await db.query(
      'UPDATE machines SET name = $1, image_url = $2, hotspots = $3 WHERE id = $4 RETURNING *',
      [name, imageUrl || null, hotspotsJson, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Machine configuration not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update machine error:", err.message);
    res.status(500).json({ error: "Server error saving machine configuration." });
  }
});

// DELETE /api/machines/:id - Delete a machine (Admin only)
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM machines WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Machine configuration not found." });
    }

    res.json({ message: `Machine ${result.rows[0].name} deleted successfully.` });
  } catch (err) {
    console.error("Delete machine error:", err.message);
    res.status(500).json({ error: "Server error deleting machine configuration." });
  }
});

module.exports = router;
