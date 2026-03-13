import express from 'express';
import { getDomains, getRandomQuestion, evaluateAnswer, getInterviewHistory } from '../controllers/interviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/domains', protect, getDomains);
router.get('/question/:domain', protect, getRandomQuestion);
router.post('/evaluate', protect, evaluateAnswer);
router.get('/history', protect, getInterviewHistory);

export default router;
