import pool from '../config/db.js';
import {
    buildEvaluationFeedback,
    evaluateAnswerSimilarity
} from '../services/aiEvaluator.js';

const insertEvaluationRecord = async ({
    userId,
    questionId = null,
    answer,
    similarityScore
}) => {
    await pool.execute(
        `INSERT INTO answer_evaluations
        (user_id, question_id, answer, similarity_score, evaluated_at)
        VALUES (?, ?, ?, ?, NOW())`,
        [userId, questionId, answer, similarityScore]
    );
};

export const evaluateAnswerSubmission = async (req, res, next) => {
    try {
        const {
            referenceAnswer,
            studentAnswer,
            questionId = null
        } = req.body;

        if (!referenceAnswer || !studentAnswer) {
            return res.status(400).json({
                message: 'referenceAnswer and studentAnswer are required'
            });
        }

        const evaluation = evaluateAnswerSimilarity(referenceAnswer, studentAnswer);

        await insertEvaluationRecord({
            userId: req.user.user_id,
            questionId,
            answer: studentAnswer,
            similarityScore: evaluation.similarityScore
        });

        res.json({
            ...evaluation,
            feedback: buildEvaluationFeedback(evaluation.percentage)
        });
    } catch (error) {
        next(error);
    }
};

export { insertEvaluationRecord };
