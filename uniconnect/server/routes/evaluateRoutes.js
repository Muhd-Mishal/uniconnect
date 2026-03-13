import express from 'express';
import { evaluateAnswerSubmission } from '../controllers/evaluateController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/evaluate', protect, evaluateAnswerSubmission);

export default router;
