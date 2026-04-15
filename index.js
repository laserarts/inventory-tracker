import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Initialize database - use /tmp for Vercel (serverless)
const dbPath = process.env.DB_PATH || path.join(tmpdir(), 'inventory.db');
const db = new sqlite3.Database(dbPath);

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      quantity INTEGER,
      reorder_level INTEGER,
      price REAL,
      supplier TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, async (err) => {
    if (!err) {
      // Add dummy data if table is empty
      const count = await dbGet('SELECT COUNT(*) as count FROM products');
      if (count.count === 0) {
        const dummyData = [
          { name: 'Laptop', description: 'High-performance laptop', category: 'Electronics', quantity: 15, reorder_level: 5, price: 999.99, supplier: 'Tech Corp' },
          { name: 'Wireless Mouse', description: 'Ergonomic wireless mouse', category: 'Electronics', quantity: 42, reorder_level: 20, price: 29.99, supplier: 'Tech Corp' },
          { name: 'USB-C Cable', description: '2m USB-C charging cable', category: 'Electronics', quantity: 8, reorder_level: 15, price: 12.99, supplier: 'Cable World' },
          { name: 'Office Chair', description: 'Comfortable ergonomic chair', category: 'Home & Garden', quantity: 5, reorder_level: 3, price: 249.99, supplier: 'Furniture Co' },
          { name: 'Desk Lamp', description: 'LED desk lamp with USB charging', category: 'Electronics', quantity: 22, reorder_level: 10, price: 39.99, supplier: 'Lighting Plus' },
          { name: 'Notebook A4', description: 'Lined notebook 100 pages', category: 'Books', quantity: 60, reorder_level: 30, price: 4.99, supplier: 'Paper Supply' },
          { name: 'Coffee Maker', description: 'Automatic coffee maker', category: 'Home & Garden', quantity: 3, reorder_level: 5, price: 89.99, supplier: 'Appliances Inc' },
          { name: 'T-Shirt', description: 'Cotton t-shirt, assorted sizes', category: 'Clothing', quantity: 45, reorder_level: 20, price: 14.99, supplier: 'Fashion Co' },
          { name: 'Jeans', description: 'Blue denim jeans', category: 'Clothing', quantity: 28, reorder_level: 15, price: 49.99, supplier: 'Fashion Co' },
          { name: 'Apple', description: 'Fresh red apples', category: 'Food', quantity: 120, reorder_level: 50, price: 1.99, supplier: 'Fresh Farms' },
          { name: 'Organic Coffee Beans', description: 'Premium organic coffee beans 1kg', category: 'Food', quantity: 18, reorder_level: 10, price: 19.99, supplier: 'Coffee Roasters' },
          { name: 'Desk Organizer', description: 'Multi-compartment desk organizer', category: 'Home & Garden', quantity: 12, reorder_level: 8, price: 24.99, supplier: 'Office Supplies' }
        ];
        
        dummyData.forEach(async (product) => {
          await dbRun(
            'INSERT INTO products (name, description, category, quantity, reorder_level, price, supplier) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [product.name, product.description, product.category, product.quantity, product.reorder_level, product.price, product.supplier]
          );
        });
      }
    }
  });
});

// Helper function to promisify database calls
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// API Routes

// Health check
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// GET all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await dbAll('SELECT * FROM products ORDER BY id DESC');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await dbGet('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE product
app.post('/api/products', async (req, res) => {
  try {
    const { name, description, category, quantity, reorder_level, price, supplier } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const result = await dbRun(
      'INSERT INTO products (name, description, category, quantity, reorder_level, price, supplier) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description || '', category || '', quantity || 0, reorder_level || 0, price || 0, supplier || '']
    );
    
    res.status(201).json({ id: result.lastInsertRowid, message: 'Product created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, description, category, quantity, reorder_level, price, supplier } = req.body;
    
    const result = await dbRun(
      'UPDATE products SET name = ?, description = ?, category = ?, quantity = ?, reorder_level = ?, price = ?, supplier = ? WHERE id = ?',
      [name, description || '', category || '', quantity || 0, reorder_level || 0, price || 0, supplier || '', req.params.id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM products WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback - serve index.html for all unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
