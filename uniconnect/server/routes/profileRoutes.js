import express from 'express';
import { getStudentProfile, updateStudentProfile } from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', protect, getStudentProfile);
router.get('/:id', protect, getStudentProfile);
router.put('/', protect, upload.fields([{ name: 'profile_pic' }, { name: 'resume' }]), updateStudentProfile);

export default router;
