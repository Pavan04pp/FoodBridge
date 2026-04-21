-- ============================================================
-- FoodBridge — Food Waste Management System
-- PostgreSQL Database Schema (Converted for Supabase)
-- 5 Tables | Exact ER as specified + max 2 extras per table
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. RESTAURANT (Food Donors)
--    Extra: email, password
-- ──────────────────────────────────────────────
CREATE TABLE Restaurant (
    restaurant_id   SERIAL PRIMARY KEY,
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
    ngo_id          SERIAL PRIMARY KEY,
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
    food_id         SERIAL PRIMARY KEY,
    restaurant_id   INT             NOT NULL,
    food_name       VARCHAR(200)    NOT NULL,
    quantity        VARCHAR(50)     NOT NULL,
    expiry_time     TIMESTAMP       NOT NULL,
    status          VARCHAR(50)     DEFAULT 'available',
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
    request_id      SERIAL PRIMARY KEY,
    ngo_id          INT             NOT NULL,
    food_id         INT             NOT NULL,
    request_time    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    status          VARCHAR(50)     DEFAULT 'pending',
    remarks         TEXT,                                     -- extra 1
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP, -- extra 2

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
    delivery_id     SERIAL PRIMARY KEY,
    request_id      INT             NOT NULL UNIQUE,
    delivery_status VARCHAR(50)     DEFAULT 'pending',
    delivery_time   TIMESTAMP,
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
    ('Raj''s Kitchen',    'Koramangala, Bangalore',  '9876543210', 'raj@kitchen.com',     'pass123'),
    ('Baker''s Delight',  'Indiranagar, Bangalore',  '9876543211', 'baker@delight.com',   'pass123'),
    ('Spice Garden',      'HSR Layout, Bangalore',   '9876543212', 'spice@garden.com',    'pass123'),
    ('Green Bowl',        'Whitefield, Bangalore',   '9876543213', 'green@bowl.com',      'pass123'),
    ('Tandoori Nights',   'MG Road, Bangalore',      '9876543214', 'tandoori@nights.com', 'pass123');

-- NGOs
INSERT INTO NGO (name, location, contact, email, password) VALUES
    ('Hope Foundation',  'Jayanagar, Bangalore',    '9876543220', 'hope@foundation.org', 'pass123'),
    ('Feed India',       'Rajajinagar, Bangalore',  '9876543221', 'feed@india.org',      'pass123'),
    ('Annapurna NGO',    'BTM Layout, Bangalore',   '9876543222', 'anna@purna.org',      'pass123'),
    ('Akshaya Trust',    'Koramangala, Bangalore',  '9876543223', 'akshaya@trust.org',   'pass123'),
    ('Seva Trust',       'Marathahalli, Bangalore', '9876543224', 'seva@trust.org',      'pass123');

-- Food Listings
INSERT INTO Food_Listing (restaurant_id, food_name, quantity, expiry_time, status, category) VALUES
    (1, 'Vegetable Biryani',  '10 kg',       '2026-04-14 22:00:00', 'available',  'Cooked Meal'),
    (2, 'Bread Rolls',        '50 items',    '2026-04-15 06:00:00', 'requested',  'Bakery'),
    (3, 'Dal Makhani',        '5 kg',        '2026-04-14 20:30:00', 'allocated',  'Cooked Meal'),
    (4, 'Fresh Fruit Salad',  '3 kg',        '2026-04-15 12:00:00', 'allocated',  'Raw Produce'),
    (5, 'Paneer Tikka',       '20 portions', '2026-04-14 23:00:00', 'available',  'Cooked Meal'),
    (1, 'Caesar Salad',       '2 kg',        '2026-04-14 20:00:00', 'expired',    'Raw Produce');

-- Requests
INSERT INTO Request (ngo_id, food_id, request_time, status, remarks) VALUES
    (1, 2, '2026-04-14 18:12:00', 'pending',  'Need urgently for evening distribution'),
    (4, 5, '2026-04-14 17:48:00', 'pending',  NULL),
    (2, 3, '2026-04-14 16:30:00', 'approved', 'Confirmed pickup'),
    (3, 4, '2026-04-14 15:15:00', 'approved', NULL),
    (1, 6, '2026-04-14 14:00:00', 'rejected', 'Food expired before pickup'),
    (5, 1, '2026-04-14 13:20:00', 'pending',  NULL);

-- Deliveries (only for approved requests)
INSERT INTO Delivery (request_id, delivery_status, delivery_time, delivery_agent, agent_phone) VALUES
    (3, 'in_transit', NULL,                    'Ramesh Kumar', '9988776655'),
    (4, 'delivered',  '2026-04-14 16:20:00',   'Suresh Yadav', '9988776656');
