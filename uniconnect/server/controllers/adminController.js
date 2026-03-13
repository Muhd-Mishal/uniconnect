import pool from '../config/db.js';

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
    try {
        const [users] = await pool.execute(
            'SELECT user_id, username, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;

        if (userId == req.user.user_id) {
            return res.status(400).json({ message: 'Cannot delete yourself' });
        }

        const [result] = await pool.execute('DELETE FROM users WHERE user_id = ?', [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User removed completely' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get system stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getSystemStats = async (req, res, next) => {
    try {
        const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const [posts] = await pool.execute('SELECT COUNT(*) as count FROM posts');
        const [interviews] = await pool.execute('SELECT COUNT(*) as count FROM interview_results');
        const [resources] = await pool.execute('SELECT COUNT(*) as count FROM career_resources');

        res.json({
            totalUsers: users[0].count,
            totalPosts: posts[0].count,
            totalInterviews: interviews[0].count,
            totalResources: resources[0].count,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add an interview question
// @route   POST /api/admin/questions
// @access  Private/Admin
export const addQuestion = async (req, res, next) => {
    try {
        const { domain, question, ideal_answer } = req.body;

        if (!domain || !question || !ideal_answer) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO interview_questions (domain, question, ideal_answer) VALUES (?, ?, ?)',
            [domain, question, ideal_answer]
        );

        res.status(201).json({
            question_id: result.insertId,
            domain,
            question,
            ideal_answer
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all questions
// @route   GET /api/admin/questions
// @access  Private/Admin
export const getQuestions = async (req, res, next) => {
    try {
        const [questions] = await pool.execute('SELECT * FROM interview_questions');
        res.json(questions);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete question
// @route   DELETE /api/admin/questions/:id
// @access  Private/Admin
export const deleteQuestion = async (req, res, next) => {
    try {
        const [result] = await pool.execute('DELETE FROM interview_questions WHERE question_id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Question not found' });
        }

        res.json({ message: 'Question removed' });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete post
// @route   DELETE /api/admin/posts/:id
// @access  Private/Admin
export const deletePostAdmin = async (req, res, next) => {
    try {
        const [result] = await pool.execute('DELETE FROM posts WHERE post_id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json({ message: 'Post removed' });
    } catch (error) {
        next(error);
    }
};
