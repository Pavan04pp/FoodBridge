const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname)); // Serve static files like index.html and images

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_foodbridge_key_2026';

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'foodbridge',
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_HOST ? { rejectUnauthorized: true } : false,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access Denied. Login required.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

/* ====================================
   AUTHENTICATION ROUTES
==================================== */

// REGISTRATION
app.post('/api/auth/register', async (req, res) => {
    const { role, name, location, contact, email, password, extraInfo } = req.body;

    try {
        if (!['restaurant', 'ngo'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role selected.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const table = role === 'restaurant' ? 'Restaurant' : 'NGO';

        // Check if email exists
        const [existing] = await pool.query(`SELECT email FROM ${table} WHERE email = ?`, [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered.' });
        }

        const query = `INSERT INTO ${table} (name, location, contact, email, password) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await pool.query(query, [name, location, contact, email, hashedPassword]);

        res.status(201).json({ message: 'Registration successful!', id: result.insertId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error during registration.' });
    }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    const { role, email, password } = req.body;

    try {
        if (!['restaurant', 'ngo'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role selected.' });
        }

        const table = role === 'restaurant' ? 'Restaurant' : 'NGO';
        const [rows] = await pool.query(`SELECT * FROM ${table} WHERE email = ?`, [email]);

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: role === 'restaurant' ? user.restaurant_id : user.ngo_id, role, name: user.name },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ message: 'Login successful', token, user: { name: user.name, role } });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error during login.' });
    }
});

/* ====================================
   DASHBOARD ROUTES 
==================================== */

// PROFILE & HISTORY ROUTE
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const { id, role } = req.user;
        let profileDetails, history;

        if (role === 'restaurant') {
            // Get Restaurant Profile
            const [users] = await pool.query('SELECT name, email, location, contact FROM Restaurant WHERE restaurant_id = ?', [id]);
            profileDetails = users[0];

            // Get Listing History
            const [listings] = await pool.query('SELECT food_name, quantity, status, created_at FROM Food_Listing WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 10', [id]);
            history = listings.map(l => ({
                action: `Listed ${l.food_name} (${l.quantity})`,
                status: l.status,
                time: l.created_at
            }));

        } else {
            // Get NGO Profile
            const [users] = await pool.query('SELECT name, email, location, contact FROM NGO WHERE ngo_id = ?', [id]);
            profileDetails = users[0];

            // Get Request History
            const [requests] = await pool.query(`
                SELECT r.status, r.request_time, f.food_name 
                FROM Request r 
                JOIN Food_Listing f ON r.food_id = f.food_id 
                WHERE r.ngo_id = ? ORDER BY r.request_time DESC LIMIT 10
            `, [id]);
            history = requests.map(r => ({
                action: `Requested ${r.food_name}`,
                status: r.status,
                time: r.request_time
            }));
        }

        res.json({
            profile: profileDetails,
            history: history
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error fetching profile.' });
    }
});

// RESTAURANT STATS
app.get('/api/dashboard/stats/restaurant', authenticateToken, async (req, res) => {
    if (req.user.role !== 'restaurant') return res.status(403).json({ error: 'Unauthorized' });
    try {
        const restId = req.user.id;

        const [[{ active_count }]] = await pool.query(`SELECT COUNT(*) as active_count FROM Food_Listing WHERE restaurant_id = ? AND status = 'available'`, [restId]);
        const [[{ deliveries_today }]] = await pool.query(`SELECT COUNT(*) as deliveries_today FROM Delivery d JOIN Request r ON d.request_id = r.request_id JOIN Food_Listing f ON r.food_id = f.food_id WHERE f.restaurant_id = ? AND DATE(d.pickup_time) = CURDATE()`, [restId]);
        const [[{ meals_saved }]] = await pool.query(`SELECT COALESCE(SUM(f.quantity), 0) as meals_saved FROM Food_Listing f JOIN Request r ON f.food_id = r.food_id WHERE f.restaurant_id = ? AND r.status = 'delivered'`, [restId]);
        const [[{ expiring_soon }]] = await pool.query(`SELECT COUNT(*) as expiring_soon FROM Food_Listing WHERE restaurant_id = ? AND status = 'available' AND expiry_time <= DATE_ADD(NOW(), INTERVAL 2 HOUR)`, [restId]);

        res.json({
            active_listings: active_count,
            deliveries_today: deliveries_today,
            meals_saved: meals_saved,
            expiring_soon: expiring_soon
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error fetching stats.' });
    }
});

// NGO STATS
app.get('/api/dashboard/stats/ngo', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ngo') return res.status(403).json({ error: 'Unauthorized' });
    try {
        const ngoId = req.user.id;

        const [[{ pending_count }]] = await pool.query(`SELECT COUNT(*) as pending_count FROM Request WHERE ngo_id = ? AND status = 'pending'`, [ngoId]);
        const [[{ in_transit }]] = await pool.query(`SELECT COUNT(*) as in_transit FROM Request r JOIN Delivery d ON r.request_id = d.request_id WHERE r.ngo_id = ? AND d.delivery_status = 'in_transit'`, [ngoId]);
        const [[{ meals_received }]] = await pool.query(`SELECT COALESCE(SUM(f.quantity), 0) as meals_received FROM Request r JOIN Food_Listing f ON r.food_id = f.food_id WHERE r.ngo_id = ? AND r.status = 'delivered'`, [ngoId]);
        const [[{ partners }]] = await pool.query(`SELECT COUNT(DISTINCT f.restaurant_id) as partners FROM Request r JOIN Food_Listing f ON r.food_id = f.food_id WHERE r.ngo_id = ? AND r.status IN ('approved', 'delivered')`, [ngoId]);

        res.json({
            pending_requests: pending_count,
            in_transit: in_transit,
            meals_received: meals_received,
            partner_restaurants: partners
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error fetching stats.' });
    }
});

/* ====================================
   FOOD & REQUEST ROUTES 
==================================== */

// Create Food Listing (Restaurant)
app.post('/api/food-listings', authenticateToken, async (req, res) => {
    if (req.user.role !== 'restaurant') return res.status(403).json({ error: 'Unauthorized' });
    const { food_name, quantity, expiry_time } = req.body;
    try {
        await pool.query(`INSERT INTO Food_Listing (restaurant_id, food_name, quantity, expiry_time, status) VALUES (?, ?, ?, ?, 'available')`, [req.user.id, food_name, quantity, expiry_time || null]);
        res.json({ message: 'Listing created successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error creating listing' });
    }
});

// Get My Listings (Restaurant)
app.get('/api/food-listings/me', authenticateToken, async (req, res) => {
    if (req.user.role !== 'restaurant') return res.status(403).json({ error: 'Unauthorized' });
    try {
        const [listings] = await pool.query(`SELECT * FROM Food_Listing WHERE restaurant_id = ? ORDER BY created_at DESC`, [req.user.id]);
        res.json({ listings });
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// Browse Available Food (NGO)
app.get('/api/food/available', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ngo') return res.status(403).json({ error: 'Unauthorized' });
    try {
        const [foods] = await pool.query(`SELECT f.*, r.name as restaurant_name, r.location FROM Food_Listing f JOIN Restaurant r ON f.restaurant_id = r.restaurant_id WHERE f.status = 'available' AND (f.expiry_time IS NULL OR f.expiry_time > NOW()) ORDER BY f.created_at DESC`);
        res.json({ foods });
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// Request Food (NGO)
app.post('/api/requests', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ngo') return res.status(403).json({ error: 'Unauthorized' });
    const { food_id } = req.body;
    try {
        await pool.query(`UPDATE Food_Listing SET status = 'pending' WHERE food_id = ? AND status = 'available'`, [food_id]);
        await pool.query(`INSERT INTO Request (food_id, ngo_id, status) VALUES (?, ?, 'pending')`, [food_id, req.user.id]);
        res.json({ message: 'Food requested successfully!' });
    } catch (err) { res.status(500).json({ error: 'Database error requesting food' }); }
});

// Serve the app initially
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Export the app for Vercel
module.exports = app;

// Only start the server if executed directly (not when imported by Vercel)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
