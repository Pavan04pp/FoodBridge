-- ============================================================
-- FoodBridge — Food Waste Management System
-- MySQL Database Schema
-- 5 Tables | Exact ER as specified + max 2 extras per table
-- ============================================================

CREATE DATABASE IF NOT EXISTS foodbridge;
USE foodbridge;

-- ──────────────────────────────────────────────
-- 1. RESTAURANT (Food Donors)
--    Extra: email, password
-- ──────────────────────────────────────────────
CREATE TABLE Restaurant (
    restaurant_id   INT             AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150)    NOT NULL,
    location        VARCHAR(300)    NOT NULL,
    contact         VARCHAR(15)     NOT NULL,
    email           VARCHAR(100)    NOT NULL UNIQUE,         -- extra 1
    password        VARCHAR(255)    NOT NULL                 -- extra 2
);

-- ──────────────────────────────────────────────
-- 2. NGO (Food Receivers)
--    Extra: email, password
-- ──────────────────────────────────────────────
CREATE TABLE NGO (
    ngo_id          INT             AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150)    NOT NULL,
    location        VARCHAR(300)    NOT NULL,
    contact         VARCHAR(15)     NOT NULL,
    email           VARCHAR(100)    NOT NULL UNIQUE,         -- extra 1
    password        VARCHAR(255)    NOT NULL                 -- extra 2
);

-- ──────────────────────────────────────────────
-- 3. FOOD_LISTING (Surplus food by restaurants)
--    Extra: category, created_at
--    FK: restaurant_id → Restaurant (1:M)
-- ──────────────────────────────────────────────
CREATE TABLE Food_Listing (
    food_id         INT             AUTO_INCREMENT PRIMARY KEY,
    restaurant_id   INT             NOT NULL,
    food_name       VARCHAR(200)    NOT NULL,
    quantity         VARCHAR(50)     NOT NULL,
    expiry_time     DATETIME        NOT NULL,
    status          ENUM('Available','Requested','Allocated','Expired')
                                    DEFAULT 'Available',
    category        VARCHAR(50),                              -- extra 1
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,-- extra 2

    FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id)
        ON DELETE CASCADE
);

-- ──────────────────────────────────────────────
-- 4. REQUEST (NGO requests for food)
--    Extra: remarks, updated_at
--    FK: ngo_id  → NGO (1:M)
--    FK: food_id → Food_Listing (1:M)
-- ──────────────────────────────────────────────
CREATE TABLE Request (
    request_id      INT             AUTO_INCREMENT PRIMARY KEY,
    ngo_id          INT             NOT NULL,
    food_id         INT             NOT NULL,
    request_time    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    status          ENUM('Pending','Approved','Rejected')
                                    DEFAULT 'Pending',
    remarks         TEXT,                                     -- extra 1
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP, -- extra 2

    FOREIGN KEY (ngo_id)  REFERENCES NGO(ngo_id)
        ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES Food_Listing(food_id)
        ON DELETE CASCADE
);

-- ──────────────────────────────────────────────
-- 5. DELIVERY (1:1 with Request)
--    Extra: delivery_agent, agent_phone
--    FK: request_id → Request (1:1, UNIQUE)
-- ──────────────────────────────────────────────
CREATE TABLE Delivery (
    delivery_id     INT             AUTO_INCREMENT PRIMARY KEY,
    request_id      INT             NOT NULL UNIQUE,
    delivery_status ENUM('Pending','In Transit','Delivered','Cancelled')
                                    DEFAULT 'Pending',
    delivery_time   DATETIME,
    delivery_agent  VARCHAR(100),                             -- extra 1
    agent_phone     VARCHAR(15),                              -- extra 2

    FOREIGN KEY (request_id) REFERENCES Request(request_id)
        ON DELETE CASCADE
);


-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Restaurants
INSERT INTO Restaurant (name, location, contact, email, password) VALUES
    ("Raj's Kitchen",    'Koramangala, Bangalore',  '9876543210', 'raj@kitchen.com',     'pass123'),
    ("Baker's Delight",  'Indiranagar, Bangalore',  '9876543211', 'baker@delight.com',   'pass123'),
    ('Spice Garden',     'HSR Layout, Bangalore',   '9876543212', 'spice@garden.com',    'pass123'),
    ('Green Bowl',       'Whitefield, Bangalore',   '9876543213', 'green@bowl.com',      'pass123'),
    ('Tandoori Nights',  'MG Road, Bangalore',      '9876543214', 'tandoori@nights.com', 'pass123');

