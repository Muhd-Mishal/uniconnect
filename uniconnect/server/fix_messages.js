import pool from './config/db.js';

async function fixMessagesSchema() {
    try {
        console.log('Checking messages table schema...');
        try {
            await pool.query('ALTER TABLE messages ADD COLUMN group_id INT DEFAULT NULL;');
            console.log('Added group_id column.');
        } catch (e) {
            console.log('group_id might already exist or error:', e.message);
        }

        try {
            await pool.query('ALTER TABLE messages ADD COLUMN receiver_id INT DEFAULT NULL;');
            console.log('Added receiver_id column.');
        } catch (e) {
            console.log('receiver_id might already exist or error:', e.message);
        }

        try {
            await pool.query('ALTER TABLE messages CHANGE message_text content TEXT NOT NULL;');
            console.log('Changed message_text to content.');
        } catch (e) {
            console.log('content column change error:', e.message);
        }

        try {
            await pool.query('ALTER TABLE messages CHANGE message_id id INT AUTO_INCREMENT;');
            console.log('Changed message_id to id.');
        } catch (e) {
            console.log('id column change error:', e.message);
        }

        console.log('Schema check complete.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

fixMessagesSchema();
