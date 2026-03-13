import pool from '../config/db.js';

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
export const getStudentProfile = async (req, res, next) => {
    try {
        const targetUserId = req.params.id ? req.params.id : req.user.user_id;

        const [rows] = await pool.execute(
            `SELECT u.user_id, u.username, u.email, sp.department, sp.year, sp.skills, sp.career_interest, sp.profile_pic, sp.resume 
       FROM users u 
       LEFT JOIN student_profile sp ON u.user_id = sp.user_id 
       WHERE u.user_id = ?`,
            [targetUserId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
export const updateStudentProfile = async (req, res, next) => {
    try {
        const { department, year, skills, career_interest } = req.body;
        let profile_pic = req.body.profile_pic || null;
        let resume = req.body.resume || null;

        if (req.files && req.files.profile_pic) {
            profile_pic = `/uploads/${req.files.profile_pic[0].filename}`;
        }
        if (req.files && req.files.resume) {
            resume = `/uploads/${req.files.resume[0].filename}`;
        }

        const [existing] = await pool.execute(
            'SELECT * FROM student_profile WHERE user_id = ?',
            [req.user.user_id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        const currentProfile = existing[0];

        const newDept = department || currentProfile.department;
        const newYear = year || currentProfile.year;
        const newSkills = skills || currentProfile.skills;
        const newCareerInterest = career_interest || currentProfile.career_interest;
        const newPic = profile_pic || currentProfile.profile_pic;
        const newResume = resume || currentProfile.resume;

        await pool.execute(
            `UPDATE student_profile 
       SET department = ?, year = ?, skills = ?, career_interest = ?, profile_pic = ?, resume = ? 
       WHERE user_id = ?`,
            [newDept, newYear, newSkills, newCareerInterest, newPic, newResume, req.user.user_id]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        next(error);
    }
};
