import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Clock } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import PageHero from '../components/PageHero';
import SurfaceCard from '../components/SurfaceCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function InterviewDashboard() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/interviews/history');
            setHistory(data);
        } catch (error) {
            console.error('Error fetching interview history', error);
        } finally {
            setLoading(false);
        }
    };

    const getChartData = () => {
        const sorted = [...history].sort((a, b) => new Date(a.attempted_at) - new Date(b.attempted_at));
        return {
            labels: sorted.map((_, index) => `Attempt ${index + 1}`),
            datasets: [
                {
                    label: 'AI Evaluation Score',
                    data: sorted.map((item) => item.score),
                    borderColor: '#0f172a',
                    backgroundColor: 'rgba(15, 23, 42, 0.08)',
                    tension: 0.35,
                    fill: true,
                    pointBackgroundColor: '#0f172a',
                    pointRadius: 4,
                },
            ],
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: false },
        },
        scales: { y: { min: 0, max: 100 } }
    };

    if (loading) return <div className="py-10 text-center text-sm text-slate-500">Loading dashboard...</div>;

    const averageScore = history.length
        ? Math.round(history.reduce((acc, curr) => acc + curr.score, 0) / history.length)
        : 0;

    return (
        <div className="space-y-6">
            <PageHero
                eyebrow="Performance"
                title="Interview performance dashboard"
                description="Track score trends over time and review past interview results with a cleaner analytics surface."
                aside={
                    <Link
                        to="/interviews"
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white"
                    >
                        <ArrowLeft size={16} />
                        Back to practice
                    </Link>
                }
            />

            {history.length === 0 ? (
                <SurfaceCard className="text-center text-slate-500">
                    No interview attempts yet. Practice a session to populate your dashboard.
                </SurfaceCard>
            ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <SurfaceCard className="lg:col-span-2">
                        <h3 className="text-lg font-semibold text-slate-950">Score progression</h3>
                        <div className="mt-6 h-80">
                            <Line options={chartOptions} data={getChartData()} />
                        </div>
                    </SurfaceCard>

                    <SurfaceCard className="flex flex-col justify-center">
                        <h3 className="text-lg font-semibold text-slate-950 text-center">Snapshot</h3>
                        <div className="mt-8 space-y-8">
                            <div className="text-center">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total attempts</div>
                                <div className="mt-2 text-4xl font-bold text-slate-950">{history.length}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Average score</div>
                                <div className="mt-2 text-4xl font-bold text-slate-950">{averageScore}%</div>
                            </div>
                        </div>
                    </SurfaceCard>

                    <SurfaceCard className="lg:col-span-3 overflow-hidden p-0">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <h3 className="text-lg font-semibold text-slate-950">Detailed history</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Date</th>
                                        <th className="px-6 py-4 font-semibold">Domain</th>
                                        <th className="px-6 py-4 font-semibold">Score</th>
                                        <th className="px-6 py-4 font-semibold">Feedback</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                                    {history.slice().reverse().map((item) => (
                                        <tr key={item.result_id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Clock size={14} />
                                                    {new Date(item.attempted_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                                                    {item.domain}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-950">{item.score}%</td>
                                            <td className="px-6 py-4">{item.feedback}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SurfaceCard>
                </div>
            )}
        </div>
    );
}

export default InterviewDashboard;
