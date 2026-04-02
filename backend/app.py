from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)

# Initialize database
def init_db():
    conn = sqlite3.connect('inventory.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT,
            quantity INTEGER,
            reorder_level INTEGER,
            price REAL,
            supplier TEXT
        )
    ''')
    conn.commit()
    conn.close()

# Example endpoint
@app.route('/api/products', methods=['GET'])
def get_products():
    conn = sqlite3.connect('inventory.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM products')
    products = cursor.fetchall()
    conn.close()
    return jsonify(products)

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
