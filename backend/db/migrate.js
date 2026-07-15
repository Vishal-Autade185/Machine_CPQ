const db = require('./index');

const migrate = async () => {
  console.log("Starting database migrations on Supabase...");
  try {
    // 1. Create Users Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    console.log("✓ 'users' table initialized.");

    // 2. Create Customers Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name TEXT NOT NULL,
        contact_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    console.log("✓ 'customers' table initialized.");

    // 3. Create Inventory Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sku TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        rate NUMERIC(10, 2) NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    console.log("✓ 'inventory' table initialized.");

    // 4. Create Machines Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS machines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        image_url TEXT,
        hotspots JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    console.log("✓ 'machines' table initialized.");

    // 5. Create Quotes Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quote_number TEXT UNIQUE NOT NULL,
        customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
        customer_details JSONB NOT NULL,
        machine_name TEXT NOT NULL,
        items JSONB NOT NULL,
        total NUMERIC(10, 2) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    console.log("✓ 'quotes' table initialized.");

    console.log("Database migrations completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
};

migrate();
