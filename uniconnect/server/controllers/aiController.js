import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from '../config/db.js';

const AI_RETRYABLE_STATUS_CODES = new Set([429, 500, 503]);
const AI_MAX_RETRIES = 3;

// Initialize the API only when needed to avoid crashing on import if key isn't set yet
const getGenerativeModel = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableAiError = (error) => AI_RETRYABLE_STATUS_CODES.has(error?.status);

const generateContentWithRetry = async (prompt) => {
    let lastError;

    for (let attempt = 0; attempt < AI_MAX_RETRIES; attempt += 1) {
        try {
            const model = getGenerativeModel();
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            lastError = error;

            if (!isRetryableAiError(error) || attempt === AI_MAX_RETRIES - 1) {
                throw error;
            }

            await delay(800 * (attempt + 1));
        }
    }

    throw lastError;
};

// @desc    Generate interview questions using Gemini API
// @route   POST /api/ai/questions
// @access  Private
export const generateQuestions = async (req, res) => {
    try {
        const { domain, difficulty = 'intermediate', count = 3, format } = req.body;

        if (!domain) {
            return res.status(400).json({ message: 'Domain or topic is required' });
        }

        const normalizedFormat = format === 'mcq' || format === 'normal' ? format : null;
        const inferredMcq =
            domain.toLowerCase().includes('aptitude') ||
            domain.toLowerCase().includes('logical') ||
            domain.toLowerCase().includes('reasoning');
        const shouldGenerateMcq = normalizedFormat ? normalizedFormat === 'mcq' : inferredMcq;

        let prompt = `You are an expert technical and logical interviewer. Generate ${count} interview questions for the domain/topic: "${domain}" at a "${difficulty}" difficulty level.
        
        For each question, provide an "ideal_answer" that can be used to evaluate a candidate's response later.
        `;

        if (shouldGenerateMcq) {
            prompt += `
            Since this is an aptitude or logical reasoning topic, please format the questions as Multiple Choice Questions (MCQs).
            For each question, provide an array of exactly 4 strings under the property "options". 
            The "ideal_answer" must exactly match one of the strings in the "options" array.`;
        } else {
            prompt += `
            This is a standard technical interview. Do not provide options. The "ideal_answer" should be a comprehensive text paragraph.
            The "options" property should be an empty array [].`;
        }

        prompt += `
        Return the response strictly as a JSON array of objects, where each object has "question" (string), "ideal_answer" (string), and "options" (array of strings). Do not include markdown formatting or any other text before or after the JSON array.`;

        const responseText = await generateContentWithRetry(prompt);

        // Clean up markdown formatting if Gemini includes it
        let cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsedQuestions = JSON.parse(cleanedText);

            const formattedQuestions = [];
            for (const q of parsedQuestions) {
                const hasOptions = q.options && Array.isArray(q.options) && q.options.length > 0;

                const [dbResult] = await pool.execute(
                    'INSERT INTO interview_questions (domain, question, ideal_answer) VALUES (?, ?, ?)',
                    [`AI: ${domain}`, q.question, q.ideal_answer]
                );

                formattedQuestions.push({
                    question_id: dbResult.insertId,
                    domain: `AI: ${domain}`,
                    question: q.question,
                    ideal_answer: q.ideal_answer,
                    options: hasOptions ? q.options : [],
                    isAiGenerated: true,
                    isMultipleChoice: hasOptions
                });
            }

            res.json(formattedQuestions);
        } catch (parseError) {
            console.error("Failed to parse Gemini JSON:", cleanedText);
            res.status(500).json({ message: 'Failed to process AI response format' });
        }

    } catch (error) {
        console.error('Gemini API Error (Questions):', error);
        const isTemporaryFailure = isRetryableAiError(error);
        res.status(isTemporaryFailure ? 503 : 500).json({
            message: isTemporaryFailure
                ? 'AI service is temporarily busy. Please try again in a moment.'
                : 'Error generating questions from AI',
            error: error.message
        });
    }
};

