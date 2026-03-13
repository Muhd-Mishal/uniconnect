import express from 'express';
import { generateQuestions, generateResources, generateChatbotReply, generateDbQuestionMcq } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to protect these routes
router.use(protect);

router.post('/questions', generateQuestions);
router.post('/resources', generateResources);
router.post('/chatbot', generateChatbotReply);
router.post('/db-mcq', generateDbQuestionMcq);

export default router;
