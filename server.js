// server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// PostgreSQL connection - UPDATE YOUR PASSWORD HE
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'cafe_management',
    password: 'XXXXXXX', 
    port: 5432,
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Test database connection
pool.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to PostgreSQL');
    }
});

// Get all menu items
app.get('/api/menu', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, c.category_name 
            FROM menu_items m 
            JOIN categories c ON m.category_id = c.category_id
            WHERE m.availability = true
            ORDER BY c.category_id, m.item_name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get all tables
app.get('/api/tables', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cafe_tables ORDER BY table_number');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new order
app.post('/api/orders', async (req, res) => {
    const { table_id, items } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        let total = 0;
        for (let item of items) {
            total += item.price * item.quantity;
        }
        
        const orderResult = await client.query(
            'INSERT INTO orders (table_id, total_amount, status) VALUES ($1, $2, $3) RETURNING order_id',
            [table_id, total, 'pending']
        );
        
        const orderId = orderResult.rows[0].order_id;
        
        for (let item of items) {
            await client.query(
                'INSERT INTO order_items (order_id, item_id, quantity, item_price) VALUES ($1, $2, $3, $4)',
                [orderId, item.item_id, item.quantity, item.price]
            );
        }
        
        await client.query(
            'UPDATE cafe_tables SET status = $1 WHERE table_id = $2',
            ['occupied', table_id]
        );
        
        await client.query('COMMIT');
        res.json({ success: true, order_id: orderId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Get active orders
app.get('/api/active-orders', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                o.order_id,
                o.table_id,
                o.total_amount,
                o.status,
                o.order_date,
                t.table_number,
                json_agg(json_build_object(
                    'item_name', mi.item_name, 
                    'quantity', oi.quantity, 
                    'price', oi.item_price
                )) as items
            FROM orders o
            JOIN cafe_tables t ON o.table_id = t.table_id
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN menu_items mi ON oi.item_id = mi.item_id
            WHERE o.status = 'pending'
            GROUP BY o.order_id, t.table_number
            ORDER BY o.order_date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Complete order
app.put('/api/orders/:id/complete', async (req, res) => {
    const { id } = req.params;
    
    try {
        const orderResult = await pool.query(
            'SELECT table_id FROM orders WHERE order_id = $1',
            [id]
        );
        
        if (orderResult.rows.length > 0) {
            await pool.query(
                'UPDATE cafe_tables SET status = $1 WHERE table_id = $2',
                ['available', orderResult.rows[0].table_id]
            );
        }
        
        await pool.query(
            'UPDATE orders SET status = $1 WHERE order_id = $2',
            ['completed', id]
        );
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get sales report
app.get('/api/report', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                DATE(order_date) as date,
                COUNT(*) as total_orders,
                SUM(total_amount) as total_sales
            FROM orders
            WHERE status = 'completed'
            GROUP BY DATE(order_date)
            ORDER BY date DESC
            LIMIT 7
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`
    ╔══════════════════════════════════════════╗
    ║   🏪 CAFE MANAGEMENT SYSTEM READY 🏪     ║
    ╠══════════════════════════════════════════╣
    ║   Open: http://localhost:${port}          ║
    ║                                          ║
    ║   No login required - Start using now!   ║
    ╚══════════════════════════════════════════╝
    `);
});
