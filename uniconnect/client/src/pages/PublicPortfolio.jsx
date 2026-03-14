import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, FileText, Github, Globe, Mail, Sparkles } from 'lucide-react';
import api from '../utils/api';
import { API_ORIGIN } from '../utils/runtimeConfig';

const toAssetUrl = (path) => (path ? `${API_ORIGIN}${path}` : '');
const splitSkills = (skills) => (skills || '').split(',').map((skill) => skill.trim()).filter(Boolean);

function PublicPortfolio() {
    const { username } = useParams();
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadPortfolio = async () => {
            try {
                const { data } = await api.get(`/portfolio/public/${username}`);
                setPortfolio(data);
            } catch (requestError) {
                setError(requestError.response?.data?.message || 'Portfolio not found.');
            } finally {
                setLoading(false);
            }
        };

        loadPortfolio();
    }, [username]);

    const skills = useMemo(() => splitSkills(portfolio?.skills), [portfolio?.skills]);
    const projectCount = portfolio?.projects?.length || 0;

    if (loading) {
        return <div className="py-20 text-center text-sm text-slate-500">Loading portfolio...</div>;
    }

    if (error || !portfolio) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-20 text-center">
                <div className="rounded-[30px] border border-slate-200 bg-white px-8 py-16 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Portfolio</div>
                    <h1 className="mt-4 text-3xl font-semibold text-slate-950">This portfolio is unavailable</h1>
                    <p className="mt-3 text-sm leading-7 text-slate-500">{error || 'The requested portfolio could not be found.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f8fafc_35%,#f8fafc_100%)]">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
                    <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
                        <div className="bg-[linear-gradient(160deg,#0f172a_0%,#1e293b_55%,#334155_100%)] p-8 text-white">
                            <div className="overflow-hidden rounded-[28px] bg-white/10">
                                {portfolio.profile_image ? (
                                    <img src={toAssetUrl(portfolio.profile_image)} alt={portfolio.username} className="h-[280px] w-full object-cover" />
                                ) : (
                                    <div className="grid h-[280px] place-items-center text-6xl font-semibold text-white/80">
                                        {portfolio.username?.charAt(0)?.toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                                <Sparkles size={14} />
                                Public portfolio
                            </div>
                            <h1 className="mt-4 text-3xl font-semibold tracking-tight">{portfolio.username}</h1>
                            <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                                <Mail size={15} />
                                {portfolio.email}
                            </div>
                            {(portfolio.department || portfolio.year) && (
                                <div className="mt-2 text-sm text-slate-300">
                                    {[portfolio.department, portfolio.year ? `Year ${portfolio.year}` : null].filter(Boolean).join(' | ')}
                                </div>
                            )}
                            {portfolio.resume && (
                                <a href={toAssetUrl(portfolio.resume)} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">
                                    <FileText size={16} />
                                    View resume
                                </a>
                            )}
                        </div>

                        <div className="p-8 sm:p-10">
                            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">About</div>
                            <p className="mt-4 text-base leading-8 text-slate-600">
                                {portfolio.bio || 'This student has not added a portfolio bio yet.'}
                            </p>

                            {skills.length > 0 && (
                                <>
                                    <div className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Skills</div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {skills.map((skill) => (
                                            <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}

                            {portfolio.career_interest && (
                                <>
                                    <div className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Career interest</div>
                                    <p className="mt-3 text-sm leading-7 text-slate-600">{portfolio.career_interest}</p>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                <section className="mt-8">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Projects</div>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Selected work</h2>
                        </div>
                        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                            {projectCount} projects
                        </div>
                    </div>

                    <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {projectCount > 0 ? portfolio.projects.map((project) => (
                            <article key={project.project_id} className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                                <div className="grid h-48 place-items-center overflow-hidden bg-slate-100">
                                    {project.image ? (
                                        <img src={toAssetUrl(project.image)} alt={project.title} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="px-6 text-center text-sm text-slate-400">No project image uploaded</div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <div className="text-xl font-semibold text-slate-950">{project.title}</div>
                                    <div className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        Uploaded {new Date(project.uploaded_at).toLocaleDateString()}
                                    </div>
                                    <p className="mt-4 text-sm leading-7 text-slate-600">{project.description}</p>
                                    <div className="mt-5 flex flex-wrap gap-2">
                                        {project.github_url && (
                                            <a href={project.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                                                <Github size={15} />
                                                GitHub
                                            </a>
                                        )}
                                        {project.live_demo_url && (
                                            <a href={project.live_demo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                                                <Globe size={15} />
                                                Live demo
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </article>
                        )) : (
                            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                                No projects have been published yet.
                            </div>
                        )}
                    </div>
                </section>

                <footer className="mt-10 flex justify-center pb-10">
                    <a href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                        <ExternalLink size={15} />
                        Open UniConnect
                    </a>
                </footer>
            </div>
        </div>
    );
}

export default PublicPortfolio;
