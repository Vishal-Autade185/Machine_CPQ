const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

// POST /api/auth/register - Register a new user
// If there are zero users in the database, public registration is permitted to set up the initial Admin.
// Subsequent registrations require a logged-in admin.
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields: email, password, role." });
  }

  if (role !== 'admin' && role !== 'employee') {
    return res.status(400).json({ error: "Invalid role. Role must be 'admin' or 'employee'." });
  }

  try {
    // 1. Check if any users exist in the system (Bootstrap check)
    const countRes = await db.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(countRes.rows[0].count, 10);

    if (userCount > 0) {
      // Access control: Subsequent registrations require a logged-in Admin
      const authHeader = req.headers['authorization'];
      if (!authHeader) {
        return res.status(401).json({ error: "Authentication required to register additional users." });
      }

      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.role !== 'admin') {
          return res.status(403).json({ error: "Only admins can register new users." });
        }
      } catch (err) {
        return res.status(401).json({ error: "Invalid token. Only admins can register new users." });
      }
    }

    // 2. Check if email already exists
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "User with this email already exists." });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Insert user
    const insertRes = await db.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
      [email.toLowerCase(), passwordHash, role]
    );

    res.status(201).json({
      message: `User ${email} registered successfully as ${role}.`,
      user: insertRes.rows[0]
    });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error during registration." });
  }
});

// POST /api/auth/login - Authenticate user & return JWT
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Please enter email and password." });
  }

  try {
    // 1. Check if user exists
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    const user = userRes.rows[0];

    // 2. Check password matches
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    // 3. Sign JWT
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '8h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role
          }
        });
      }
    );

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login." });
  }
});

// GET /api/auth/me - Verify active token
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
