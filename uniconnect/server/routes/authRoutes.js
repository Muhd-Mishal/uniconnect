import express from 'express';
import {
    registerUser,
    loginUser,
    getUserProfile,
    verifyEmail,
    verifyRegistrationOtp,
    resendRegistrationOtp,
    forgotPassword,
    resetPassword
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-registration-otp', verifyRegistrationOtp);
router.post('/resend-registration-otp', resendRegistrationOtp);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
