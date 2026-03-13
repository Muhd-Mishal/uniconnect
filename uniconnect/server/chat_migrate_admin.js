import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'uniconnect',
});

async function migrate() {
    try {
        console.log("Adding is_admin to group_members...");
        await pool.execute('ALTER TABLE group_members ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;');
        console.log("Migration Successful!");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column is_admin already exists. Skipping.");
        } else {
            console.error("Migration error:", err);
        }
    } finally {
        process.exit();
    }
}

migrate();
