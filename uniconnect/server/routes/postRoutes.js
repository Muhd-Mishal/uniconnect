import express from 'express';
import {
    createPost,
    getPosts,
    toggleLike,
    addComment,
    getComments,
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getPosts).post(protect, upload.single('image'), createPost);

router.post('/:id/like', protect, toggleLike);

router.route('/:id/comments').get(protect, getComments).post(protect, addComment);

export default router;
