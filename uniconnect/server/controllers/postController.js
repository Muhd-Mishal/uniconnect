import pool from '../config/db.js';

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res, next) => {
    try {
        const { content } = req.body;
        let image = null;

        if (req.file) {
            image = `/uploads/${req.file.filename}`;
        }

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)',
            [req.user.user_id, content, image]
        );

        res.status(201).json({
            post_id: result.insertId,
            user_id: req.user.user_id,
            content,
            image,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
export const getPosts = async (req, res, next) => {
    try {
        const [posts] = await pool.execute(`
      SELECT 
        p.*, u.username, sp.profile_pic,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.post_id) AS like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.post_id) AS comment_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.post_id AND user_id = ?) AS is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN student_profile sp ON u.user_id = sp.user_id
      ORDER BY p.created_at DESC
    `, [req.user.user_id]);

        res.json(posts);
    } catch (error) {
        next(error);
    }
};

// @desc    Like or Unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
export const toggleLike = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const userId = req.user.user_id;

        // Check if like exists
        const [existingLike] = await pool.execute(
            'SELECT * FROM likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (existingLike.length > 0) {
            // Unlike
            await pool.execute('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
            res.json({ message: 'Post unliked' });
        } else {
            // Like
            await pool.execute('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);

            // Notification Trigger
            const [postResult] = await pool.execute('SELECT user_id FROM posts WHERE post_id = ?', [postId]);
            if (postResult.length > 0) {
                const ownerId = postResult[0].user_id;

                if (ownerId !== userId) {
                    await pool.execute(
                        `INSERT INTO notifications (user_id, source_user_id, type, reference_id, message) VALUES (?, ?, 'like', ?, 'liked your post')`,
                        [ownerId, userId, postId]
                    );

                    // Send Real-Time alert
                    const targetSocket = req.userSockets?.get(ownerId.toString());
                    if (targetSocket && req.io) {
                        req.io.to(targetSocket).emit('new_notification', {
                            type: 'like',
                            postId,
                            message: 'Someone liked your post'
                        });
                    }
                }
            }

            res.json({ message: 'Post liked' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Add a comment
// @route   POST /api/posts/:id/comment
// @access  Private
export const addComment = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const userId = req.user.user_id;
        const { comment } = req.body;

        if (!comment) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)',
            [postId, userId, comment]
        );

        // Notification Trigger
        const [postResult] = await pool.execute('SELECT user_id FROM posts WHERE post_id = ?', [postId]);
        if (postResult.length > 0) {
            const ownerId = postResult[0].user_id;

            if (ownerId !== userId) {
                await pool.execute(
                    `INSERT INTO notifications (user_id, source_user_id, type, reference_id, message) VALUES (?, ?, 'comment', ?, 'commented on your post')`,
                    [ownerId, userId, postId]
                );

                // Send Real-Time alert
                const targetSocket = req.userSockets?.get(ownerId.toString());
                if (targetSocket && req.io) {
                    req.io.to(targetSocket).emit('new_notification', {
                        type: 'comment',
                        postId,
                        message: 'Someone commented on your post'
                    });
                }
            }
        }

        res.status(201).json({
            comment_id: result.insertId,
            post_id: postId,
            user_id: userId,
            comment,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get comments for a post
// @route   GET /api/posts/:id/comments
// @access  Private
export const getComments = async (req, res, next) => {
    try {
        const postId = req.params.id;

        const [comments] = await pool.execute(`
      SELECT c.*, u.username, sp.profile_pic
      FROM comments c
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN student_profile sp ON u.user_id = sp.user_id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [postId]);

        res.json(comments);
    } catch (error) {
        next(error);
    }
};
