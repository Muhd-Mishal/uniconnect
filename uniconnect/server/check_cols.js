import pool from './config/db.js';

async function check() {
    try {
        const [rows] = await pool.query('SHOW COLUMNS FROM messages');
        console.table(rows);
    } catch (e) {
        console.log(e);
    }
    process.exit(0);
}
check();
