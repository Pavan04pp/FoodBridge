# 🍱 FoodBridge — Food Waste Management System

> A DBMS project connecting restaurants with NGOs to reduce food waste.  
> Built with **Node.js + Express + MySQL**

---

## ⚡ One-Click Setup (Clone & Run)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MySQL](https://dev.mysql.com/downloads/installer/) (running locally)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/Pavan04pp/FoodBridge.git
cd FoodBridge

# 2. Install dependencies
npm install 

# 3. Configure environment (copy and edit if needed)
copy .env.example .env

# 4. Setup database (creates DB + tables + sample data automatically)
npm run setup

# 5. Start the app
npm start
```

Then open **http://localhost:3000** in your browser. 

---

## 🔑 Sample Login Credentials

| Role | Email | Password |
|------|-------|----------|
| 🍽️ Restaurant | `raj@kitchen.com` | `password123` |
| 🍽️ Restaurant | `baker@delight.com` | `password123` |
| 🤝 NGO | `hope@foundation.org` | `password123` |
| 🤝 NGO | `feed@india.org` | `password123` |

---

## 🗂️ Project Structure

```
FoodBridge/
├── server.js              ← Main Express server (MySQL backend)
├── setup.js               ← One-click DB setup & seed script
├── index.html             ← Frontend (Landing + Dashboard)
├── app.js                 ← Frontend JavaScript logic
├── styles.css             ← Custom CSS
├── database_mysql.sql     ← MySQL schema reference
├── .env.example           ← Environment variable template
└── images/                ← App images
```

---

## 🗄️ Database Schema (5 Tables)

```
Restaurant ──< Food_Listing ──< Request >── NGO
                                   │
                               Delivery
```

| Table | Description |
|-------|-------------|
| `Restaurant` | Food donors (restaurants) |
| `NGO` | Food receivers (NGOs) |
| `Food_Listing` | Surplus food posted by restaurants |
| `Request` | NGO food requests |
| `Delivery` | Delivery tracking per request |

---

## 🔧 MySQL Configuration

Default config connects to `localhost` with `root` and **no password**.  
If your MySQL has a password, edit `.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=foodbridge
DB_PORT=3306
```

---

## ✨ Features

- 🔐 JWT Authentication (Restaurant & NGO roles)
- ➕ Add / Edit food listings (5-minute edit window)
- 🔍 NGO food browsing & claiming
- 📊 Role-based dashboard with live stats
- 👤 Profile & activity history
- 📱 Responsive glassmorphic UI

---

*Built for DBMS Project — 2026*
