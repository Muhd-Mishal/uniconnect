import pool from './config/db.js';

async function testInsert() {
    try {
        const [result] = await pool.execute(
            'INSERT INTO messages (sender_id, receiver_id, group_id, content) VALUES (?, ?, ?, ?)',
            [1, null, 1, 'Test message']
        );
        console.log('Insert success:', result);
    } catch (e) {
        console.error('Insert error:', e);
    }
    process.exit(0);
}
testInsert();
