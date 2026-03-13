import { useState, useEffect } from 'react';
import api, { aiService } from '../utils/api';
import { ExternalLink, BookOpen, Clock, Bot, RefreshCw } from 'lucide-react';
import PageHero from '../components/PageHero';
import SurfaceCard from '../components/SurfaceCard';

function CareerResources() {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiTopic, setAiTopic] = useState('');
    const [generatingAi, setGeneratingAi] = useState(false);
    const [aiResources, setAiResources] = useState([]);
    const [aiError, setAiError] = useState('');

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const { data } = await api.get('/resources');
            setResources(data);
        } catch (error) {
            console.error('Error fetching resources', error);
        } finally {
            setLoading(false);
        }
    };

    const generateAiResources = async (event) => {
        event.preventDefault();
        if (!aiTopic.trim()) return;

        setGeneratingAi(true);
        setAiError('');
        try {
            const { data } = await aiService.generateResources(aiTopic);
            setAiResources(data);
        } catch (error) {
            console.error(error);
            setAiError(error.response?.data?.message || 'Failed to generate resources from AI.');
        } finally {
            setGeneratingAi(false);
        }
    };

    if (loading) return <div className="py-10 text-center text-sm text-slate-500">Loading resources...</div>;

    return (
        <div className="space-y-6">
            <PageHero
                eyebrow="Resources"
                title="Career preparation in one place"
                description="Browse curated materials and generate AI-backed suggestions for a focused learning path."
            />

            <SurfaceCard>
                <div className="mb-5 flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-950">Ask AI for custom resources</h2>
                        <p className="text-sm text-slate-500">Generate topic-specific recommendations in seconds.</p>
                    </div>
                </div>

                <form onSubmit={generateAiResources} className="flex flex-col gap-3 lg:flex-row">
                    <input
                        type="text"
                        placeholder="e.g. React Native, System Design prep, Machine Learning"
                        className="flex-grow rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        disabled={generatingAi}
                    />
                    <button
                        type="submit"
                        disabled={generatingAi || !aiTopic.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
                    >
                        {generatingAi ? <RefreshCw className="animate-spin" size={18} /> : 'Generate'}
                    </button>
                </form>

                {aiError && <p className="mt-3 text-sm text-rose-600">{aiError}</p>}

                {aiResources.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                        {aiResources.map((res, idx) => (
                            <div key={idx} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                <div className="mb-2 flex items-start justify-between gap-2">
                                    <h4 className="font-semibold text-slate-950">{res.title}</h4>
                                    <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-600">{res.type}</span>
                                </div>
                                <p className="text-sm leading-6 text-slate-600">{res.description}</p>
                                <div className="mt-4 flex gap-4 text-sm font-medium">
                                    <a href={`https://www.google.com/search?q=${encodeURIComponent(res.title + ' ' + res.type)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-slate-900">
                                        Search <ExternalLink size={14} />
                                    </a>
                                    {res.type.toLowerCase().includes('video') && (
                                        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(res.title)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-slate-500">
                                            YouTube <ExternalLink size={14} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SurfaceCard>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {resources.length === 0 ? (
                    <SurfaceCard className="md:col-span-2 text-center text-slate-500">
                        No career resources are currently available.
                    </SurfaceCard>
                ) : (
                    resources.map((resource) => (
                        <SurfaceCard key={resource.resource_id} className="flex h-full flex-col">
                            <div className="flex-1">
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                    <BookOpen size={14} />
                                    Resource
                                </div>
                                <h2 className="text-xl font-semibold text-slate-950">{resource.title}</h2>
                                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                                    <Clock size={12} />
                                    Added {new Date(resource.created_at).toLocaleDateString()}
                                </div>
                                <p className="mt-4 text-sm leading-7 text-slate-600">{resource.description}</p>
                            </div>
                            <div className="mt-6 border-t border-slate-200 pt-4">
                                <a
                                    href={resource.link.startsWith('http') ? resource.link : `https://${resource.link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950"
                                >
                                    View resource <ExternalLink size={16} />
                                </a>
                            </div>
                        </SurfaceCard>
                    ))
                )}
            </div>
        </div>
    );
}

export default CareerResources;
