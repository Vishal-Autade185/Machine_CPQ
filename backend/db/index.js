const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.warn("WARNING: SUPABASE_DB_URL is not set in environment variables. Database operations will fail.");
}

const pool = new Pool({
  connectionString,
  ssl: connectionString && (connectionString.includes('localhost') || connectionString.includes('127.0.0.1'))
    ? false
    : { rejectUnauthorized: false }
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error("ERROR: Failed to connect to PostgreSQL on Supabase:", err.message);
  } else {
    console.log("SUCCESS: Connected to Supabase PostgreSQL database pool.");
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
