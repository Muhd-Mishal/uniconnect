import pool from './config/db.js';

async function checkNotifications() {
    try {
        console.log('Validating MySQL Notifications schema...');

        await pool.query('DROP TABLE IF EXISTS notifications;');

        // Check and add notifications table with source_user_id
        await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        source_user_id INT NOT NULL,
        type ENUM('like', 'comment') NOT NULL,
        reference_id INT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (source_user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );
    `);

        console.log('Notifications schema resolved successfully.');
    } catch (err) {
        console.error('Error configuring notifications:', err);
    } finally {
        process.exit(0);
    }
}

checkNotifications();
