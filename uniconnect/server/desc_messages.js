import pool from './config/db.js';

async function describeTable() {
    try {
        const [rows] = await pool.query('DESCRIBE messages;');
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.log(e.message);
    }
    process.exit(0);
}
describeTable();
