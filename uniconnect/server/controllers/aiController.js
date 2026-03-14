import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from '../config/db.js';
import { CAREER_ROLE_BENCHMARKS, findBenchmarksForRoles } from '../data/careerRoleBenchmarks.js';
import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

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

const cleanJsonText = (value = '') => value.replace(/```json/g, '').replace(/```/g, '').trim();

const resolveUploadPath = (resumePath = '') => {
    const normalized = String(resumePath).replace(/^\/+/, '').replace(/\//g, path.sep);
    return path.resolve(process.cwd(), normalized);
};

const extractResumeTextFromBuffer = async (fileName, buffer) => {
    const extension = path.extname(fileName).toLowerCase();

    if (extension === '.pdf') {
        const parsed = await pdfParse(buffer);
        return parsed.text?.trim() || '';
    }

    if (extension === '.docx') {
        const parsed = await mammoth.extractRawText({ buffer });
        return parsed.value?.trim() || '';
    }

    if (extension === '.txt') {
        return buffer.toString('utf8').trim();
    }

    return '';
};

const extractResumeTextFromStoredPath = async (resumePath) => {
    if (!resumePath) return '';

    try {
        const absolutePath = resolveUploadPath(resumePath);
        const buffer = await fs.readFile(absolutePath);
        return extractResumeTextFromBuffer(absolutePath, buffer);
    } catch (error) {
        console.error('Failed to extract stored resume text:', error.message);
        return '';
    }
};

const buildCareerCoachCandidateText = async (userId, supplementalResumeText = '', extractedResumeText = '') => {
    const [profiles] = await pool.execute(
        `SELECT u.username, u.email, sp.department, sp.year, sp.skills, sp.career_interest, sp.resume AS profile_resume, p.bio, p.skills AS portfolio_skills, p.resume AS portfolio_resume
         FROM users u
         LEFT JOIN student_profile sp ON sp.user_id = u.user_id
         LEFT JOIN portfolios p ON p.user_id = u.user_id
         WHERE u.user_id = ?`,
        [userId]
    );

    const [projects] = await pool.execute(
        `SELECT pp.title, pp.description, pp.github_url, pp.live_demo_url
         FROM portfolio_projects pp
         INNER JOIN portfolios p ON p.portfolio_id = pp.portfolio_id
         WHERE p.user_id = ?
         ORDER BY pp.uploaded_at DESC`,
        [userId]
    );

    const profile = profiles[0] || {};
    const projectSummary = projects.length
        ? projects.map((project, index) => `${index + 1}. ${project.title}: ${project.description}`).join('\n')
        : 'No portfolio projects added yet.';

    return `
Candidate Name: ${profile.username || 'Unknown'}
Email: ${profile.email || 'Unknown'}
Department: ${profile.department || 'Not specified'}
Year: ${profile.year || 'Not specified'}
Student Skills: ${profile.skills || 'None listed'}
Career Interest: ${profile.career_interest || 'Not specified'}
Portfolio Bio: ${profile.bio || 'Not provided'}
Portfolio Skills: ${profile.portfolio_skills || 'Not provided'}
Projects:
${projectSummary}

Resume Text:
${[supplementalResumeText, extractedResumeText].filter(Boolean).join('\n\n') || 'No additional resume text supplied. Base the analysis on the profile and portfolio details above.'}
    `.trim();
};

const safeParseJsonObject = (text) => {
    const parsed = JSON.parse(cleanJsonText(text));
    return parsed && typeof parsed === 'object' ? parsed : null;
};

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const includesPhrase = (text = '', phrase = '') => {
    if (!text || !phrase) return false;
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(String(phrase).toLowerCase())}([^a-z0-9]|$)`, 'i').test(text);
};

const uniqueStrings = (items = []) => [...new Set(items.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const buildLocalCareerCoachAnalysis = (requestedRoles, benchmarkRoles, candidateText, missingBenchmarks, resumeTextSource) => {
    const normalizedText = String(candidateText || '').toLowerCase();
    const benchmarkPool = benchmarkRoles.length ? benchmarkRoles : CAREER_ROLE_BENCHMARKS.filter((benchmark) =>
        requestedRoles.some((role) => benchmark.job_title.toLowerCase() === String(role).toLowerCase())
    );

    const detectedSkills = uniqueStrings(
        CAREER_ROLE_BENCHMARKS.flatMap((benchmark) => benchmark.essential_skills)
            .filter((skill) => includesPhrase(normalizedText, skill))
    );

    const detectedKeywords = uniqueStrings(
        CAREER_ROLE_BENCHMARKS.flatMap((benchmark) => benchmark.ats_keywords)
            .filter((keyword) => includesPhrase(normalizedText, keyword))
    );

    const jobMatches = requestedRoles.map((role) => {
        const benchmark = benchmarkPool.find((item) => item.job_title.toLowerCase() === String(role).toLowerCase());

        if (!benchmark) {
            return {
                job_title: role,
                match_percentage: clamp(35 + detectedSkills.length * 3, 35, 72),
                missing_skills: [],
                missing_keywords: [],
            };
        }

        const matchedSkills = benchmark.essential_skills.filter((skill) => includesPhrase(normalizedText, skill));
        const matchedKeywords = benchmark.ats_keywords.filter((keyword) => includesPhrase(normalizedText, keyword));
        const skillCoverage = benchmark.essential_skills.length
            ? matchedSkills.length / benchmark.essential_skills.length
            : 0;
        const keywordCoverage = benchmark.ats_keywords.length
            ? matchedKeywords.length / benchmark.ats_keywords.length
            : 0;

        return {
            job_title: benchmark.job_title,
            match_percentage: clamp(Math.round(skillCoverage * 70 + keywordCoverage * 30), 18, 100),
            missing_skills: benchmark.essential_skills.filter((skill) => !matchedSkills.includes(skill)),
            missing_keywords: benchmark.ats_keywords.filter((keyword) => !matchedKeywords.includes(keyword)),
        };
    }).sort((a, b) => b.match_percentage - a.match_percentage);

    const prioritizedMissingSkills = uniqueStrings(
        jobMatches
            .flatMap((match, index) => match.missing_skills.map((skill) => ({
                skill,
                weight: Math.max(1, 4 - index),
            })))
            .sort((a, b) => b.weight - a.weight)
            .map((item) => item.skill)
    );

    const improvements = [
        !normalizedText.includes('project') ? 'Add project-focused bullet points with outcomes, tools used, and measurable impact.' : null,
        prioritizedMissingSkills[0] ? `Prioritize adding evidence for ${prioritizedMissingSkills[0]} through one strong portfolio project.` : null,
        prioritizedMissingSkills[1] ? `Add ATS-friendly keywords such as "${prioritizedMissingSkills[1]}" directly in your profile, resume, or project descriptions.` : null,
        detectedSkills.length < 5 ? 'List more concrete technical skills and frameworks instead of keeping the profile too general.' : null,
        resumeTextSource === 'profile_and_portfolio_only' ? 'Upload or paste resume content so the coach can analyze your full experience instead of profile fields only.' : null,
        'Quantify results wherever possible, such as users served, performance gains, or completion percentages.',
        'Tailor the summary and project descriptions toward your top target role instead of using a generic profile.',
    ].filter(Boolean).slice(0, 7);

    const skill_gap_roadmap = prioritizedMissingSkills.slice(0, 5).map((skill, index) => ({
        skill,
        priority: index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low',
        estimated_effort: index < 2 ? 'Medium' : 'Short',
        reason: `This skill appears repeatedly in your target role benchmarks and would improve portfolio fit quickly.`,
    }));

    const suggested_career_tracks = CAREER_ROLE_BENCHMARKS
        .filter((benchmark) => !requestedRoles.some((role) => benchmark.job_title.toLowerCase() === String(role).toLowerCase()))
        .map((benchmark) => {
            const overlap = benchmark.essential_skills.filter((skill) => includesPhrase(normalizedText, skill)).length;
            return { benchmark, overlap };
        })
        .sort((a, b) => b.overlap - a.overlap)
        .slice(0, 3)
        .map(({ benchmark, overlap }) => ({
            track_title: benchmark.job_title,
            reasoning: overlap > 0
                ? `Your current profile already shows overlap with ${overlap} core skill areas for this track.`
                : 'Your portfolio suggests adjacent potential here even though the evidence is still early.',
            entry_barrier: overlap >= 3 ? 'Low' : overlap >= 1 ? 'Medium' : 'High',
        }));

    const resumeScoreBase = 38 + detectedSkills.length * 4 + detectedKeywords.length * 2 + jobMatches[0]?.match_percentage * 0.25;
    const resume_score = clamp(Math.round(resumeScoreBase), 25, 96);

    return {
        skills: detectedSkills,
        keywords: detectedKeywords,
        resume_score,
        job_matches: jobMatches,
        improvements,
        suggested_career_tracks,
        skill_gap_roadmap,
        benchmark_roles_used: benchmarkRoles.map((role) => role.job_title),
        unsupported_roles: missingBenchmarks,
        resume_text_source: resumeTextSource,
        analysis_mode: 'local_fallback',
    };
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

// @desc    Analyze student profile/resume for career coaching
// @route   POST /api/ai/career-coach
// @access  Private
export const generateCareerCoachAnalysis = async (req, res) => {
    try {
        const rawRoles = req.body.target_job_titles;
        const requestedRoles = Array.isArray(rawRoles)
            ? rawRoles
            : typeof rawRoles === 'string'
                ? (() => {
                    try {
                        const parsed = JSON.parse(rawRoles);
                        return Array.isArray(parsed) ? parsed : [rawRoles];
                    } catch {
                        return rawRoles.split(',').map((item) => item.trim()).filter(Boolean);
                    }
                })()
                : [];

        if (!requestedRoles.length) {
            return res.status(400).json({ message: 'At least one target job title is required' });
        }

        const benchmarkRoles = findBenchmarksForRoles(requestedRoles);
        const missingBenchmarks = requestedRoles.filter((role) =>
            !benchmarkRoles.some((benchmark) => benchmark.job_title.toLowerCase() === role.toLowerCase())
        );

        const additionalBenchmarks = CAREER_ROLE_BENCHMARKS.filter((benchmark) =>
            !benchmarkRoles.some((selected) => selected.job_title === benchmark.job_title)
        ).slice(0, 4);

        const [resumeRows] = await pool.execute(
            `SELECT sp.resume AS profile_resume, p.resume AS portfolio_resume
             FROM users u
             LEFT JOIN student_profile sp ON sp.user_id = u.user_id
             LEFT JOIN portfolios p ON p.user_id = u.user_id
             WHERE u.user_id = ?`,
            [req.user.user_id]
        );

        let extractedResumeText = '';

        if (req.file?.buffer) {
            extractedResumeText = await extractResumeTextFromBuffer(req.file.originalname, req.file.buffer);
        } else if (resumeRows[0]?.portfolio_resume || resumeRows[0]?.profile_resume) {
            extractedResumeText = await extractResumeTextFromStoredPath(
                resumeRows[0].portfolio_resume || resumeRows[0].profile_resume
            );
        }

        const resumeTextSource = req.file?.originalname
            ? 'uploaded_file'
            : extractedResumeText
                ? 'stored_resume'
                : req.body.resume_text
                    ? 'pasted_text'
                    : 'profile_and_portfolio_only';

        const candidateText = await buildCareerCoachCandidateText(req.user.user_id, req.body.resume_text || '', extractedResumeText);

        if (!process.env.GEMINI_API_KEY) {
            return res.json(
                buildLocalCareerCoachAnalysis(
                    requestedRoles,
                    benchmarkRoles,
                    candidateText,
                    missingBenchmarks,
                    resumeTextSource
                )
            );
        }

        const prompt = `You are a Senior Career Coach and ATS (Applicant Tracking System) Expert with knowledge of the 2025-2026 job market. Your goal is to provide a brutal but constructive analysis of a candidate's resume against specific target roles.

### INPUT DATA:
1. TARGET_JOB_TITLES: ${JSON.stringify(requestedRoles)}
2. ROLE_BENCHMARKS: ${JSON.stringify(benchmarkRoles)}
3. RELATED_ROLE_POOL: ${JSON.stringify(additionalBenchmarks)}
4. RESUME_TEXT: ${candidateText}

### YOUR TASKS:
1. SKILL EXTRACTION: Identify all technical and soft skills present in the resume text.
2. ATS BENCHMARKING: Extract key ATS keywords found in the resume text.
3. ADAPTIVE SCORING: Provide a general resume score (0-100) based on professional standards.
4. JOB MATCHING: For each role in TARGET_JOB_TITLES, calculate a match percentage (0-100) and identify specific missing_skills and missing_keywords using ROLE_BENCHMARKS.
5. ACTIONABLE IMPROVEMENTS: Provide 5-7 specific, high-impact resume or portfolio improvements.
6. CAREER TRACKS: Identify 3 additional career paths the candidate is qualified for.
7. SKILL GAP ROADMAP: Provide 3-6 prioritized roadmap items with skill, priority, estimated_effort, and reason.

### OUTPUT REQUIREMENTS:
Return ONLY a valid JSON object. No markdown, no preamble, no extra text.

### RESPONSE SCHEMA:
{
  "skills": ["string"],
  "keywords": ["string"],
  "resume_score": integer,
  "job_matches": [
    {
      "job_title": "string",
      "match_percentage": integer,
      "missing_skills": ["string"],
      "missing_keywords": ["string"]
    }
  ],
  "improvements": ["string"],
  "suggested_career_tracks": [
    {
      "track_title": "string",
      "reasoning": "string",
      "entry_barrier": "Low/Medium/High"
    }
  ],
  "skill_gap_roadmap": [
    {
      "skill": "string",
      "priority": "High/Medium/Low",
      "estimated_effort": "Short/Medium/Long",
      "reason": "string"
    }
  ]
}`;

        const responseText = await generateContentWithRetry(prompt);
        const parsed = safeParseJsonObject(responseText);

        if (!parsed) {
            return res.json(
                buildLocalCareerCoachAnalysis(
                    requestedRoles,
                    benchmarkRoles,
                    candidateText,
                    missingBenchmarks,
                    resumeTextSource
                )
            );
        }

        res.json({
            ...parsed,
            benchmark_roles_used: benchmarkRoles.map((role) => role.job_title),
            unsupported_roles: missingBenchmarks,
            resume_text_source: resumeTextSource,
            analysis_mode: 'gemini',
        });
    } catch (error) {
        console.error('Gemini API Error (Career Coach):', error);
        try {
            const rawRoles = req.body.target_job_titles;
            const requestedRoles = Array.isArray(rawRoles)
                ? rawRoles
                : typeof rawRoles === 'string'
                    ? (() => {
                        try {
                            const parsed = JSON.parse(rawRoles);
                            return Array.isArray(parsed) ? parsed : [rawRoles];
                        } catch {
                            return rawRoles.split(',').map((item) => item.trim()).filter(Boolean);
                        }
                    })()
                    : [];
            const benchmarkRoles = findBenchmarksForRoles(requestedRoles);
            const missingBenchmarks = requestedRoles.filter((role) =>
                !benchmarkRoles.some((benchmark) => benchmark.job_title.toLowerCase() === role.toLowerCase())
            );
            const [resumeRows] = await pool.execute(
                `SELECT sp.resume AS profile_resume, p.resume AS portfolio_resume
                 FROM users u
                 LEFT JOIN student_profile sp ON sp.user_id = u.user_id
                 LEFT JOIN portfolios p ON p.user_id = u.user_id
                 WHERE u.user_id = ?`,
                [req.user.user_id]
            );

            let extractedResumeText = '';
            if (req.file?.buffer) {
                extractedResumeText = await extractResumeTextFromBuffer(req.file.originalname, req.file.buffer);
            } else if (resumeRows[0]?.portfolio_resume || resumeRows[0]?.profile_resume) {
                extractedResumeText = await extractResumeTextFromStoredPath(
                    resumeRows[0].portfolio_resume || resumeRows[0].profile_resume
                );
            }

            const resumeTextSource = req.file?.originalname
                ? 'uploaded_file'
                : extractedResumeText
                    ? 'stored_resume'
                    : req.body.resume_text
                        ? 'pasted_text'
                        : 'profile_and_portfolio_only';

            const candidateText = await buildCareerCoachCandidateText(req.user.user_id, req.body.resume_text || '', extractedResumeText);

            return res.json(
                buildLocalCareerCoachAnalysis(
                    requestedRoles,
                    benchmarkRoles,
                    candidateText,
                    missingBenchmarks,
                    resumeTextSource
                )
            );
        } catch (fallbackError) {
            console.error('Career coach fallback failed:', fallbackError);
            const isTemporaryFailure = isRetryableAiError(error);
            res.status(isTemporaryFailure ? 503 : 500).json({
                message: isTemporaryFailure
                    ? 'AI service is temporarily busy. Please try again in a moment.'
                    : 'Error generating AI career coach analysis',
                error: error.message
            });
        }
    }
};
