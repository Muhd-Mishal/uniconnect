import pool from '../config/db.js';

// @desc    Search users by ID or username
// @route   GET /api/users/search?q=
// @access  Private
export const searchUsers = async (req, res, next) => {
    try {
        const { q } = req.query;

        // If no query parameter is provided, return an empty array
        if (!q) {
            return res.json([]);
        }

        // We check if the query is a number to optionally match by exact ID
        const isNumeric = !isNaN(q) && q.trim() !== '';

        let queryStr;
        let queryParams;

        if (isNumeric) {
            // Search by exact ID OR partial username match
            queryStr = `
                SELECT u.user_id as id, u.username as name, sp.department, sp.profile_pic as profilePic 
                FROM users u 
                LEFT JOIN student_profile sp ON u.user_id = sp.user_id 
                WHERE u.user_id = ? OR u.username LIKE ?
                LIMIT 20
            `;
            queryParams = [parseInt(q), `%${q}%`];
        } else {
            // Search only by partial username match
            queryStr = `
                SELECT u.user_id as id, u.username as name, sp.department, sp.profile_pic as profilePic 
                FROM users u 
                LEFT JOIN student_profile sp ON u.user_id = sp.user_id 
                WHERE u.username LIKE ?
                LIMIT 20
            `;
            queryParams = [`%${q}%`];
        }

        const [users] = await pool.execute(queryStr, queryParams);

        // Map over results to ensure null values aren't returned where an empty string makes more sense
        // and adjust image paths if necessary based on how the frontend expects it.
        const formattedUsers = users.map(user => ({
            id: user.id,
            user_id: user.id, // Added to strictly satisfy routing params requirements
            name: user.name,
            department: user.department || 'Not specified',
            profilePic: user.profilePic || ''
        }));

        res.json(formattedUsers);
    } catch (error) {
        next(error);
    }
};
