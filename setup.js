/**
 * FoodBridge — Automated Setup Script
 * Runs: npm run setup
 * Creates the database, tables, and seeds sample data with hashed passwords.
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setup() {
    console.log('\n🍱 FoodBridge Setup Starting...\n');

    // Connect WITHOUT specifying the database first (to create it)
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });
    } catch (err) {
        console.error('❌ Cannot connect to MySQL!');
        console.error('   → Make sure MySQL is running on your machine.');
        console.error('   → Error:', err.message);
        process.exit(1);
    }

    // ── Create Database ──
    await conn.query(`CREATE DATABASE IF NOT EXISTS foodbridge;`);
    await conn.query(`USE foodbridge;`);
    console.log('✅ Database "foodbridge" ready');

    // ── Drop & Recreate Tables ──
    await conn.query(`
        SET FOREIGN_KEY_CHECKS = 0;
        DROP TABLE IF EXISTS Delivery;
        DROP TABLE IF EXISTS Request;
        DROP TABLE IF EXISTS Food_Listing;
        DROP TABLE IF EXISTS NGO;
        DROP TABLE IF EXISTS Restaurant;
        SET FOREIGN_KEY_CHECKS = 1;
    `);

    await conn.query(`
        CREATE TABLE Restaurant (
            restaurant_id   INT             AUTO_INCREMENT PRIMARY KEY,
            name            VARCHAR(150)    NOT NULL,
            location        VARCHAR(300)    NOT NULL,
            contact         VARCHAR(15)     NOT NULL,
            email           VARCHAR(100)    NOT NULL UNIQUE,
            password        VARCHAR(255)    NOT NULL
        );

        CREATE TABLE NGO (
            ngo_id          INT             AUTO_INCREMENT PRIMARY KEY,
            name            VARCHAR(150)    NOT NULL,
            location        VARCHAR(300)    NOT NULL,
            contact         VARCHAR(15)     NOT NULL,
            email           VARCHAR(100)    NOT NULL UNIQUE,
            password        VARCHAR(255)    NOT NULL
        );

        CREATE TABLE Food_Listing (
            food_id         INT             AUTO_INCREMENT PRIMARY KEY,
            restaurant_id   INT             NOT NULL,
            food_name       VARCHAR(200)    NOT NULL,
            quantity        VARCHAR(50)     NOT NULL,
            expiry_time     DATETIME,
            status          ENUM('Available','Requested','Allocated','Expired') DEFAULT 'Available',
            category        VARCHAR(50),
            created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id) ON DELETE CASCADE
        );

        CREATE TABLE Request (
            request_id      INT             AUTO_INCREMENT PRIMARY KEY,
            ngo_id          INT             NOT NULL,
            food_id         INT             NOT NULL,
            request_time    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
            status          ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
            remarks         TEXT,
            updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (ngo_id)  REFERENCES NGO(ngo_id)  ON DELETE CASCADE,
            FOREIGN KEY (food_id) REFERENCES Food_Listing(food_id) ON DELETE CASCADE
        );

        CREATE TABLE Delivery (
            delivery_id     INT             AUTO_INCREMENT PRIMARY KEY,
            request_id      INT             NOT NULL UNIQUE,
            delivery_status ENUM('Pending','In Transit','Delivered','Cancelled') DEFAULT 'Pending',
            delivery_time   DATETIME,
            delivery_agent  VARCHAR(100),
            agent_phone     VARCHAR(15),
            FOREIGN KEY (request_id) REFERENCES Request(request_id) ON DELETE CASCADE
        );
    `);
    console.log('✅ Tables created');

    // ── Hash Passwords ──
    const pass = await bcrypt.hash('password123', 10);

    // ── Seed Restaurants ──
    await conn.query(`
        INSERT INTO Restaurant (name, location, contact, email, password) VALUES
        ("Raj's Kitchen",   'Koramangala, Bangalore',  '9876543210', 'raj@kitchen.com',     ?),
        ("Baker's Delight", 'Indiranagar, Bangalore',  '9876543211', 'baker@delight.com',   ?),
        ('Spice Garden',    'HSR Layout, Bangalore',   '9876543212', 'spice@garden.com',    ?),
        ('Green Bowl',      'Whitefield, Bangalore',   '9876543213', 'green@bowl.com',      ?),
        ('Tandoori Nights', 'MG Road, Bangalore',      '9876543214', 'tandoori@nights.com', ?)
    `, [pass, pass, pass, pass, pass]);
    console.log('✅ Sample restaurants seeded');

    // ── Seed NGOs ──
    await conn.query(`
        INSERT INTO NGO (name, location, contact, email, password) VALUES
        ('Hope Foundation', 'Jayanagar, Bangalore',    '9876543220', 'hope@foundation.org', ?),
        ('Feed India',      'Rajajinagar, Bangalore',  '9876543221', 'feed@india.org',      ?),
        ('Annapurna NGO',   'BTM Layout, Bangalore',   '9876543222', 'anna@purna.org',      ?),
        ('Akshaya Trust',   'Koramangala, Bangalore',  '9876543223', 'akshaya@trust.org',   ?),
        ('Seva Trust',      'Marathahalli, Bangalore', '9876543224', 'seva@trust.org',      ?)
    `, [pass, pass, pass, pass, pass]);
    console.log('✅ Sample NGOs seeded');

    // ── Seed Food Listings ──
    const future = new Date();
    future.setHours(future.getHours() + 6);
    const fmt = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

    const exp1 = fmt(new Date(Date.now() + 3 * 3600000));
    const exp2 = fmt(new Date(Date.now() + 8 * 3600000));
    const exp3 = fmt(new Date(Date.now() + 2 * 3600000));
    const exp4 = fmt(new Date(Date.now() + 6 * 3600000));
    const exp5 = fmt(new Date(Date.now() + 5 * 3600000));

    await conn.query(`
        INSERT INTO Food_Listing (restaurant_id, food_name, quantity, expiry_time, status, category) VALUES
        (1, 'Vegetable Biryani', '10 kg',       ?, 'Available', 'Cooked Meal'),
        (2, 'Bread Rolls',       '50 items',    ?, 'Available', 'Bakery'),
        (3, 'Dal Makhani',       '5 kg',        ?, 'Available', 'Cooked Meal'),
        (4, 'Fresh Fruit Salad', '3 kg',        ?, 'Available', 'Raw Produce'),
        (5, 'Paneer Tikka',      '20 portions', ?, 'Available', 'Cooked Meal')
    `, [exp1, exp2, exp3, exp4, exp5]);
    console.log('✅ Sample food listings seeded');

    await conn.end();

    console.log('\n🎉 Setup complete! All sample users have password: password123');
    console.log('\n📧 Sample logins:');
    console.log('   Restaurant → raj@kitchen.com   / password123');
    console.log('   NGO        → hope@foundation.org / password123\n');
    console.log('▶️  Now run: npm start\n');
}

setup().catch(err => {
    console.error('Setup failed:', err.message);
    process.exit(1);
});