// @desc    Convert a DB question into MCQ options using Gemini
// @route   POST /api/ai/db-mcq
// @access  Private
export const generateDbQuestionMcq = async (req, res) => {
    try {
        const { question_id } = req.body;

        if (!question_id) {
            return res.status(400).json({ message: 'question_id is required' });
        }

        const [rows] = await pool.execute(
            'SELECT question_id, domain, question, ideal_answer FROM interview_questions WHERE question_id = ?',
            [question_id]
        );

        if (!rows.length) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const dbQuestion = rows[0];
        const prompt = `You are creating MCQ options for an interview question.

Question: "${dbQuestion.question}"
Correct answer: "${dbQuestion.ideal_answer}"

Return STRICTLY a valid JSON object with only:
{
  "options": ["option 1", "option 2", "option 3", "option 4"]
}

Rules:
- Exactly 4 options.
- Exactly one option must be the correct answer or a concise equivalent of the correct answer.
- Distractors must be plausible and clearly distinct.
- Do not include markdown code fences or extra text.`;

        const responseText = await generateContentWithRetry(prompt);
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsed = JSON.parse(cleanedText);
            const options = Array.isArray(parsed?.options)
                ? parsed.options.filter((opt) => typeof opt === 'string' && opt.trim()).slice(0, 4)
                : [];

            if (options.length !== 4) {
                return res.status(500).json({ message: 'Failed to generate valid MCQ options' });
            }

            res.json({
                question_id: dbQuestion.question_id,
                domain: dbQuestion.domain,
                question: dbQuestion.question,
                options,
                isMultipleChoice: true,
                isAiGenerated: false
            });
        } catch (parseError) {
            console.error('Failed to parse Gemini JSON (db-mcq):', cleanedText);
            res.status(500).json({ message: 'Failed to process AI response format' });
        }
    } catch (error) {
        console.error('Gemini API Error (DB MCQ):', error);
        const isTemporaryFailure = isRetryableAiError(error);
        res.status(isTemporaryFailure ? 503 : 500).json({
            message: isTemporaryFailure
                ? 'AI service is temporarily busy. Please try again in a moment.'
                : 'Error generating MCQ options from DB question',
            error: error.message
        });
    }
};

// @desc    Generate learning resources using Gemini API
// @route   POST /api/ai/resources
// @access  Private
export const generateResources = async (req, res) => {
    try {
        const { topic } = req.body;

        if (!topic) {
            return res.status(400).json({ message: 'Topic is required' });
        }

        const prompt = `You are a helpful software engineering mentor. Provide learning resources for a student who wants to improve in the topic: "${topic}".
        
        Provide a list of 3-5 high-quality learning resources (like official documentation, popular tutorials, YouTube channels, or key concepts to Google). 
        
        Return the response STRICTLY as a valid JSON array of objects. Each object must have a "title" property (string), a "type" property (e.g., "Video", "Documentation", "Article", "Course"), and a "description" property (string) explaining why it's useful. Do not include markdown formatting like \`\`\`json.`;

        const responseText = await generateContentWithRetry(prompt);

        // Clean up markdown formatting if Gemini includes it
        let cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsedResources = JSON.parse(cleanedText);
            res.json(parsedResources);
        } catch (parseError) {
            console.error("Failed to parse Gemini JSON:", cleanedText);
            res.status(500).json({ message: 'Failed to process AI response format' });
        }

    } catch (error) {
        console.error('Gemini API Error (Resources):', error);
        const isTemporaryFailure = isRetryableAiError(error);
        res.status(isTemporaryFailure ? 503 : 500).json({
            message: isTemporaryFailure
                ? 'AI service is temporarily busy. Please try again in a moment.'
                : 'Error fetching resources from AI',
            error: error.message
        });
    }
};

// @desc    Chat with Gemini assistant
// @route   POST /api/ai/chatbot
// @access  Private
export const generateChatbotReply = async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const safeHistory = Array.isArray(history)
            ? history
                .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
                .slice(-12)
            : [];

        const conversation = safeHistory
            .map((item) => `${item.role === 'assistant' ? 'Assistant' : 'User'}: ${item.content}`)
            .join('\n');

        const prompt = `You are UniConnect's Gemini assistant for students.
Be concise, practical, and accurate. Use plain text.

Conversation so far:
${conversation || 'No previous messages.'}

User: ${message}
Assistant:`;

        const reply = await generateContentWithRetry(prompt);

        res.json({
            reply: (reply || '').trim()
        });
    } catch (error) {
        console.error('Gemini API Error (Chatbot):', error);
        const isTemporaryFailure = isRetryableAiError(error);
        res.status(isTemporaryFailure ? 503 : 500).json({
            message: isTemporaryFailure
                ? 'AI service is temporarily busy. Please try again in a moment.'
                : 'Error generating chatbot reply',
            error: error.message
        });
    }
};
