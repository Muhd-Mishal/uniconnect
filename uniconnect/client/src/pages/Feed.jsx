import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import {
    Image as ImageIcon,
    ThumbsUp,
    MessageSquare,
    Send,
    Search,
    Sparkles,
    Clock3,
    Users,
} from 'lucide-react';
import { API_ORIGIN } from '../utils/runtimeConfig';

function Feed() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const fileInputRef = useRef(null);

    const [activeCommentPost, setActiveCommentPost] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState({});

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    useEffect(() => {
        fetchPosts();
    }, []);

    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (searchQuery.trim() === '') {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            setSearchError('');

            try {
                const { data } = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
                setSearchResults(data);
            } catch (err) {
                console.error('Search error:', err);
                setSearchError('Failed to fetch search results.');
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [searchQuery]);

    const fetchPosts = async () => {
        try {
            const { data } = await api.get('/posts');
            setPosts(data);
        } catch (error) {
            console.error('Error fetching posts', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostSubmit = async (event) => {
        event.preventDefault();
        if (!content.trim() && !image) return;

        const formData = new FormData();
        formData.append('content', content);
        if (image) formData.append('image', image);

        try {
            await api.post('/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setContent('');
            setImage(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            fetchPosts();
        } catch (error) {
            console.error('Error creating post', error);
        }
    };

    const handleLike = async (postId) => {
        try {
            await api.post(`/posts/${postId}/like`);
            setPosts((current) =>
                current.map((post) => {
                    if (post.post_id === postId) {
                        const isLiked = post.is_liked;
                        return {
                            ...post,
                            is_liked: !isLiked,
                            like_count: isLiked ? post.like_count - 1 : post.like_count + 1
                        };
                    }
                    return post;
                })
            );
        } catch (error) {
            console.error('Error toggling like', error);
        }
    };

    const fetchComments = async (postId) => {
        try {
            const { data } = await api.get(`/posts/${postId}/comments`);
            setComments((current) => ({ ...current, [postId]: data }));
        } catch (error) {
            console.error('Error fetching comments', error);
        }
    };

    const toggleComments = (postId) => {
        if (activeCommentPost === postId) {
            setActiveCommentPost(null);
        } else {
            setActiveCommentPost(postId);
            if (!comments[postId]) {
                fetchComments(postId);
            }
        }
    };

    const handleCommentSubmit = async (event, postId) => {
        event.preventDefault();
        if (!commentText.trim()) return;

        try {
            await api.post(`/posts/${postId}/comments`, { comment: commentText });
            setCommentText('');
            fetchComments(postId);
            setPosts((current) =>
                current.map((post) =>
                    post.post_id === postId
                        ? { ...post, comment_count: post.comment_count + 1 }
                        : post
                )
            );
        } catch (error) {
            console.error('Error adding comment', error);
        }
    };

    const getProfileImage = (path) => `${API_ORIGIN}${path}`;
    const getInitial = (value) => value?.charAt(0)?.toUpperCase() || 'U';

    if (loading) {
        return <div className="py-16 text-center text-sm text-slate-500">Loading feed...</div>;
    }

    return (
        <div className="mx-auto w-full max-w-7xl px-0 py-4 sm:px-2 lg:px-0">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="order-2 min-w-0 lg:order-1">
                    <section className="mb-6 overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_65%,#334155_100%)] p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] sm:p-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                                    <Sparkles size={14} />
                                    Community feed
                                </div>
                                <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                                    Share work, connect faster, keep the feed clean.
                                </h1>
                                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                                    A deployment-ready surface for updates, academic work, and quick discovery across your network.
                                </p>
                            </div>

                            <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2 lg:min-w-[280px]">
                                <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm">
                                    <div className="text-lg font-semibold text-white">{posts.length}</div>
                                    <div className="text-slate-300">Total posts</div>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm">
                                    <div className="text-lg font-semibold text-white">{searchResults.length}</div>
                                    <div className="text-slate-300">Live matches</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.05)] sm:p-5">
                        <form onSubmit={handlePostSubmit}>
                            <div className="mb-4 flex items-start gap-4">
                                <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
                                    {getInitial(user?.username)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="mb-2 text-sm font-semibold text-slate-900">Create a post</div>
                                    <textarea
                                        className="min-h-[120px] w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70"
                                        placeholder="Share an update, project milestone, or question with your network."
                                        value={content}
                                        onChange={(event) => setContent(event.target.value)}
                                    />
                                </div>
                            </div>

                            {image && (
                                <div className="relative mb-4 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                                    <img src={URL.createObjectURL(image)} alt="Preview" className="max-h-[340px] w-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setImage(null)}
                                        className="absolute right-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-medium text-white transition hover:bg-slate-950"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                                    >
                                        <ImageIcon size={18} />
                                        Add photo
                                    </button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(event) => setImage(event.target.files[0])}
                                    />
                                    <div className="text-xs text-slate-400">Posts support text and image updates.</div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!content.trim() && !image}
                                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    Publish post
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="space-y-5">
                        {posts.length === 0 ? (
                            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
                                <div className="mx-auto max-w-md">
                                    <h2 className="text-lg font-semibold text-slate-900">No posts yet</h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        Start the community with a first update, project snapshot, or question.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <article
                                    key={post.post_id}
                                    className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)]"
                                >
                                    <div className="flex items-center gap-3 px-5 pt-5">
                                        <div className="grid h-12 w-12 flex-shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
                                            {post.profile_pic ? (
                                                <img src={getProfileImage(post.profile_pic)} alt="avatar" className="h-full w-full object-cover" />
                                            ) : (
                                                getInitial(post.username)
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-base font-semibold text-slate-950">{post.username}</div>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                                                <Clock3 size={13} />
                                                {new Date(post.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-5 pb-4 pt-4">
                                        <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{post.content}</p>
                                    </div>

                                    {post.image && (
                                        <div className="border-y border-slate-200 bg-slate-50">
                                            <img
                                                src={getProfileImage(post.image)}
                                                alt="Post content"
                                                className="max-h-[560px] w-full object-cover"
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between px-5 py-3 text-sm text-slate-400">
                                        <span>{post.like_count} likes</span>
                                        <span>{post.comment_count} comments</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 border-t border-slate-200 px-4 py-3">
                                        <button
                                            onClick={() => handleLike(post.post_id)}
                                            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${post.is_liked
                                                ? 'bg-slate-950 text-white'
                                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                                                }`}
                                        >
                                            <ThumbsUp size={18} className={post.is_liked ? 'fill-current' : ''} />
                                            Like
                                        </button>
                                        <button
                                            onClick={() => toggleComments(post.post_id)}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                                        >
                                            <MessageSquare size={18} />
                                            Comment
                                        </button>
                                    </div>

                                    {activeCommentPost === post.post_id && (
                                        <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-4">
                                            <form onSubmit={(event) => handleCommentSubmit(event, post.post_id)} className="mb-4 flex gap-3">
                                                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl bg-white text-xs font-semibold text-slate-600">
                                                    {getInitial(user?.username)}
                                                </div>
                                                <div className="relative flex-1">
                                                    <input
                                                        type="text"
                                                        value={commentText}
                                                        onChange={(event) => setCommentText(event.target.value)}
                                                        placeholder="Write a comment..."
                                                        className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/70"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={!commentText.trim()}
                                                        className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950 text-white transition disabled:bg-slate-300"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                </div>
                                            </form>

                                            <div className="space-y-3">
                                                {!comments[post.post_id] ? (
                                                    <div className="py-3 text-center text-xs text-slate-400">Loading comments...</div>
                                                ) : comments[post.post_id].length === 0 ? (
                                                    <div className="py-3 text-center text-xs text-slate-400">No comments yet.</div>
                                                ) : (
                                                    comments[post.post_id].map((comment) => (
                                                        <div key={comment.comment_id} className="flex gap-3">
                                                            <div className="grid h-10 w-10 flex-shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-xs font-semibold text-slate-600">
                                                                {comment.profile_pic ? (
                                                                    <img src={getProfileImage(comment.profile_pic)} alt="avatar" className="h-full w-full object-cover" />
                                                                ) : (
                                                                    getInitial(comment.username)
                                                                )}
                                                            </div>
                                                            <div className="flex-1 rounded-[22px] border border-slate-200 bg-white px-4 py-3">
                                                                <div className="text-sm font-semibold text-slate-950">{comment.username}</div>
                                                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                                                    {comment.comment}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </article>
                            ))
                        )}
                    </section>
                </div>

                <aside className="order-1 space-y-5 lg:order-2">
                    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
                        <div className="flex items-center gap-3">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white">
                                <Users size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight text-slate-950">Find connections</h2>
                                <p className="text-sm text-slate-500">Search people across the network.</p>
                            </div>
                        </div>

                        <div className="relative mt-5">
                            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search by name"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70"
                            />
                        </div>

                        <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-2 pr-1">
                            {isSearching && (
                                <div className="flex justify-center py-6">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
                                </div>
                            )}

                            {searchError && (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                                    {searchError}
                                </div>
                            )}

                            {!isSearching && !searchError && searchQuery.trim() !== '' && searchResults.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                                    No users found matching "{searchQuery}"
                                </div>
                            )}

                            {!isSearching && !searchError && searchResults.length > 0 && (
                                <div className="space-y-2">
                                    {searchResults.map((searchedUser) => (
                                        <button
                                            type="button"
                                            onClick={() => navigate('/profile/' + searchedUser.id)}
                                            key={searchedUser.id}
                                            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 px-3 py-3 text-left transition hover:bg-slate-50"
                                        >
                                            <div className="grid h-11 w-11 flex-shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-100 text-xs font-semibold text-slate-600">
                                                {searchedUser.profilePic ? (
                                                    <img src={getProfileImage(searchedUser.profilePic)} alt={searchedUser.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    getInitial(searchedUser.name)
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-sm font-semibold text-slate-950">{searchedUser.name}</div>
                                                <div className="truncate text-xs text-slate-500">{searchedUser.department || 'Member'}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {searchQuery.trim() === '' && (
                                <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                                    Search by name to quickly discover students and members.
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Posting tips</h3>
                        <div className="mt-4 space-y-4">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <div className="text-sm font-semibold text-slate-900">Keep updates concise</div>
                                <div className="mt-1 text-sm leading-6 text-slate-500">
                                    Clear captions and one strong image perform better than dense walls of text.
                                </div>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <div className="text-sm font-semibold text-slate-900">Make your work discoverable</div>
                                <div className="mt-1 text-sm leading-6 text-slate-500">
                                    Share project milestones, club activities, internships, and questions.
                                </div>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}

export default Feed;
