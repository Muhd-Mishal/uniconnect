import pool from '../config/db.js';

const cleanValue = (value) => {
    if (value === undefined || value === null) return null;
    const trimmed = String(value).trim();
    return trimmed === '' ? null : trimmed;
};

const normalizeLink = (value) => {
    const cleaned = cleanValue(value);
    if (!cleaned) return null;
    if (/^https?:\/\//i.test(cleaned)) return cleaned;
    return `https://${cleaned}`;
};

const ensurePortfolioForUser = async (userId) => {
    await pool.execute(
        'INSERT IGNORE INTO portfolios (user_id) VALUES (?)',
        [userId]
    );

    const [rows] = await pool.execute(
        'SELECT portfolio_id, user_id, bio, skills, profile_image, resume, created_at, updated_at FROM portfolios WHERE user_id = ?',
        [userId]
    );

    return rows[0];
};

const getProjectsForPortfolio = async (portfolioId) => {
    const [projects] = await pool.execute(
        `SELECT project_id, portfolio_id, title, description, image, github_url, live_demo_url, uploaded_at, updated_at
         FROM portfolio_projects
         WHERE portfolio_id = ?
         ORDER BY uploaded_at DESC, project_id DESC`,
        [portfolioId]
    );

    return projects;
};

const buildPortfolioPayload = async (userId) => {
    const portfolio = await ensurePortfolioForUser(userId);

    const [rows] = await pool.execute(
        `SELECT u.user_id, u.username, u.email, sp.department, sp.year, sp.career_interest, sp.profile_pic AS fallback_profile_pic,
                sp.skills AS fallback_skills, sp.resume AS fallback_resume, p.portfolio_id, p.bio, p.skills, p.profile_image, p.resume, p.created_at, p.updated_at
         FROM users u
         LEFT JOIN student_profile sp ON sp.user_id = u.user_id
         LEFT JOIN portfolios p ON p.user_id = u.user_id
         WHERE u.user_id = ?`,
        [userId]
    );

    const profile = rows[0];
    const projects = await getProjectsForPortfolio(portfolio.portfolio_id);

    return {
        ...profile,
        skills: profile.skills || profile.fallback_skills,
        profile_image: profile.profile_image || profile.fallback_profile_pic,
        resume: profile.resume || profile.fallback_resume,
        sharePath: `/portfolio/${profile.username}`,
        projects,
    };
};

export const getMyPortfolio = async (req, res, next) => {
    try {
        const payload = await buildPortfolioPayload(req.user.user_id);
        res.json(payload);
    } catch (error) {
        next(error);
    }
};

export const upsertMyPortfolio = async (req, res, next) => {
    try {
        const current = await ensurePortfolioForUser(req.user.user_id);

        let profileImage = current.profile_image;
        let resume = current.resume;

        if (req.files?.profile_image?.[0]) {
            profileImage = `/uploads/${req.files.profile_image[0].filename}`;
        }

        if (req.files?.resume?.[0]) {
            resume = `/uploads/${req.files.resume[0].filename}`;
        }

        await pool.execute(
            `UPDATE portfolios
             SET bio = ?, skills = ?, profile_image = ?, resume = ?
             WHERE user_id = ?`,
            [
                cleanValue(req.body.bio) ?? current.bio,
                cleanValue(req.body.skills) ?? current.skills,
                profileImage,
                resume,
                req.user.user_id,
            ]
        );

        const payload = await buildPortfolioPayload(req.user.user_id);
        res.json(payload);
    } catch (error) {
        next(error);
    }
};

export const createProject = async (req, res, next) => {
    try {
        const { title, description, github_url, live_demo_url } = req.body;

        if (!cleanValue(title) || !cleanValue(description)) {
            return res.status(400).json({ message: 'Project title and description are required' });
        }

        const portfolio = await ensurePortfolioForUser(req.user.user_id);
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        const [result] = await pool.execute(
            `INSERT INTO portfolio_projects (portfolio_id, title, description, image, github_url, live_demo_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                portfolio.portfolio_id,
                cleanValue(title),
                cleanValue(description),
                image,
                normalizeLink(github_url),
                normalizeLink(live_demo_url),
            ]
        );

        const [rows] = await pool.execute(
            `SELECT project_id, portfolio_id, title, description, image, github_url, live_demo_url, uploaded_at, updated_at
             FROM portfolio_projects
             WHERE project_id = ?`,
            [result.insertId]
        );

        res.status(201).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

export const updateProject = async (req, res, next) => {
    try {
        const [rows] = await pool.execute(
            `SELECT pp.*
             FROM portfolio_projects pp
             INNER JOIN portfolios p ON p.portfolio_id = pp.portfolio_id
             WHERE pp.project_id = ? AND p.user_id = ?`,
            [req.params.projectId, req.user.user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const current = rows[0];
        const image = req.file ? `/uploads/${req.file.filename}` : current.image;

        await pool.execute(
            `UPDATE portfolio_projects
             SET title = ?, description = ?, image = ?, github_url = ?, live_demo_url = ?
             WHERE project_id = ?`,
            [
                cleanValue(req.body.title) ?? current.title,
                cleanValue(req.body.description) ?? current.description,
                image,
                normalizeLink(req.body.github_url) ?? current.github_url,
                normalizeLink(req.body.live_demo_url) ?? current.live_demo_url,
                req.params.projectId,
            ]
        );

        const [updatedRows] = await pool.execute(
            `SELECT project_id, portfolio_id, title, description, image, github_url, live_demo_url, uploaded_at, updated_at
             FROM portfolio_projects
             WHERE project_id = ?`,
            [req.params.projectId]
        );

        res.json(updatedRows[0]);
    } catch (error) {
        next(error);
    }
};

export const deleteProject = async (req, res, next) => {
    try {
        const [result] = await pool.execute(
            `DELETE pp
             FROM portfolio_projects pp
             INNER JOIN portfolios p ON p.portfolio_id = pp.portfolio_id
             WHERE pp.project_id = ? AND p.user_id = ?`,
            [req.params.projectId, req.user.user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const getPublicPortfolio = async (req, res, next) => {
    try {
        const [rows] = await pool.execute(
            `SELECT u.user_id, u.username, u.email, sp.department, sp.year, sp.career_interest, sp.profile_pic AS fallback_profile_pic,
                    sp.skills AS fallback_skills, sp.resume AS fallback_resume, p.portfolio_id, p.bio, p.skills, p.profile_image, p.resume, p.created_at, p.updated_at
             FROM users u
             LEFT JOIN student_profile sp ON sp.user_id = u.user_id
             LEFT JOIN portfolios p ON p.user_id = u.user_id
             WHERE u.username = ?
             LIMIT 1`,
            [req.params.username]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Portfolio not found' });
        }

        const profile = rows[0];
        const projects = profile.portfolio_id ? await getProjectsForPortfolio(profile.portfolio_id) : [];

        res.json({
            ...profile,
            skills: profile.skills || profile.fallback_skills,
            profile_image: profile.profile_image || profile.fallback_profile_pic,
            resume: profile.resume || profile.fallback_resume,
            projects,
        });
    } catch (error) {
        next(error);
    }
};
