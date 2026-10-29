import pool from './db';
import bcrypt from 'bcryptjs';
import {
  seedCustomers,
  seedProducts,
  seedOrders,
  seedOrderItems,
  seedStockMovements,
} from './seedData';

export const initSQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Sales', 'Warehouse', 'Accounts')),
  mobile VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20),
  email VARCHAR(255),
  business_name VARCHAR(200),
  gst_no VARCHAR(20),
  type VARCHAR(20) NOT NULL CHECK (type IN ('Retail', 'Wholesale', 'Distributor')),
  address TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Lead' CHECK (status IN ('Lead', 'Active', 'Inactive')),
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(100),
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock_alert INTEGER NOT NULL DEFAULT 0,
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_changed INTEGER NOT NULL,
  movement_type VARCHAR(5) NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
  reason TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Confirmed', 'Cancelled')),
  total_quantity INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name_snapshot VARCHAR(200) NOT NULL,
  product_price_snapshot NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL
);
`;

export const seedUsers = [
  { name: 'Admin User', email: 'admin@erp.com', password: 'Admin@123', role: 'Admin' },
  { name: 'Sales Representative', email: 'sales@erp.com', password: 'Sales@123', role: 'Sales' },
  { name: 'Warehouse Officer', email: 'warehouse@erp.com', password: 'Warehouse@123', role: 'Warehouse' },
  { name: 'Accounts Manager', email: 'accounts@erp.com', password: 'Accounts@123', role: 'Accounts' },
];

let isSeeding = false;

export async function seed(targetPool: any = pool) {
  if (isSeeding) return;
  isSeeding = true;
  try {
    console.log('🔧 Initializing database tables...');
    await targetPool.query(initSQL);
    console.log('✅ Tables created successfully');

    console.log('🌱 Seeding users...');
    for (const user of seedUsers) {
      const existing = await targetPool.query('SELECT id FROM users WHERE email = $1', [user.email]);
      if (existing.rows.length === 0) {
        const hash = await bcrypt.hash(user.password, 10);
        await targetPool.query(
          'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
          [user.name, user.email, hash, user.role]
        );
        console.log(`  ✅ Created user: ${user.email} (${user.role})`);
      } else {
        console.log(`  ⏭️  User already exists: ${user.email}`);
      }
    }

    // Check if enterprise dataset is already seeded
    const countCheck = await targetPool.query('SELECT COUNT(*) as count FROM products');
    const existingCount = parseInt(countCheck.rows[0]?.count || '0', 10);

    if (existingCount >= 60) {
      console.log(`⏭️  Enterprise dataset already seeded (${existingCount} products present).`);
      return;
    }

    console.log('🧹 Purging outdated sample data...');
    await targetPool.query('DELETE FROM order_items');
    await targetPool.query('DELETE FROM stock_movements');
    await targetPool.query('DELETE FROM orders');
    await targetPool.query('DELETE FROM products');
    await targetPool.query('DELETE FROM customers');

    // 1. Seed Products (80)
    console.log(`📦 Seeding ${seedProducts.length} industrial products...`);
    for (const p of seedProducts) {
      await targetPool.query(
        'INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [p.name, p.sku, p.category, p.unit_price, p.current_stock, p.min_stock_alert, p.location, p.created_at]
      );
    }
    console.log(`  ✅ Inserted ${seedProducts.length} products`);

    // 2. Seed Customers (65)
    console.log(`👥 Seeding ${seedCustomers.length} B2B customers...`);
    for (const c of seedCustomers) {
      await targetPool.query(
        'INSERT INTO customers (name, mobile, email, business_name, gst_no, type, address, status, follow_up_date, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [c.name, c.mobile, c.email, c.business_name, c.gst_no, c.type, c.address, c.status, c.follow_up_date, c.notes, c.created_at]
      );
    }
    console.log(`  ✅ Inserted ${seedCustomers.length} customers`);

    // 3. Seed Orders (150)
    console.log(`📋 Seeding ${seedOrders.length} sales orders...`);
    for (const o of seedOrders) {
      await targetPool.query(
        'INSERT INTO orders (order_number, customer_id, status, total_quantity, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [o.order_number, o.customer_id, o.status, o.total_quantity, o.created_by, o.created_at]
      );
    }
    console.log(`  ✅ Inserted ${seedOrders.length} orders`);

    // 4. Seed Order Items (314)
    console.log(`📑 Seeding ${seedOrderItems.length} order line items...`);
    for (const item of seedOrderItems) {
      await targetPool.query(
        'INSERT INTO order_items (order_id, product_id, product_name_snapshot, product_price_snapshot, quantity) VALUES ($1, $2, $3, $4, $5)',
        [item.order_id, item.product_id, item.product_name_snapshot, item.product_price_snapshot, item.quantity]
      );
    }
    console.log(`  ✅ Inserted ${seedOrderItems.length} order items`);

    // 5. Seed Stock Movements (440)
    console.log(`🔄 Seeding ${seedStockMovements.length} reconciled stock movements...`);
    for (const m of seedStockMovements) {
      await targetPool.query(
        'INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [m.product_id, m.quantity_changed, m.movement_type, m.reason, m.created_by, m.created_at]
      );
    }
    console.log(`  ✅ Inserted ${seedStockMovements.length} stock movements`);

    console.log('\n🎉 Enterprise database seed complete!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    isSeeding = false;
  }
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(() => process.exit(1));
}
