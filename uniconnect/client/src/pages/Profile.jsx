import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Upload, User, BookOpen, Briefcase, Calendar, MessageSquare, UserPlus } from 'lucide-react';
import PageHero from '../components/PageHero';
import SurfaceCard from '../components/SurfaceCard';
import { usePopup } from '../components/PopupProvider';
import { API_ORIGIN } from '../utils/runtimeConfig';

function Profile() {
    const popup = usePopup();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        department: '',
        year: '',
        skills: '',
        career_interest: ''
    });
    const [profilePic, setProfilePic] = useState(null);
    const [resume, setResume] = useState(null);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const endpoint = id ? `/profile/${id}` : '/profile';
            const { data } = await api.get(endpoint);
            setProfile(data);
            setFormData({
                department: data.department || '',
                year: data.year || '',
                skills: data.skills || '',
                career_interest: data.career_interest || ''
            });
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setLoading(false);
        }
    };

    const isOwnProfile = !id || id === String(user?.user_id);

    const handleMessageClick = () => {
        navigate('/chat', { state: { directUserId: id, directUserName: profile?.username } });
    };

    const handleAddGroupClick = async () => {
        if (!newGroupName.trim()) return;

        try {
            const { data: groupData } = await api.post('/chat/groups', { name: newGroupName });
            await api.post('/chat/groups/add', { group_id: groupData.id, user_id: id });
            await popup.alert(`Successfully created group "${newGroupName}" and added ${profile?.username}!`, {
                title: 'Group created',
                tone: 'success',
            });
            setShowGroupModal(false);
            setNewGroupName('');
            navigate('/chat');
        } catch (err) {
            console.error('Failed to add to group:', err);
            popup.alert('Failed to create group or add user.', {
                title: 'Group creation failed',
                tone: 'danger',
            });
        }
    };

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const handleFileChange = (event, type) => {
        if (type === 'pic') setProfilePic(event.target.files[0]);
        if (type === 'resume') setResume(event.target.files[0]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const data = new FormData();
        data.append('department', formData.department);
        data.append('year', formData.year);
        data.append('skills', formData.skills);
        data.append('career_interest', formData.career_interest);
        if (profilePic) data.append('profile_pic', profilePic);
        if (resume) data.append('resume', resume);

        try {
            await api.put('/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            setEditing(false);
            fetchProfile();
        } catch (error) {
            console.error('Failed to update profile', error);
        }
    };

    if (loading) return <div className="py-10 text-center text-sm text-slate-500">Loading profile...</div>;

    return (
        <div className="space-y-6">
            <PageHero
                eyebrow="Profile"
                title={profile?.username || 'Profile'}
                description={profile?.email}
            />

            <SurfaceCard>
                <div className="flex flex-col gap-8 lg:flex-row">
                    <div className="flex w-full max-w-xs flex-col items-center">
                        <div className="grid h-36 w-36 place-items-center overflow-hidden rounded-[32px] bg-slate-100 text-slate-400">
                            {profilePic ? (
                                <img src={URL.createObjectURL(profilePic)} alt="Preview" className="h-full w-full object-cover" />
                            ) : profile?.profile_pic ? (
                                <img src={`${API_ORIGIN}${profile.profile_pic}`} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <User size={64} />
                            )}
                        </div>
                        {editing && (
                            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                                <Upload size={16} />
                                Change photo
                                <input type="file" className="hidden" accept="image/*" onChange={(event) => handleFileChange(event, 'pic')} />
                            </label>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-3xl font-semibold text-slate-950">{profile?.username}</h2>
                                <p className="mt-2 text-sm text-slate-500">{profile?.email}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {isOwnProfile ? (
                                    !editing && (
                                        <button
                                            onClick={() => setEditing(true)}
                                            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                        >
                                            Edit profile
                                        </button>
                                    )
                                ) : (
                                    <>
                                        <button
                                            onClick={handleMessageClick}
                                            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                        >
                                            <MessageSquare size={16} />
                                            Message
                                        </button>
                                        <button
                                            onClick={() => setShowGroupModal(true)}
                                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                        >
                                            <UserPlus size={16} />
                                            Start group
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {editing && isOwnProfile ? (
                            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <input name="department" value={formData.department} onChange={handleChange} placeholder="Department" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70" />
                                    <input name="year" type="number" value={formData.year} onChange={handleChange} placeholder="Year" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70" />
                                </div>
                                <input name="career_interest" value={formData.career_interest} onChange={handleChange} placeholder="Career interests" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70" />
                                <textarea name="skills" value={formData.skills} onChange={handleChange} rows="3" placeholder="Skills" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70" />
                                <input type="file" accept=".pdf,.doc,.docx" onChange={(event) => handleFileChange(event, 'resume')} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" />
                                <div className="flex flex-wrap gap-3 pt-2">
                                    <button type="submit" className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Save changes</button>
                                    <button type="button" onClick={() => setEditing(false)} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                {[
                                    { icon: BookOpen, label: 'Department', value: profile?.department || 'Not specified' },
                                    { icon: Calendar, label: 'Year', value: profile?.year || 'Not specified' },
                                    { icon: Briefcase, label: 'Career interests', value: profile?.career_interest || 'Not specified', wide: true },
                                ].map(({ icon: Icon, label, value, wide }) => (
                                    <div key={label} className={`rounded-[24px] border border-slate-200 bg-slate-50 p-4 ${wide ? 'md:col-span-2' : ''}`}>
                                        <div className="mb-3 flex items-center gap-3">
                                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-700">
                                                <Icon size={18} />
                                            </div>
                                            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
                                        </div>
                                        <div className="text-sm font-medium text-slate-900">{value}</div>
                                    </div>
                                ))}

                                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                                    <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Skills</div>
                                    {profile?.skills ? (
                                        <div className="flex flex-wrap gap-2">
                                            {profile.skills.split(',').map((skill, index) => (
                                                <span key={index} className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">No skills listed.</p>
                                    )}
                                </div>

                                {profile?.resume && (
                                    <div className="md:col-span-2">
                                        <a
                                            href={`${API_ORIGIN}${profile.resume}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                                        >
                                            View current resume
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </SurfaceCard>

            {showGroupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
                    <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
                        <h3 className="text-xl font-semibold text-slate-950">Create new group</h3>
                        <p className="mt-2 text-sm text-slate-500">Start a group with {profile?.username} directly from profile.</p>
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder={`E.g. Study with ${profile?.username}`}
                            className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70"
                        />
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowGroupModal(false);
                                    setNewGroupName('');
                                }}
                                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddGroupClick}
                                disabled={!newGroupName.trim()}
                                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
                            >
                                Create and add user
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;
