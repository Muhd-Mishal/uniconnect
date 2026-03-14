import { useEffect, useState } from 'react';
import { Github, Globe, ImagePlus, PencilLine, Plus, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { API_ORIGIN } from '../utils/runtimeConfig';
import SurfaceCard from '../components/SurfaceCard';
import { usePopup } from '../components/PopupProvider';

const emptyProjectForm = { title: '', description: '', github_url: '', live_demo_url: '' };
const toAssetUrl = (path) => (path ? `${API_ORIGIN}${path}` : '');

function PortfolioManager() {
    const popup = usePopup();
    const [portfolio, setPortfolio] = useState({ username: '', projects: [] });
    const [loading, setLoading] = useState(true);
    const [savingProject, setSavingProject] = useState(false);
    const [projectForm, setProjectForm] = useState(emptyProjectForm);
    const [projectImageFile, setProjectImageFile] = useState(null);
    const [editingProjectId, setEditingProjectId] = useState(null);

    useEffect(() => {
        const loadPortfolio = async () => {
            try {
                const { data } = await api.get('/portfolio/me');
                setPortfolio(data);
            } catch (error) {
                console.error('Failed to load portfolio workspace', error);
                try {
                    const { data } = await api.get('/profile');
                    setPortfolio({
                        username: data.username || '',
                        bio: '',
                        skills: data.skills || '',
                        projects: [],
                        sharePath: data.username ? `/portfolio/${data.username}` : '',
                    });
                } catch {
                    setPortfolio({ username: '', projects: [] });
                }
            } finally {
                setLoading(false);
            }
        };

        loadPortfolio();
    }, []);

    const handleProjectField = (event) => {
        setProjectForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    };

    const resetProjectEditor = () => {
        setProjectForm(emptyProjectForm);
        setProjectImageFile(null);
        setEditingProjectId(null);
    };

    const handleProjectSave = async (event) => {
        event.preventDefault();
        setSavingProject(true);

        try {
            const formData = new FormData();
            formData.append('title', projectForm.title);
            formData.append('description', projectForm.description);
            formData.append('github_url', projectForm.github_url);
            formData.append('live_demo_url', projectForm.live_demo_url);
            if (projectImageFile) formData.append('project_image', projectImageFile);

            const request = editingProjectId
                ? api.put(`/portfolio/projects/${editingProjectId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
                : api.post('/portfolio/projects', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            const { data } = await request;

            setPortfolio((current) => ({
                ...current,
                projects: editingProjectId
                    ? current.projects.map((project) => (project.project_id === editingProjectId ? data : project))
                    : [data, ...current.projects],
            }));

            resetProjectEditor();
            await popup.alert(`Project ${editingProjectId ? 'updated' : 'added'} successfully.`, {
                title: editingProjectId ? 'Project updated' : 'Project added',
                tone: 'success',
            });
        } catch (error) {
            await popup.alert(error.response?.data?.message || 'Failed to save project.', {
                title: 'Project save failed',
                tone: 'danger',
            });
        } finally {
            setSavingProject(false);
        }
    };

    const handleEditProject = (project) => {
        setEditingProjectId(project.project_id);
        setProjectForm({
            title: project.title || '',
            description: project.description || '',
            github_url: project.github_url || '',
            live_demo_url: project.live_demo_url || '',
        });
        setProjectImageFile(null);
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    const handleDeleteProject = async (projectId) => {
        const confirmed = await popup.confirm('Delete this project from your public portfolio?', {
            title: 'Delete project',
            confirmLabel: 'Delete',
        });

        if (!confirmed) return;

        try {
            await api.delete(`/portfolio/projects/${projectId}`);
            setPortfolio((current) => ({
                ...current,
                projects: current.projects.filter((project) => project.project_id !== projectId),
            }));
        } catch (error) {
            await popup.alert(error.response?.data?.message || 'Failed to delete project.', {
                title: 'Delete failed',
                tone: 'danger',
            });
        }
    };

    if (loading) {
        return <div className="py-10 text-center text-sm text-slate-500">Loading project manager...</div>;
    }

    return (
        <div className="space-y-6">
            <SurfaceCard>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-950">Portfolio projects</h2>
                        <p className="mt-2 text-sm text-slate-500">Manage the projects that appear on your public portfolio page.</p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                        {portfolio?.projects?.length || 0} projects
                    </div>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {portfolio?.projects?.length ? portfolio.projects.map((project) => (
                        <article key={project.project_id} className="overflow-hidden rounded-[26px] border border-slate-200 bg-slate-50">
                            <div className="grid h-44 place-items-center overflow-hidden bg-white">
                                {project.image ? (
                                    <img src={toAssetUrl(project.image)} alt={project.title} className="h-full w-full object-cover" />
                                ) : (
                                    <ImagePlus size={34} className="text-slate-300" />
                                )}
                            </div>
                            <div className="p-5">
                                <div className="text-lg font-semibold text-slate-950">{project.title}</div>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{project.description}</p>
                                <div className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                                    Uploaded {new Date(project.uploaded_at).toLocaleDateString()}
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {project.github_url && (
                                        <a href={project.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                                            <Github size={14} />
                                            GitHub
                                        </a>
                                    )}
                                    {project.live_demo_url && (
                                        <a href={project.live_demo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                                            <Globe size={14} />
                                            Live demo
                                        </a>
                                    )}
                                </div>
                                <div className="mt-5 flex gap-2">
                                    <button onClick={() => handleEditProject(project)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                                        <PencilLine size={14} />
                                        Edit
                                    </button>
                                    <button onClick={() => handleDeleteProject(project.project_id)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </article>
                    )) : (
                        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                            No projects yet. Add your first project to make the portfolio share-ready.
                        </div>
                    )}
                </div>
            </SurfaceCard>

            <SurfaceCard>
                <h2 className="text-xl font-semibold text-slate-950">{editingProjectId ? 'Edit project' : 'Add a project'}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Upload your best work with screenshots and optional GitHub or live demo links.</p>

                <form onSubmit={handleProjectSave} className="mt-6 space-y-4">
                    <input name="title" value={projectForm.title} onChange={handleProjectField} placeholder="Project title" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70" required />
                    <textarea name="description" rows="5" value={projectForm.description} onChange={handleProjectField} placeholder="Describe what you built, what problem it solves, and what you learned." className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70" required />
                    <div className="grid gap-4 md:grid-cols-2">
                        <input name="github_url" value={projectForm.github_url} onChange={handleProjectField} placeholder="GitHub link (optional)" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70" />
                        <input name="live_demo_url" value={projectForm.live_demo_url} onChange={handleProjectField} placeholder="Live demo link (optional)" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70" />
                    </div>
                    <input type="file" accept="image/*" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" onChange={(event) => setProjectImageFile(event.target.files?.[0] || null)} />
                    <div className="flex flex-wrap gap-3">
                        <button type="submit" disabled={savingProject} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-300">
                            {editingProjectId ? <PencilLine size={16} /> : <Plus size={16} />}
                            {savingProject ? 'Saving...' : editingProjectId ? 'Update project' : 'Add project'}
                        </button>
                        {editingProjectId && (
                            <button type="button" onClick={resetProjectEditor} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
                                Cancel edit
                            </button>
                        )}
                    </div>
                </form>
            </SurfaceCard>
        </div>
    );
}

export default PortfolioManager;
