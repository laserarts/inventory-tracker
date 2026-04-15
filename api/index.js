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
  `);
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
  res.json({ status: 'ok', message: 'Inventory Tracker API' });
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

export default app;

