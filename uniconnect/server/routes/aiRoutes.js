import express from 'express';
import { generateQuestions, generateResources, generateChatbotReply, generateDbQuestionMcq, generateCareerCoachAnalysis } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();
const memoryUpload = multer({ storage: multer.memoryStorage() });

// Apply auth middleware to protect these routes
router.use(protect);

router.post('/questions', generateQuestions);
router.post('/resources', generateResources);
router.post('/chatbot', generateChatbotReply);
router.post('/db-mcq', generateDbQuestionMcq);
router.post('/career-coach', memoryUpload.single('resume_file'), generateCareerCoachAnalysis);

export default router;
