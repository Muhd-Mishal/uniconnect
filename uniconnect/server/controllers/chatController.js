import pool from '../config/db.js';

// @desc    Create a new group chat
// @route   POST /api/chat/groups
// @access  Private
export const createGroup = async (req, res, next) => {
    let connection;
    try {
        const { name, userIds } = req.body;
        const creatorId = req.user.user_id; // Added by authMiddleware protect

        if (!name) {
            return res.status(400).json({ message: 'Group name is required' });
        }

        // Establish a transaction mapping
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute(
            'INSERT INTO chat_groups (name, created_by) VALUES (?, ?)',
            [name, creatorId]
        );

        const groupId = result.insertId;

        // Auto add the creator to the group as an admin immediately
        await connection.execute(
            'INSERT INTO group_members (group_id, user_id, is_admin) VALUES (?, ?, true)',
            [groupId, creatorId]
        );

        // Add additional users if an array was provided
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            // Build the bulk insert query
            const placeholders = userIds.map(() => '(?, ?, false)').join(', ');
            const values = [];
            userIds.forEach(uid => {
                values.push(groupId, uid);
            });

            await connection.execute(
                `INSERT IGNORE INTO group_members (group_id, user_id, is_admin) VALUES ${placeholders}`,
                values
            );
        }

        await connection.commit();

        res.status(201).json({
            id: groupId,
            name,
            created_by: creatorId
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        next(error);
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// @desc    Add a member to a group
// @route   POST /api/chat/groups/add
// @access  Private
export const addGroupMember = async (req, res, next) => {
    try {
        const { group_id, user_id } = req.body;

        if (!group_id || !user_id) {
            return res.status(400).json({ message: 'Group ID and User ID are required' });
        }

        // Verify group exists
        const [group] = await pool.execute('SELECT * FROM chat_groups WHERE id = ?', [group_id]);
        if (group.length === 0) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Insert member ignoring duplicates
        await pool.execute(
            'INSERT IGNORE INTO group_members (group_id, user_id, is_admin) VALUES (?, ?, false)',
            [group_id, user_id]
        );

        res.status(200).json({ message: 'Member added to group successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all members of a group
// @route   GET /api/chat/groups/:id/members
// @access  Private
export const getGroupMembers = async (req, res, next) => {
    try {
        const groupId = req.params.id;

        // Ensure requester is in the group
        const [membership] = await pool.execute(
            'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, req.user.user_id]
        );

        if (membership.length === 0) {
            return res.status(403).json({ message: 'Not authorized to view this group' });
        }

        const [members] = await pool.execute(`
            SELECT u.user_id, u.username, u.email, sp.department, sp.profile_pic, gm.is_admin, gm.joined_at
            FROM group_members gm
            JOIN users u ON gm.user_id = u.user_id
            LEFT JOIN student_profile sp ON u.user_id = sp.user_id
            WHERE gm.group_id = ?
            ORDER BY gm.is_admin DESC, u.username ASC
        `, [groupId]);

        res.json(members);
    } catch (error) {
        next(error);
    }
};

// @desc    Remove a member from a group (Admin only)
// @route   DELETE /api/chat/groups/:groupId/members/:userId
// @access  Private
export const removeGroupMember = async (req, res, next) => {
    try {
        const { groupId, userId } = req.params;
        const currentUserId = req.user.user_id;

        // Verify requester is an admin
        const [adminCheck] = await pool.execute(
            'SELECT is_admin FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, currentUserId]
        );

        if (adminCheck.length === 0 || !adminCheck[0].is_admin) {
            return res.status(403).json({ message: 'You must be a group admin to remove members' });
        }

        // Remove the member
        const [result] = await pool.execute(
            'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found in this group' });
        }

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Leave a group (Standard user action)
// @route   DELETE /api/chat/groups/:groupId/leave
// @access  Private
export const leaveGroup = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const currentUserId = req.user.user_id;

        const [result] = await pool.execute(
            'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, currentUserId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'You are not a member of this group' });
        }

        res.json({ message: 'Successfully left the group' });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a group entirely (Admin only)
// @route   DELETE /api/chat/groups/:groupId
// @access  Private
export const deleteGroup = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const currentUserId = req.user.user_id;

        // Verify requester is an admin
        const [adminCheck] = await pool.execute(
            'SELECT is_admin FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, currentUserId]
        );

        if (adminCheck.length === 0 || !adminCheck[0].is_admin) {
            return res.status(403).json({ message: 'You must be a group admin to delete the group' });
        }

        // Delete the group (Cascading deletes handles messages and group_members)
        const [result] = await pool.execute(
            'DELETE FROM chat_groups WHERE id = ?',
            [groupId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Group not found' });
        }

        res.json({ message: 'Group deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Fetch chat history for a specific context
// @route   GET /api/chat/history?receiver_id=X or ?group_id=Y
// @access  Private
export const getChatHistory = async (req, res, next) => {
    try {
        const { receiver_id, group_id } = req.query;
        const currentUser = req.user.user_id;

        if (!receiver_id && !group_id) {
            return res.status(400).json({ message: 'Must provide either receiver_id or group_id' });
        }

        let queryStr = '';
        let queryParams = [];

        if (group_id) {
            // Check if user is in group before fetching (optional but good security)
            const [membership] = await pool.execute(
                'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
                [group_id, currentUser]
            );
            if (membership.length === 0) {
                return res.status(403).json({ message: 'Not authorized to view this group chat' });
            }

            queryStr = `
                SELECT m.id, m.sender_id, m.receiver_id, m.group_id, m.content, m.created_at, u.username as sender_name 
                FROM messages m
                JOIN users u ON m.sender_id = u.user_id
                WHERE m.group_id = ?
                ORDER BY m.created_at ASC
            `;
            queryParams = [group_id];
        } else if (receiver_id) {
            queryStr = `
                SELECT m.id, m.sender_id, m.receiver_id, m.group_id, m.content, m.created_at, u.username as sender_name 
                FROM messages m
                JOIN users u ON m.sender_id = u.user_id
                WHERE (m.sender_id = ? AND m.receiver_id = ?) 
                   OR (m.sender_id = ? AND m.receiver_id = ?)
                ORDER BY m.created_at ASC
            `;
            queryParams = [currentUser, receiver_id, receiver_id, currentUser];
        }

        const [messages] = await pool.execute(queryStr, queryParams);
        res.json(messages);
    } catch (error) {
        next(error);
    }
};

// @desc    Retrieve all chat connections for the sidebar
// @route   GET /api/chat/connections
// @access  Private
// Utility method to construct the left-hand navigation pane.
export const getUserChats = async (req, res, next) => {
    try {
        const currentUserId = req.user.user_id;

        // Fetch Groups the user belongs to
        const [groups] = await pool.execute(`
            SELECT cg.id as group_id, cg.id, cg.name, 'group' as type
            FROM chat_groups cg
            JOIN group_members gm ON cg.id = gm.group_id
            WHERE gm.user_id = ?
        `, [currentUserId]);

        // Fetch Users we have DIRECT messages with
        const [dms] = await pool.execute(`
            SELECT DISTINCT
               CASE 
                 WHEN m.sender_id = ? THEN m.receiver_id
                 ELSE m.sender_id
               END as id,
               u.username as name,
               'direct' as type
            FROM messages m
            JOIN users u ON u.user_id = (
               CASE 
                 WHEN m.sender_id = ? THEN m.receiver_id
                 ELSE m.sender_id
               END
            )
            WHERE (m.sender_id = ? OR m.receiver_id = ?) AND m.group_id IS NULL
        `, [currentUserId, currentUserId, currentUserId, currentUserId]);

        res.json({
            groups,
            directChats: dms
        });
    } catch (error) {
        next(error);
    }
};
