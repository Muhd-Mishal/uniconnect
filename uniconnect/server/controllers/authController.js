import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/db.js';
import { sendEmail } from '../utils/sendEmail.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const OTP_EXPIRY_MS = 10 * 60 * 1000;

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const createOtpPayload = () => {
    const otp = generateOtp();
    const expiresAt = Date.now() + OTP_EXPIRY_MS;
    return {
        otp,
        expiresAt,
        token: `${otp}:${expiresAt}`,
    };
};

const parseOtpPayload = (verificationToken) => {
    if (!verificationToken || !verificationToken.includes(':')) {
        return null;
    }

    const [otp, expiry] = verificationToken.split(':');
    const expiresAt = Number(expiry);

    if (!otp || Number.isNaN(expiresAt)) {
        return null;
    }

    return { otp, expiresAt };
};

const sendOtpEmail = async (email, username, otp) => {
    const message = `
        <h2>Welcome to Uni-Connect</h2>
        <p>Hi ${username},</p>
        <p>Your verification code is:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 8px; margin: 16px 0;">${otp}</div>
        <p>This code will expire in 10 minutes.</p>
    `;

    await sendEmail({
        email,
        subject: 'Your Uni-Connect verification code',
        html: message,
    });
};

export const registerUser = async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const [existingUsers] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Force all new signups to be students regardless of req.body
        const userRole = 'student';
        const { otp, token: verificationToken, expiresAt } = createOtpPayload();

        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password, role, is_verified, verification_token) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, userRole, false, verificationToken]
        );

        const user_id = result.insertId;

        if (userRole === 'student') {
            await pool.execute('INSERT INTO student_profile (user_id) VALUES (?)', [user_id]);
        }

        await sendOtpEmail(email, username, otp);

        res.status(201).json({
            message: 'Registration successful. Enter the OTP sent to your email to verify your account.',
            user_id,
            username,
            email,
            role: userRole,
            otpExpiresAt: expiresAt,
        });
    } catch (error) {
        next(error);
    }
};

export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = users[0];
        if (user.is_verified === 0 || !user.is_verified) {
            return res.status(403).json({ message: "Verify email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            res.json({
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user.user_id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        next(error);
    }
};

export const getUserProfile = async (req, res, next) => {
    try {
        const [user] = await pool.execute(
            'SELECT user_id, username, email, role, created_at FROM users WHERE user_id = ?',
            [req.user.user_id]
        );

        if (user.length > 0) {
            res.json(user[0]);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};

export const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;

        const [users] = await pool.execute('SELECT * FROM users WHERE verification_token = ?', [token]);

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        await pool.execute('UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE verification_token = ?', [token]);

        // Redirect to a frontend success page via react-router later, or a pure HTML response.
        res.send(`
            <div style="text-align: center; margin-top: 50px; font-family: sans-serif;">
                <h1 style="color: #4CAF50;">Verification Successful!</h1>
                <p>Your email has been verified. You can now <a href="${process.env.FRONTEND_URL}/login">login</a>.</p>
            </div>
        `);
    } catch (error) {
        next(error);
    }
};

export const verifyRegistrationOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];
        const otpPayload = parseOtpPayload(user.verification_token);

        if (!otpPayload) {
            return res.status(400).json({ message: 'No active OTP found. Please request a new code.' });
        }

        if (Date.now() > otpPayload.expiresAt) {
            return res.status(400).json({ message: 'OTP expired. Please request a new code.' });
        }

        if (otpPayload.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        await pool.execute(
            'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE email = ?',
            [email]
        );

        res.status(200).json({ message: 'Email verified. You can now log in.' });
    } catch (error) {
        next(error);
    }
};

export const resendRegistrationOtp = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        if (user.is_verified) {
            return res.status(400).json({ message: 'This account is already verified' });
        }

        const { otp, token: verificationToken, expiresAt } = createOtpPayload();

        await pool.execute(
            'UPDATE users SET verification_token = ? WHERE email = ?',
            [verificationToken, email]
        );

        await sendOtpEmail(email, user.username, otp);

        res.status(200).json({
            message: 'A new OTP has been sent to your email.',
            otpExpiresAt: expiresAt,
        });
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'No user found with that email address' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour

        await pool.execute('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?', [resetToken, resetTokenExpiry, email]);

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const message = `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Please click the link below to set a new password. This link will expire in 1 hour.</p>
            <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
            <p>If you did not request this, please ignore this email.</p>
        `;

        await sendEmail({
            email,
            subject: 'Password Reset - Uni-Connect',
            html: message,
        });

        res.status(200).json({ message: 'Password reset link sent to your email.' });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const [users] = await pool.execute('SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?', [token, Date.now()]);

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.execute(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ?',
            [hashedPassword, token]
        );

        res.status(200).json({ message: 'Password has been successfully reset. You can now login.' });
    } catch (error) {
        next(error);
    }
};

