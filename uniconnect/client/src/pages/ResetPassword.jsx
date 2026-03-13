import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import api from '../utils/api';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post(`/auth/reset-password/${token}`, {
                password,
                confirmPassword
            });
            setMessage(response.data.message);
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            eyebrow="New password"
            title="Choose a fresh password"
            description="Use a strong password you have not used on this account before."
            footer={
                <p>
                    Want to sign in instead?{' '}
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
                    <span className="mb-2 block text-sm font-medium text-slate-700">New password</span>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
                        placeholder="At least 6 characters"
                    />
                </label>

                <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Confirm new password</span>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
                        placeholder="Repeat your password"
                    />
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                    {loading ? 'Resetting...' : 'Reset password'}
                </button>
            </form>
        </AuthShell>
    );
};

export default ResetPassword;
