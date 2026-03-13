import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, Search } from 'lucide-react';
import api from '../utils/api';
import PageHero from '../components/PageHero';
import SurfaceCard from '../components/SurfaceCard';
import { API_ORIGIN } from '../utils/runtimeConfig';

const SearchPage = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (query.trim() === '') {
                setResults([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');

            try {
                const { data } = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
                setResults(data);
            } catch (err) {
                console.error('Search error:', err);
                setError('Failed to fetch search results. Please try again.');
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [query]);

    return (
        <div>
            <PageHero
                eyebrow="Directory"
                title="Search the network"
                description="Find students, peers, and collaborators with a cleaner searchable directory."
            />

            <SurfaceCard>
                <div className="relative mb-6">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by username or exact ID"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-950 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70"
                    />
                </div>

                <div className="min-h-[50vh]">
                    {loading && (
                        <div className="flex items-center justify-center py-12 text-sm text-slate-500">
                            <div className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
                            Searching...
                        </div>
                    )}

                    {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

                    {!loading && !error && query.trim() !== '' && results.length === 0 && (
                        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center text-slate-500">
                            No users found matching "{query}"
                        </div>
                    )}

                    {!loading && !error && results.length > 0 && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {results.map((user) => (
                                <button
                                    type="button"
                                    onClick={() => navigate(`/profile/${user.id}`)}
                                    key={user.id}
                                    className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50"
                                >
                                    <div className="grid h-16 w-16 flex-shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-100 text-sm font-semibold text-slate-600">
                                        {user.profilePic ? (
                                            <img src={`${API_ORIGIN}${user.profilePic}`} alt={user.name} className="h-full w-full object-cover" />
                                        ) : (
                                            user.name?.charAt(0)?.toUpperCase()
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-lg font-semibold text-slate-950">{user.name}</div>
                                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                                            <Briefcase size={14} />
                                            {user.department || 'Member'}
                                        </div>
                                    </div>
                                    <ArrowRight size={18} className="text-slate-400" />
                                </button>
                            ))}
                        </div>
                    )}

                    {!loading && !error && query.trim() === '' && (
                        <div className="rounded-[24px] bg-slate-50 px-6 py-16 text-center text-slate-500">
                            Start typing to search the community.
                        </div>
                    )}
                </div>
            </SurfaceCard>
        </div>
    );
};

export default SearchPage;
