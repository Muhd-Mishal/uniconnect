import pool from '../config/db.js';
import {
    buildEvaluationFeedback,
    evaluateAnswerSimilarity
} from '../services/aiEvaluator.js';
import { insertEvaluationRecord } from './evaluateController.js';

// @desc    Get domains
// @route   GET /api/interviews/domains
// @access  Private
export const getDomains = async (req, res, next) => {
    try {
        const [domains] = await pool.execute('SELECT DISTINCT domain FROM interview_questions');
        res.json(domains.map(d => d.domain));
    } catch (error) {
        next(error);
    }
};

// @desc    Get random question by domain
// @route   GET /api/interviews/question/:domain
// @access  Private
export const getRandomQuestion = async (req, res, next) => {
    try {
        const { domain } = req.params;
        const [questions] = await pool.execute(
            'SELECT question_id, question, ideal_answer FROM interview_questions WHERE domain = ? ORDER BY RAND() LIMIT 1',
            [domain]
        );

        if (questions.length === 0) {
            return res.status(404).json({ message: 'No questions found for this domain' });
        }

        res.json({
            question_id: questions[0].question_id,
            question: questions[0].question,
            // Sending ideal_answer to client so it can be passed to AI service, 
            // or we can hide it here and let server call AI service. Better let server call AI.
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Submit answer for evaluation
// @route   POST /api/interviews/evaluate
// @access  Private
export const evaluateAnswer = async (req, res, next) => {
    try {
        const { question_id, user_answer } = req.body;

        if (!question_id || !user_answer) {
            return res.status(400).json({ message: 'question_id and user_answer are required' });
        }

        // Fetch the ideal answer
        const [questions] = await pool.execute(
            'SELECT ideal_answer FROM interview_questions WHERE question_id = ?',
            [question_id]
        );

        if (questions.length === 0) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const ideal_answer = questions[0].ideal_answer;
        const { similarityScore, percentage } = evaluateAnswerSimilarity(ideal_answer, user_answer);
        const feedback = buildEvaluationFeedback(percentage);

        // Save result to database
        await pool.execute(
            'INSERT INTO interview_results (user_id, question_id, user_answer, score, feedback) VALUES (?, ?, ?, ?, ?)',
            [req.user.user_id, question_id, user_answer, percentage, feedback]
        );

        await insertEvaluationRecord({
            userId: req.user.user_id,
            questionId: question_id,
            answer: user_answer,
            similarityScore
        });

        res.json({
            similarityScore,
            percentage,
            score: percentage,
            feedback
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get interview history
// @route   GET /api/interviews/history
// @access  Private
export const getInterviewHistory = async (req, res, next) => {
    try {
        const [results] = await pool.execute(`
      SELECT ir.result_id, ir.score, ir.feedback, ir.attempted_at, iq.domain, iq.question 
      FROM interview_results ir
      JOIN interview_questions iq ON ir.question_id = iq.question_id
      WHERE ir.user_id = ?
      ORDER BY ir.attempted_at ASC
    `, [req.user.user_id]);

        res.json(results);
    } catch (error) {
        next(error);
    }
};
