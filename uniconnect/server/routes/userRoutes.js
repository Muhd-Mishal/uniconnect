import express from 'express';
import { searchUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to protect the search route
router.get('/search', protect, searchUsers);

export default router;
