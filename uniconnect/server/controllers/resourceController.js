import pool from '../config/db.js';

// @desc    Get all career resources
// @route   GET /api/resources
// @access  Private
export const getResources = async (req, res, next) => {
    try {
        const [resources] = await pool.execute('SELECT * FROM career_resources ORDER BY created_at DESC');
        res.json(resources);
    } catch (error) {
        next(error);
    }
};

// @desc    Add a career resource
// @route   POST /api/resources
// @access  Private/Admin
export const addResource = async (req, res, next) => {
    try {
        const { title, description, link } = req.body;

        if (!title || !description || !link) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO career_resources (title, description, link) VALUES (?, ?, ?)',
            [title, description, link]
        );

        res.status(201).json({
            resource_id: result.insertId,
            title,
            description,
            link,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a career resource
// @route   DELETE /api/resources/:id
// @access  Private/Admin
export const deleteResource = async (req, res, next) => {
    try {
        const resourceId = req.params.id;

        const [result] = await pool.execute('DELETE FROM career_resources WHERE resource_id = ?', [resourceId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        res.json({ message: 'Resource removed' });
    } catch (error) {
        next(error);
    }
};
