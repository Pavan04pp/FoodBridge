const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

async function updatePasswords() {
    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const hashedPassword = await bcrypt.hash('pass123', 10);

        console.log('Updating all Restaurant and NGO sample passwords to proper bcrypt hashes...');
        await pool.query('UPDATE Restaurant SET password = $1', [hashedPassword]);
        await pool.query('UPDATE NGO SET password = $1', [hashedPassword]);

        console.log('✅ Success! Sample users can now log in securely with password: pass123');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updatePasswords();
