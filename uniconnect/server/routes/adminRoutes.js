import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getAllUsers,
    deleteUser,
    getSystemStats,
    addQuestion,
    getQuestions,
    deleteQuestion,
    deletePostAdmin
} from '../controllers/adminController.js';

const router = express.Router();

// User management
router.route('/users').get(protect, admin, getAllUsers);
router.route('/users/:id').delete(protect, admin, deleteUser);

// Stats
router.route('/stats').get(protect, admin, getSystemStats);

// Question Management
router.route('/questions').post(protect, admin, addQuestion).get(protect, admin, getQuestions);
router.route('/questions/:id').delete(protect, admin, deleteQuestion);

// Post Management
router.route('/posts/:id').delete(protect, admin, deletePostAdmin);

export default router;
