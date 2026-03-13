import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import AuthShell from '../components/AuthShell';

function Login() {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data } = await api.post('/auth/login', { email, password });
            login(data, data.token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            eyebrow="Welcome back"
            title="Sign in to UniConnect"
            description="A lighter interface for networking, messaging, and campus career prep."
            footer={
                <p>
                    New here?{' '}
                    <Link to="/register" className="font-semibold text-slate-950 underline-offset-4 hover:underline">
                        Create an account
                    </Link>
                </p>
            }
        >
            {error && (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
                        placeholder="name@example.com"
                    />
                </label>

                <label className="block">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Password</span>
                        <Link to="/forgot-password" className="text-sm font-medium text-slate-500 transition hover:text-slate-950">
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
                            placeholder="Your password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((current) => !current)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>
        </AuthShell>
    );
}

export default Login;
