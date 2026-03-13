import { useState, useEffect } from 'react';
import api from '../utils/api';
import PageHero from '../components/PageHero';
import SurfaceCard from '../components/SurfaceCard';
import { usePopup } from '../components/PopupProvider';
import { Plus, Trash2 } from 'lucide-react';

function AdminDashboard() {
    const popup = usePopup();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [posts, setPosts] = useState([]);
    const [resources, setResources] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [newQuestion, setNewQuestion] = useState({ domain: '', question: '', ideal_answer: '' });
    const [newResource, setNewResource] = useState({ title: '', description: '', link: '' });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, usersRes, questionsRes, postsRes, resourcesRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/users'),
                api.get('/admin/questions'),
                api.get('/posts'),
                api.get('/resources')
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
            setQuestions(questionsRes.data);
            setPosts(postsRes.data);
            setResources(resourcesRes.data);
        } catch (error) {
            console.error('Error fetching admin data', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (id) => {
        const confirmed = await popup.confirm('Are you sure you want to delete this user?', {
            title: 'Delete user',
            confirmLabel: 'Delete',
        });
        if (!confirmed) return;

        try {
            await api.delete(`/admin/users/${id}`);
            setUsers((current) => current.filter((item) => item.user_id !== id));
            setStats((current) => ({ ...current, totalUsers: current.totalUsers - 1 }));
        } catch (error) {
            popup.alert(error.response?.data?.message || 'Error deleting user', {
                title: 'Delete failed',
                tone: 'danger',
            });
        }
    };

    const deleteQuestion = async (id) => {
        const confirmed = await popup.confirm('Delete this question?', {
            title: 'Delete question',
            confirmLabel: 'Delete',
        });
        if (!confirmed) return;

        try {
            await api.delete(`/admin/questions/${id}`);
            setQuestions((current) => current.filter((item) => item.question_id !== id));
        } catch (error) {
            popup.alert('Error deleting question', {
                title: 'Delete failed',
                tone: 'danger',
            });
        }
    };

    const deletePost = async (id) => {
        const confirmed = await popup.confirm('Are you sure you want to delete this post?', {
            title: 'Delete post',
            confirmLabel: 'Delete',
        });
        if (!confirmed) return;

        try {
            await api.delete(`/admin/posts/${id}`);
            setPosts((current) => current.filter((item) => item.post_id !== id));
            setStats((current) => ({ ...current, totalPosts: current.totalPosts - 1 }));
        } catch (error) {
            popup.alert('Error deleting post', {
                title: 'Delete failed',
                tone: 'danger',
            });
        }
    };

    const deleteResource = async (id) => {
        const confirmed = await popup.confirm('Are you sure you want to delete this resource?', {
            title: 'Delete resource',
            confirmLabel: 'Delete',
        });
        if (!confirmed) return;

        try {
            await api.delete(`/resources/${id}`);
            setResources((current) => current.filter((item) => item.resource_id !== id));
            setStats((current) => ({ ...current, totalResources: current.totalResources - 1 }));
        } catch (error) {
            popup.alert(error.response?.data?.message || 'Error deleting resource', {
                title: 'Delete failed',
                tone: 'danger',
            });
        }
    };

    const handleAddQuestion = async (event) => {
        event.preventDefault();
        try {
            await api.post('/admin/questions', newQuestion);
            setNewQuestion({ domain: '', question: '', ideal_answer: '' });
            fetchDashboardData();
        } catch (error) {
            popup.alert('Error adding question', {
                title: 'Save failed',
                tone: 'danger',
            });
        }
    };

    const handleAddResource = async (event) => {
        event.preventDefault();
        try {
            const { data } = await api.post('/resources', newResource);
            setResources((current) => [data, ...current]);
            setNewResource({ title: '', description: '', link: '' });
            setStats((current) => ({ ...current, totalResources: current.totalResources + 1 }));
        } catch (error) {
            popup.alert(error.response?.data?.message || 'Error adding resource', {
                title: 'Save failed',
                tone: 'danger',
            });
        }
    };

    if (loading) return <div className="py-10 text-center text-sm text-slate-500">Loading admin panel...</div>;

    return (
        <div className="space-y-6">
            <PageHero
                eyebrow="Admin"
                title="Platform control panel"
                description="Manage users, posts, and question banks with the same deployment-ready UI system."
            />

            <div className="flex gap-2 overflow-x-auto">
                {['overview', 'users', 'posts', 'questions', 'resources'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === tab ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && stats && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        ['Total users', stats.totalUsers],
                        ['Posts', stats.totalPosts],
                        ['Mock interviews', stats.totalInterviews],
                        ['Resources', stats.totalResources],
                    ].map(([label, value]) => (
                        <SurfaceCard key={label}>
                            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
                            <div className="mt-3 text-4xl font-bold text-slate-950">{value}</div>
                        </SurfaceCard>
                    ))}
                </div>
            )}

            {activeTab === 'users' && (
                <SurfaceCard className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Username</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Joined</th>
                                    <th className="px-6 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                                {users.map((item) => (
                                    <tr key={item.user_id}>
                                        <td className="px-6 py-4 font-mono text-slate-400">{item.user_id}</td>
                                        <td className="px-6 py-4 font-semibold text-slate-950">{item.username}</td>
                                        <td className="px-6 py-4">{item.email}</td>
                                        <td className="px-6 py-4">{item.role}</td>
                                        <td className="px-6 py-4">{new Date(item.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            {item.role !== 'admin' && (
                                                <button onClick={() => deleteUser(item.user_id)} className="rounded-full p-2 text-rose-600 hover:bg-rose-50">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </SurfaceCard>
            )}

            {activeTab === 'posts' && (
                <SurfaceCard className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Author</th>
                                    <th className="px-6 py-4">Content</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                                {posts.map((item) => (
                                    <tr key={item.post_id}>
                                        <td className="px-6 py-4 font-mono text-slate-400">{item.post_id}</td>
                                        <td className="px-6 py-4 font-semibold text-slate-950">{item.username}</td>
                                        <td className="px-6 py-4 max-w-md truncate">{item.content}</td>
                                        <td className="px-6 py-4">{new Date(item.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => deletePost(item.post_id)} className="rounded-full p-2 text-rose-600 hover:bg-rose-50">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </SurfaceCard>
            )}

            {activeTab === 'questions' && (
                <div className="space-y-5">
                    <SurfaceCard>
                        <h2 className="text-lg font-semibold text-slate-950">Add interview question</h2>
                        <form onSubmit={handleAddQuestion} className="mt-5 space-y-4">
                            <input
                                required
                                type="text"
                                placeholder="Domain"
                                value={newQuestion.domain}
                                onChange={(event) => setNewQuestion({ ...newQuestion, domain: event.target.value })}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70"
                            />
                            <textarea
                                required
                                rows="2"
                                placeholder="Question"
                                value={newQuestion.question}
                                onChange={(event) => setNewQuestion({ ...newQuestion, question: event.target.value })}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70"
                            />
                            <textarea
                                required
                                rows="4"
                                placeholder="Ideal answer"
                                value={newQuestion.ideal_answer}
                                onChange={(event) => setNewQuestion({ ...newQuestion, ideal_answer: event.target.value })}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70"
                            />
                            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                                <Plus size={16} />
                                Add question
                            </button>
                        </form>
                    </SurfaceCard>

                    <div className="space-y-4">
                        {questions.map((item) => (
                            <SurfaceCard key={item.question_id}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                            {item.domain}
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-950">{item.question}</h3>
                                        <p className="mt-3 text-sm leading-7 text-slate-600">{item.ideal_answer}</p>
                                    </div>
                                    <button onClick={() => deleteQuestion(item.question_id)} className="rounded-full p-2 text-rose-600 hover:bg-rose-50">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </SurfaceCard>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'resources' && (
                <div className="space-y-5">
                    <SurfaceCard>
                        <h2 className="text-lg font-semibold text-slate-950">Add career resource</h2>
                        <form onSubmit={handleAddResource} className="mt-5 space-y-4">
                            <input
                                required
                                type="text"
                                placeholder="Resource title"
                                value={newResource.title}
                                onChange={(event) => setNewResource({ ...newResource, title: event.target.value })}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70"
                            />
                            <textarea
                                required
                                rows="3"
                                placeholder="Description"
                                value={newResource.description}
                                onChange={(event) => setNewResource({ ...newResource, description: event.target.value })}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70"
                            />
                            <input
                                required
                                type="text"
                                placeholder="Link"
                                value={newResource.link}
                                onChange={(event) => setNewResource({ ...newResource, link: event.target.value })}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70"
                            />
                            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                                <Plus size={16} />
                                Add resource
                            </button>
                        </form>
                    </SurfaceCard>

                    <div className="space-y-4">
                        {resources.map((item) => (
                            <SurfaceCard key={item.resource_id}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                                        <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                                        <a
                                            href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 inline-flex text-sm font-semibold text-slate-700 underline-offset-4 hover:underline"
                                        >
                                            {item.link}
                                        </a>
                                    </div>
                                    <button onClick={() => deleteResource(item.resource_id)} className="rounded-full p-2 text-rose-600 hover:bg-rose-50">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </SurfaceCard>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