-- NGOs
INSERT INTO NGO (name, location, contact, email, password) VALUES
    ('Hope Foundation',  'Jayanagar, Bangalore',    '9876543220', 'hope@foundation.org', 'pass123'),
    ('Feed India',       'Rajajinagar, Bangalore',  '9876543221', 'feed@india.org',      'pass123'),
    ('Annapurna NGO',    'BTM Layout, Bangalore',   '9876543222', 'anna@purna.org',      'pass123'),
    ('Akshaya Trust',    'Koramangala, Bangalore',   '9876543223', 'akshaya@trust.org',   'pass123'),
    ('Seva Trust',       'Marathahalli, Bangalore', '9876543224', 'seva@trust.org',      'pass123');

-- Food Listings
INSERT INTO Food_Listing (restaurant_id, food_name, quantity, expiry_time, status, category) VALUES
    (1, 'Vegetable Biryani',  '10 kg',       '2026-04-14 22:00:00', 'Available',  'Cooked Meal'),
    (2, 'Bread Rolls',        '50 items',    '2026-04-15 06:00:00', 'Requested',  'Bakery'),
    (3, 'Dal Makhani',        '5 kg',        '2026-04-14 20:30:00', 'Allocated',  'Cooked Meal'),
    (4, 'Fresh Fruit Salad',  '3 kg',        '2026-04-15 12:00:00', 'Allocated',  'Raw Produce'),
    (5, 'Paneer Tikka',       '20 portions', '2026-04-14 23:00:00', 'Available',  'Cooked Meal'),
    (1, 'Caesar Salad',       '2 kg',        '2026-04-14 20:00:00', 'Expired',    'Raw Produce');

-- Requests
INSERT INTO Request (ngo_id, food_id, request_time, status, remarks) VALUES
    (1, 2, '2026-04-14 18:12:00', 'Pending',  'Need urgently for evening distribution'),
    (4, 5, '2026-04-14 17:48:00', 'Pending',  NULL),
    (2, 3, '2026-04-14 16:30:00', 'Approved', 'Confirmed pickup'),
    (3, 4, '2026-04-14 15:15:00', 'Approved', NULL),
    (1, 6, '2026-04-14 14:00:00', 'Rejected', 'Food expired before pickup'),
    (5, 1, '2026-04-14 13:20:00', 'Pending',  NULL);

-- Deliveries (only for approved requests)
INSERT INTO Delivery (request_id, delivery_status, delivery_time, delivery_agent, agent_phone) VALUES
    (3, 'In Transit', NULL,                    'Ramesh Kumar', '9988776655'),
    (4, 'Delivered',  '2026-04-14 16:20:00',   'Suresh Yadav', '9988776656');


-- ============================================================
-- USEFUL QUERIES
-- ============================================================

-- Q1: Dashboard stats for a restaurant
-- SELECT
--     COUNT(CASE WHEN status = 'Available' THEN 1 END) AS active_listings,
--     COUNT(CASE WHEN status = 'Expired'   THEN 1 END) AS expired_items
-- FROM Food_Listing
-- WHERE restaurant_id = 1;

-- Q2: All pending requests with NGO & food details
-- SELECT r.request_id, n.name AS ngo_name, f.food_name, f.quantity,
--        r.request_time, r.status
-- FROM Request r
-- JOIN NGO n          ON r.ngo_id  = n.ngo_id
-- JOIN Food_Listing f ON r.food_id = f.food_id
-- WHERE r.status = 'Pending'
-- ORDER BY r.request_time DESC;

-- Q3: Delivery tracker with full details
-- SELECT d.delivery_id, f.food_name, f.quantity, n.name AS ngo_name,
--        d.delivery_status, d.delivery_time, d.delivery_agent
-- FROM Delivery d
-- JOIN Request r      ON d.request_id = r.request_id
-- JOIN NGO n          ON r.ngo_id     = n.ngo_id
-- JOIN Food_Listing f ON r.food_id    = f.food_id;

-- Q4: Browse available food for NGOs
-- SELECT f.food_id, f.food_name, f.quantity, f.expiry_time, f.category,
--        res.name AS restaurant_name, res.location
-- FROM Food_Listing f
-- JOIN Restaurant res ON f.restaurant_id = res.restaurant_id
-- WHERE f.status = 'Available'
-- ORDER BY f.expiry_time ASC;

-- Q5: Food listings table for a restaurant
-- SELECT f.food_id, f.food_name, f.quantity, f.expiry_time, f.status,
--        COALESCE(n.name, '—') AS requested_by
-- FROM Food_Listing f
-- LEFT JOIN Request r ON f.food_id = r.food_id AND r.status IN ('Pending','Approved')
-- LEFT JOIN NGO n     ON r.ngo_id  = n.ngo_id
-- WHERE f.restaurant_id = 1;
