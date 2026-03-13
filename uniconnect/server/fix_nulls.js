import pool from './config/db.js';

async function fix() {
    try {
        await pool.execute('ALTER TABLE messages MODIFY receiver_id INT NULL');
        await pool.execute('ALTER TABLE messages MODIFY group_id INT NULL');
        console.log('Schema fixed!');
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
fix();
