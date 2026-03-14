import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import {
    createProject,
    deleteProject,
    getMyPortfolio,
    getPublicPortfolio,
    updateProject,
    upsertMyPortfolio,
} from '../controllers/portfolioController.js';

const router = express.Router();

router.get('/public/:username', getPublicPortfolio);
router.get('/me', protect, getMyPortfolio);
router.put(
    '/me',
    protect,
    upload.fields([{ name: 'profile_image' }, { name: 'resume' }]),
    upsertMyPortfolio
);
router.post('/projects', protect, upload.single('project_image'), createProject);
router.put('/projects/:projectId', protect, upload.single('project_image'), updateProject);
router.delete('/projects/:projectId', protect, deleteProject);

export default router;
