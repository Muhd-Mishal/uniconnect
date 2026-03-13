import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import api from '../utils/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/forgot-password', { email });
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            eyebrow="Password reset"
            title="Reset access"
            description="Enter your email and we will send a password reset link."
            footer={
                <p>
                    Remembered your password?{' '}
                    <Link to="/login" className="font-semibold text-slate-950 underline-offset-4 hover:underline">
                        Back to login
                    </Link>
                </p>
            }
        >
            {message && (
                <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-700">
                    {message}
                </div>
            )}
            {error && (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
                        placeholder="name@example.com"
                    />
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                    {loading ? 'Sending...' : 'Send reset link'}
                </button>
            </form>
        </AuthShell>
    );
};

export default ForgotPassword;
