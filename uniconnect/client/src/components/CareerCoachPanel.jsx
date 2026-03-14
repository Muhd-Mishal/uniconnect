import { useState } from 'react';
import { Bot, BriefcaseBusiness, CheckCircle2, Gauge, Sparkles, Target } from 'lucide-react';
import SurfaceCard from './SurfaceCard';
import { aiService } from '../utils/api';

const ROLE_OPTIONS = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'UI UX Designer',
    'Data Analyst',
    'Machine Learning Engineer',
    'DevOps Engineer',
    'Product Manager',
];

function CareerCoachPanel() {
    const [selectedRoles, setSelectedRoles] = useState(['Frontend Developer', 'Full Stack Developer']);
    const [resumeText, setResumeText] = useState('');
    const [resumeFile, setResumeFile] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const toggleRole = (role) => {
        setSelectedRoles((current) => (
            current.includes(role)
                ? current.filter((item) => item !== role)
                : [...current, role]
        ));
    };

    const handleAnalyze = async (event) => {
        event.preventDefault();
        if (!selectedRoles.length) {
            setError('Select at least one target role.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('target_job_titles', JSON.stringify(selectedRoles));
            formData.append('resume_text', resumeText);
            if (resumeFile) {
                formData.append('resume_file', resumeFile);
            }

            const { data } = await aiService.generateCareerCoach(formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAnalysis(data);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Failed to generate AI career coach analysis.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <SurfaceCard>
                <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white">
                        <Bot size={22} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-slate-950">AI Career Coach</h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                            Analyze your current profile, portfolio, and optional pasted resume text against target job roles.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleAnalyze} className="mt-6 space-y-5">
                    <div>
                        <div className="mb-3 text-sm font-semibold text-slate-900">Target roles</div>
                        <div className="flex flex-wrap gap-2">
                            {ROLE_OPTIONS.map((role) => {
                                const active = selectedRoles.includes(role);
                                return (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => toggleRole(role)}
                                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active
                                            ? 'bg-slate-950 text-white'
                                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                            }`}
                                    >
                                        {role}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-900">Optional pasted resume text</span>
                        <textarea
                            rows="6"
                            value={resumeText}
                            onChange={(event) => setResumeText(event.target.value)}
                            placeholder="Paste resume text here if you want the AI coach to analyze more than your profile and portfolio content."
                            className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-900">Optional resume file</span>
                        <input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        />
                        <div className="mt-2 text-xs text-slate-400">
                            If you do not upload a file, the coach will try to use the resume already saved on your profile.
                        </div>
                    </label>

                    <button
                        type="submit"
                        disabled={loading || !selectedRoles.length}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
                    >
                        <Sparkles size={16} />
                        {loading ? 'Analyzing...' : 'Run career coach'}
                    </button>

                    {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
                </form>
            </SurfaceCard>

            {analysis && (
                <>
                    <SurfaceCard className="border-sky-200 bg-sky-50/60">
                        <div className="text-sm text-sky-800">
                            Resume analysis source: <span className="font-semibold">{analysis.resume_text_source || 'unknown'}</span>
                        </div>
                    </SurfaceCard>

                    <div className="grid gap-5 md:grid-cols-3">
                        <SurfaceCard>
                            <div className="flex items-center gap-3">
                                <Gauge size={18} className="text-slate-700" />
                                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Resume score</div>
                            </div>
                            <div className="mt-4 text-4xl font-bold text-slate-950">{analysis.resume_score ?? 0}</div>
                        </SurfaceCard>

                        <SurfaceCard>
                            <div className="flex items-center gap-3">
                                <Target size={18} className="text-slate-700" />
                                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Skills found</div>
                            </div>
                            <div className="mt-4 text-4xl font-bold text-slate-950">{analysis.skills?.length || 0}</div>
                        </SurfaceCard>

                        <SurfaceCard>
                            <div className="flex items-center gap-3">
                                <BriefcaseBusiness size={18} className="text-slate-700" />
                                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Roles checked</div>
                            </div>
                            <div className="mt-4 text-4xl font-bold text-slate-950">{analysis.job_matches?.length || 0}</div>
                        </SurfaceCard>
                    </div>

                    {analysis.unsupported_roles?.length > 0 && (
                        <SurfaceCard className="border-amber-200 bg-amber-50/70">
                            <div className="text-sm text-amber-800">
                                These roles were not in the built-in benchmark list, so the AI used your requested roles without detailed benchmark data:
                                {' '}
                                {analysis.unsupported_roles.join(', ')}
                            </div>
                        </SurfaceCard>
                    )}

                    <SurfaceCard>
                        <h3 className="text-xl font-semibold text-slate-950">Job fit dashboard</h3>
                        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {(analysis.job_matches || []).map((match) => (
                                <div key={match.job_title} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="text-base font-semibold text-slate-950">{match.job_title}</div>
                                        <div className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-900">
                                            {match.match_percentage}%
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Missing skills</div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {(match.missing_skills || []).length ? match.missing_skills.map((skill) => (
                                            <span key={skill} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700">{skill}</span>
                                        )) : <span className="text-sm text-emerald-600">No major skill gaps found</span>}
                                    </div>
                                    <div className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Missing keywords</div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {(match.missing_keywords || []).length ? match.missing_keywords.map((keyword) => (
                                            <span key={keyword} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">{keyword}</span>
                                        )) : <span className="text-sm text-emerald-600">Keyword coverage looks good</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SurfaceCard>

                    <div className="grid gap-6 xl:grid-cols-2">
                        <SurfaceCard>
                            <h3 className="text-xl font-semibold text-slate-950">Improvement plan</h3>
                            <div className="mt-5 space-y-3">
                                {(analysis.improvements || []).map((item, index) => (
                                    <div key={`${index}-${item}`} className="flex gap-3 rounded-[22px] bg-slate-50 px-4 py-4">
                                        <CheckCircle2 size={18} className="mt-1 shrink-0 text-slate-700" />
                                        <div className="text-sm leading-6 text-slate-600">{item}</div>
                                    </div>
                                ))}
                            </div>
                        </SurfaceCard>

                        <SurfaceCard>
                            <h3 className="text-xl font-semibold text-slate-950">Skill gap roadmap</h3>
                            <div className="mt-5 space-y-3">
                                {(analysis.skill_gap_roadmap || []).map((item) => (
                                    <div key={`${item.skill}-${item.priority}`} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="text-base font-semibold text-slate-950">{item.skill}</div>
                                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{item.priority} priority</span>
                                            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">{item.estimated_effort}</span>
                                        </div>
                                        <div className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</div>
                                    </div>
                                ))}
                            </div>
                        </SurfaceCard>
                    </div>

                    <SurfaceCard>
                        <h3 className="text-xl font-semibold text-slate-950">Suggested career tracks</h3>
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {(analysis.suggested_career_tracks || []).map((track) => (
                                <div key={track.track_title} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                                    <div className="text-lg font-semibold text-slate-950">{track.track_title}</div>
                                    <div className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                        {track.entry_barrier} barrier
                                    </div>
                                    <p className="mt-4 text-sm leading-6 text-slate-600">{track.reasoning}</p>
                                </div>
                            ))}
                        </div>
                    </SurfaceCard>
                </>
            )}
        </div>
    );
}

export default CareerCoachPanel;
