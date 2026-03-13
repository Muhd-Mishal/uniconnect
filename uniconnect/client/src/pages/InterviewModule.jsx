
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { aiService } from '../utils/api';
import { Network, BrainCircuit, RefreshCw, Send, CheckCircle2, AlertCircle, Database, Sparkles, ListChecks, FileText, Layers3, ClipboardCheck } from 'lucide-react';
import PageHero from '../components/PageHero';
import SurfaceCard from '../components/SurfaceCard';

const mcqSetPresets = [
    {
        id: 'aptitude_25',
        label: '25 Aptitude',
        topic: 'Aptitude',
        difficulty: 'intermediate',
        count: 25,
        description: 'Quantitative aptitude round with 25 MCQ questions.',
    },
    {
        id: 'logical_25',
        label: '25 Logical',
        topic: 'Logical Reasoning',
        difficulty: 'intermediate',
        count: 25,
        description: 'Logical reasoning round with 25 MCQ questions.',
    },
    {
        id: 'mixed_20',
        label: '20 Mixed',
        topic: 'Aptitude and Logical Reasoning',
        difficulty: 'intermediate',
        count: 20,
        description: 'Combined aptitude and logical screening set.',
    },
];

function InterviewModule() {
    const [questionSource, setQuestionSource] = useState('db');
    const [questionType, setQuestionType] = useState('normal');
    const [sessionMode, setSessionMode] = useState('practice');

    const [domains, setDomains] = useState([]);
    const [selectedDomain, setSelectedDomain] = useState('');

    const [geminiTopic, setGeminiTopic] = useState('Java');
    const [geminiDifficulty, setGeminiDifficulty] = useState('intermediate');
    const [geminiCount, setGeminiCount] = useState(5);
    const [selectedPreset, setSelectedPreset] = useState('');
    const [testQuestionCount, setTestQuestionCount] = useState(5);

    const [questionList, setQuestionList] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const question = questionList[currentQuestionIndex] || null;

    const [answer, setAnswer] = useState('');
    const [result, setResult] = useState(null);
    const [testEvaluations, setTestEvaluations] = useState([]);
    const [testSummary, setTestSummary] = useState(null);

    const [loadingDomains, setLoadingDomains] = useState(true);
    const [loadingQuestion, setLoadingQuestion] = useState(false);
    const [evaluating, setEvaluating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDomains();
    }, []);

    useEffect(() => {
        resetSession();
    }, [questionSource, questionType, sessionMode]);

    const fetchDomains = async () => {
        try {
            const { data } = await api.get('/interviews/domains');
            setDomains(data);
            if (data.length > 0) {
                setSelectedDomain(data[0]);
                if (!geminiTopic.trim()) {
                    setGeminiTopic(data[0]);
                }
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch domains');
        } finally {
            setLoadingDomains(false);
        }
    };

    const resetSession = () => {
        setQuestionList([]);
        setCurrentQuestionIndex(0);
        setAnswer('');
        setResult(null);
        setTestEvaluations([]);
        setTestSummary(null);
        setError('');
    };

    const selectPreset = (preset) => {
        setSelectedPreset(preset.id);
        setGeminiTopic(preset.topic);
        setGeminiDifficulty(preset.difficulty);
        setGeminiCount(preset.count);
    };

    const fetchDbQuestions = async (count, asMcq) => {
        const questions = [];

        for (let index = 0; index < count; index += 1) {
            const { data: dbQuestion } = await api.get(`/interviews/question/${selectedDomain}`);

            if (!asMcq) {
                questions.push({
                    ...dbQuestion,
                    source: 'db',
                    isMultipleChoice: false,
                    options: [],
                });
                continue;
            }

            const { data: mcqQuestion } = await aiService.generateDbMcq(dbQuestion.question_id);
            questions.push({
                question_id: mcqQuestion.question_id,
                question: mcqQuestion.question,
                options: mcqQuestion.options || [],
                source: 'db',
                isMultipleChoice: true,
            });
        }

        return questions;
    };

    const startDbQuestions = async () => {
        if (!selectedDomain) {
            setError('Please select a database domain.');
            return;
        }

        const count = sessionMode === 'test' ? testQuestionCount : 1;
        const asMcq = questionType === 'mcq';
        const loaded = await fetchDbQuestions(count, asMcq);

        if (!loaded.length) {
            setError('No database questions were loaded.');
            return;
        }

        setQuestionList(loaded);
    };

    const startGeminiQuestions = async () => {
        const topic = geminiTopic.trim();
        if (!topic) {
            setError('Please enter a Gemini topic.');
            return;
        }

        const format = questionType === 'mcq' ? 'mcq' : 'normal';
        const count = sessionMode === 'test' ? testQuestionCount : geminiCount;
        const { data } = await aiService.generateQuestions(topic, geminiDifficulty, count, format);

        const list = Array.isArray(data) ? data : [];
        if (!list.length) {
            setError('Gemini did not return questions. Try again.');
            return;
        }

        const normalized = list
            .map((item) => ({
                ...item,
                source: 'gemini',
                isMultipleChoice: questionType === 'mcq',
                options: questionType === 'mcq' ? (item.options || []) : [],
            }))
            .filter((item) => (questionType === 'mcq' ? item.options.length > 0 : true));

        if (!normalized.length) {
            setError(questionType === 'mcq' ? 'Gemini did not return valid MCQ options.' : 'Gemini did not return valid questions.');
            return;
        }

        setQuestionList(normalized);
    };
    const startInterview = async () => {
        setLoadingQuestion(true);
        setError('');
        setResult(null);
        setAnswer('');
        setQuestionList([]);
        setCurrentQuestionIndex(0);
        setTestEvaluations([]);
        setTestSummary(null);

        try {
            if (questionSource === 'db') {
                await startDbQuestions();
            } else {
                await startGeminiQuestions();
            }
        } catch (err) {
            console.error(err);
            setError('Could not load questions. Please try again.');
        } finally {
            setLoadingQuestion(false);
        }
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < questionList.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
            setAnswer('');
            setResult(null);
            return;
        }

        resetSession();
    };

    const evaluateCurrentAnswer = async (userAnswer) => {
        const { data } = await api.post('/interviews/evaluate', {
            question_id: question.question_id,
            user_answer: userAnswer,
        });
        return data;
    };

    const submitPracticeAnswer = async () => {
        if (!answer.trim() || !question) return;

        setEvaluating(true);
        setError('');

        try {
            const data = await evaluateCurrentAnswer(answer);
            setResult(data);
        } catch (err) {
            console.error(err);
            setError('Evaluation failed. The AI service might be down.');
        } finally {
            setEvaluating(false);
        }
    };

    const submitTestAnswer = async () => {
        if (!answer.trim() || !question) return;

        setEvaluating(true);
        setError('');

        try {
            const data = await evaluateCurrentAnswer(answer);
            const nextEvaluations = [
                ...testEvaluations,
                {
                    question_id: question.question_id,
                    score: data.score,
                    feedback: data.feedback,
                    user_answer: answer,
                },
            ];

            setTestEvaluations(nextEvaluations);

            if (currentQuestionIndex < questionList.length - 1) {
                setCurrentQuestionIndex((prev) => prev + 1);
                setAnswer('');
            } else {
                const totalScore = nextEvaluations.reduce((sum, item) => sum + item.score, 0);
                const averageScore = Math.round(totalScore / nextEvaluations.length);
                const passCount = nextEvaluations.filter((item) => item.score >= 50).length;

                setTestSummary({
                    totalQuestions: nextEvaluations.length,
                    averageScore,
                    passCount,
                });
            }
        } catch (err) {
            console.error(err);
            setError('Evaluation failed. The AI service might be down.');
        } finally {
            setEvaluating(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 75) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        if (score >= 50) return 'border-amber-200 bg-amber-50 text-amber-700';
        return 'border-rose-200 bg-rose-50 text-rose-700';
    };

    const sourceLabel = questionSource === 'db' ? 'Database' : 'Gemini';
    const typeLabel = questionType === 'mcq' ? 'MCQ' : 'Normal';
    const inProgress = question && (sessionMode === 'practice' ? !result : !testSummary);

    if (loadingDomains) {
        return <div className="py-10 text-center text-sm text-slate-500">Loading domains...</div>;
    }

    return (
        <div className="space-y-6">
            <PageHero
                eyebrow="Interviews"
                title="Practice and test with DB and Gemini questions"
                description="Use practice mode for instant feedback or test mode to complete a full set and see final score at the end."
                aside={
                    <Link
                        to="/interviews/dashboard"
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white"
                    >
                        <Network size={16} />
                        View dashboard
                    </Link>
                }
            />

            {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
                <SurfaceCard className="h-fit">
                    <h3 className="text-lg font-semibold text-slate-950">Interview setup</h3>

                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Session mode</label>
                            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                                <button
                                    type="button"
                                    onClick={() => setSessionMode('practice')}
                                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${sessionMode === 'practice' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}
                                >
                                    <BrainCircuit size={14} /> Practice
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSessionMode('test')}
                                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${sessionMode === 'test' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}
                                >
                                    <ClipboardCheck size={14} /> Test
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Question source</label>
                            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                                <button
                                    type="button"
                                    onClick={() => setQuestionSource('db')}
                                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${questionSource === 'db' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}
                                >
                                    <Database size={14} /> Database
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQuestionSource('gemini')}
                                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${questionSource === 'gemini' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}
                                >
                                    <Sparkles size={14} /> Gemini
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Question type</label>
                            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                                <button
                                    type="button"
                                    onClick={() => setQuestionType('normal')}
                                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${questionType === 'normal' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}
                                >
                                    <FileText size={14} /> Normal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQuestionType('mcq')}
                                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${questionType === 'mcq' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}
                                >
                                    <ListChecks size={14} /> MCQ
                                </button>
                            </div>
                        </div>

                        {sessionMode === 'test' && (
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Test question count</label>
                                <select
                                    className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/70"
                                    value={testQuestionCount}
                                    onChange={(e) => setTestQuestionCount(Number(e.target.value))}
                                    disabled={inProgress}
                                >
                                    <option value={3}>3 questions</option>
                                    <option value={5}>5 questions</option>
                                    <option value={10}>10 questions</option>
                                </select>
                            </div>
                        )}

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                            Current mode: <span className="font-semibold text-slate-800">{sessionMode} | {sourceLabel} + {typeLabel}</span>
                        </div>

                        {questionSource === 'db' ? (
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Select domain</label>
                                <select
                                    className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/70"
                                    value={selectedDomain}
                                    onChange={(e) => setSelectedDomain(e.target.value)}
                                    disabled={inProgress}
                                >
                                    {domains.map((domain) => (
                                        <option key={domain} value={domain}>{domain}</option>
                                    ))}
                                </select>
                                {questionType === 'mcq' && (
                                    <p className="mt-2 text-xs text-slate-500">
                                        DB MCQ mode uses a DB question and Gemini generates options.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {questionType === 'mcq' && (
                                    <div>
                                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <Layers3 size={16} />
                                            MCQ sets
                                        </div>
                                        <div className="space-y-2">
                                            {mcqSetPresets.map((preset) => (
                                                <button
                                                    key={preset.id}
                                                    type="button"
                                                    onClick={() => selectPreset(preset)}
                                                    disabled={inProgress}
                                                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                                                        selectedPreset === preset.id
                                                            ? 'border-slate-300 bg-slate-100 text-slate-950'
                                                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="text-sm font-semibold">{preset.label}</div>
                                                    <div className="mt-1 text-xs text-slate-500">{preset.description}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Topic</label>
                                    <input
                                        type="text"
                                        value={geminiTopic}
                                        onChange={(e) => {
                                            setGeminiTopic(e.target.value);
                                            setSelectedPreset('');
                                        }}
                                        disabled={inProgress}
                                        placeholder="e.g. React, Java, Aptitude"
                                        className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/70"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Difficulty</label>
                                    <select
                                        className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/70"
                                        value={geminiDifficulty}
                                        onChange={(e) => {
                                            setGeminiDifficulty(e.target.value);
                                            setSelectedPreset('');
                                        }}
                                        disabled={inProgress}
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                        <option value="expert">Expert</option>
                                    </select>
                                </div>

                                {sessionMode === 'practice' && (
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Question count</label>
                                        <select
                                            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/70"
                                            value={geminiCount}
                                            onChange={(e) => {
                                                setGeminiCount(Number(e.target.value));
                                                setSelectedPreset('');
                                            }}
                                            disabled={inProgress}
                                        >
                                            <option value={3}>3 questions</option>
                                            <option value={5}>5 questions</option>
                                            <option value={10}>10 questions</option>
                                            <option value={20}>20 questions</option>
                                            <option value={25}>25 questions</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={startInterview}
                            disabled={loadingQuestion || inProgress}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
                        >
                            {loadingQuestion ? <RefreshCw className="animate-spin" size={18} /> : (question ? 'Session running' : `Start ${sessionMode}`)}
                        </button>
                    </div>
                </SurfaceCard>

                <SurfaceCard className="min-h-[460px]">
                    {testSummary ? (
                        <div className="flex min-h-[400px] flex-col justify-center">
                            <div className={`rounded-[24px] border px-5 py-6 ${getScoreColor(testSummary.averageScore)}`}>
                                <div className="text-xs font-semibold uppercase tracking-[0.16em]">Test complete</div>
                                <div className="mt-2 text-3xl font-bold">Final Score: {testSummary.averageScore}%</div>
                                <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                                    <div className="rounded-2xl bg-white/70 px-4 py-3">
                                        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Total questions</div>
                                        <div className="text-xl font-semibold text-slate-900">{testSummary.totalQuestions}</div>
                                    </div>
                                    <div className="rounded-2xl bg-white/70 px-4 py-3">
                                        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Passed (&gt;=50)</div>
                                        <div className="text-xl font-semibold text-slate-900">{testSummary.passCount}</div>
                                    </div>
                                    <div className="rounded-2xl bg-white/70 px-4 py-3">
                                        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Source + Type</div>
                                        <div className="text-xl font-semibold text-slate-900">{sourceLabel} {typeLabel}</div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={resetSession}
                                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                            >
                                Start new test
                            </button>
                        </div>
                    ) : !question ? (
                        <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                            {questionType === 'mcq' ? <ListChecks size={64} className="mb-4 text-slate-300" /> : <BrainCircuit size={64} className="mb-4 text-slate-300" />}
                            <h3 className="text-xl font-semibold text-slate-900">Ready for {sessionMode} mode?</h3>
                            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                                Start from setup panel to load your question set.
                            </p>
                        </div>
                    ) : (
                        <div className="flex min-h-[400px] flex-col">
                            <div className="mb-6">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${question.source === 'gemini' ? 'bg-slate-100 text-slate-700' : 'bg-slate-950 text-white'}`}>
                                        {question.source === 'gemini' ? 'Gemini generated' : 'Database generated'}
                                    </span>
                                    <span className="inline-block rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                                        {questionType === 'mcq' ? 'MCQ' : 'Normal'}
                                    </span>
                                    <span className="inline-block rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                                        {sessionMode}
                                    </span>
                                </div>
                                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Question {currentQuestionIndex + 1} of {questionList.length}
                                </div>
                                {sessionMode === 'test' && (
                                    <div className="mt-1 text-xs text-slate-500">
                                        Answered: {testEvaluations.length} / {questionList.length}
                                    </div>
                                )}
                                <h2 className="mt-4 text-2xl font-semibold text-slate-950">{question.question}</h2>
                            </div>

                            <div className="mb-4 flex-1">
                                <label className="mb-2 block text-sm font-medium text-slate-700">Your answer</label>
                                {questionType === 'mcq' && question.isMultipleChoice ? (
                                    <div className="space-y-3">
                                        {(question.options || []).map((option, index) => (
                                            <label
                                                key={`${option}-${index}`}
                                                className={`flex cursor-pointer items-start gap-3 rounded-[20px] border px-4 py-4 transition ${
                                                    answer === option
                                                        ? 'border-slate-300 bg-slate-100'
                                                        : 'border-slate-200 bg-slate-50 hover:bg-white'
                                                } ${sessionMode === 'practice' && result ? 'pointer-events-none opacity-80' : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="mcq_answer"
                                                    value={option}
                                                    checked={answer === option}
                                                    onChange={(e) => setAnswer(e.target.value)}
                                                    disabled={(sessionMode === 'practice' && result) || evaluating}
                                                    className="mt-1"
                                                />
                                                <span className="text-sm text-slate-700">{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <textarea
                                        className="min-h-[220px] w-full rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70 disabled:text-slate-400"
                                        placeholder="Type your answer here..."
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        disabled={(sessionMode === 'practice' && result) || evaluating}
                                    />
                                )}
                            </div>

                            {sessionMode === 'practice' ? (
                                !result ? (
                                    <button
                                        onClick={submitPracticeAnswer}
                                        disabled={evaluating || !answer.trim()}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
                                    >
                                        {evaluating ? <><RefreshCw className="animate-spin" size={18} /> Evaluating...</> : <><Send size={18} /> Submit answer</>}
                                    </button>
                                ) : (
                                    <div className="space-y-4">
                                        <div className={`rounded-[24px] border px-5 py-4 ${getScoreColor(result.score)}`}>
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="flex items-center gap-3">
                                                    {result.score >= 50 ? <CheckCircle2 size={28} /> : <AlertCircle size={28} />}
                                                    <div>
                                                        <div className="text-xs font-semibold uppercase tracking-[0.16em]">AI evaluation</div>
                                                        <div className="text-2xl font-bold">{result.score}%</div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-semibold uppercase tracking-[0.16em]">Feedback</div>
                                                    <div className="text-lg font-semibold">{result.feedback}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={nextQuestion}
                                            className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                                        >
                                            {currentQuestionIndex < questionList.length - 1 ? 'Next question' : 'Finish session'}
                                        </button>
                                    </div>
                                )
                            ) : (
                                <button
                                    onClick={submitTestAnswer}
                                    disabled={evaluating || !answer.trim()}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
                                >
                                    {evaluating
                                        ? <><RefreshCw className="animate-spin" size={18} /> Checking...</>
                                        : <>{currentQuestionIndex < questionList.length - 1 ? 'Save & next question' : 'Finish test and show score'}</>}
                                </button>
                            )}
                        </div>
                    )}
                </SurfaceCard>
            </div>
        </div>
    );
}

export default InterviewModule;
