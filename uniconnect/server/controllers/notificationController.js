import pool from '../config/db.js';

// @desc    Get current user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.user_id;

        const [notifications] = await pool.execute(`
            SELECT n.*, u.username as source_name, sp.profile_pic as source_image
            FROM notifications n
            JOIN users u ON n.source_user_id = u.user_id
            LEFT JOIN student_profile sp ON u.user_id = sp.user_id
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
            LIMIT 20
        `, [userId]);

        res.json(notifications);
    } catch (error) {
        next(error);
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/mark-read
// @access  Private
export const markNotificationsRead = async (req, res, next) => {
    try {
        const userId = req.user.user_id;

        // This marks all unread notifications globally as read for this user, similar to clicking the bell icon.
        await pool.execute(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
            [userId]
        );

        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        next(error);
    }
};
