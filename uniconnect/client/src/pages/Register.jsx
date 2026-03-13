import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Mail, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import AuthShell from '../components/AuthShell';

const initialFormData = {
    username: '',
    email: '',
    password: '',
    role: 'student',
};

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(initialFormData);
    const [otp, setOtp] = useState('');
    const [verificationEmail, setVerificationEmail] = useState('');
    const [otpExpiresAt, setOtpExpiresAt] = useState(null);
    const [step, setStep] = useState('register');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleRegister = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const { data } = await api.post('/auth/register', formData);
            setVerificationEmail(formData.email);
            setOtpExpiresAt(data.otpExpiresAt || null);
            setStep('verify');
            setMessage(data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const { data } = await api.post('/auth/verify-registration-otp', {
                email: verificationEmail,
                otp,
            });
            setMessage(data.message);
            setTimeout(() => navigate('/login'), 1200);
        } catch (err) {
            setError(err.response?.data?.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResendLoading(true);
        setError('');
        setMessage('');

        try {
            const { data } = await api.post('/auth/resend-registration-otp', {
                email: verificationEmail,
            });
            setOtp('');
            setOtpExpiresAt(data.otpExpiresAt || null);
            setMessage(data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setResendLoading(false);
        }
    };

    const footer = (
        <p>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-slate-950 underline-offset-4 hover:underline">
                Log in
            </Link>
        </p>
    );

    return (
        <AuthShell
            eyebrow="Create account"
            title={step === 'register' ? 'Join with a minimal setup' : 'Verify your email with OTP'}
            description={
                step === 'register'
                    ? 'Create your profile with a quieter, more polished onboarding flow.'
                    : `We sent a 6-digit code to ${verificationEmail}. Enter it below to activate your account.`
            }
            footer={footer}
        >
            <div className="mb-6 flex items-center gap-3 text-xs font-medium text-slate-400">
                <div className={`h-1.5 flex-1 rounded-full transition ${step === 'register' ? 'bg-slate-950' : 'bg-slate-200'}`} />
                <div className={`h-1.5 flex-1 rounded-full transition ${step === 'verify' ? 'bg-slate-950' : 'bg-slate-200'}`} />
            </div>

            {message && (
                <div className="motion-fade-in mb-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-700">
                    {message}
                </div>
            )}

            {error && (
                <div className="motion-fade-in mb-5 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            {step === 'register' ? (
                <form onSubmit={handleRegister} className="space-y-4">
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">Username</span>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
                            placeholder="Your name"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
                            placeholder="name@example.com"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
                                placeholder="At least 6 characters"
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

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-white p-2 text-slate-700">
                                <ShieldCheck size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">OTP verification is required</p>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    After signup, we will send a one-time code to your email before first login.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>
            ) : (
                <div className="motion-fade-in space-y-5">
                    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                        <div className="flex items-start gap-3 break-all sm:items-center">
                            <Mail size={18} className="text-slate-800" />
                            <span>{verificationEmail}</span>
                        </div>
                        {otpExpiresAt && (
                            <div className="flex items-start gap-3 sm:items-center">
                                <CheckCircle2 size={18} className="text-slate-800" />
                                <span>Code expires at {new Date(otpExpiresAt).toLocaleTimeString()}</span>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleVerify} className="space-y-4">
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">6-digit OTP</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={otp}
                                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                                required
                                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center text-lg font-semibold tracking-[0.25em] text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70 sm:px-4 sm:text-xl sm:tracking-[0.45em]"
                                placeholder="000000"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            {loading ? 'Verifying...' : 'Verify email'}
                        </button>
                    </form>

                    <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendLoading}
                            className="rounded-2xl border border-slate-200 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                            {resendLoading ? 'Sending...' : 'Resend OTP'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setStep('register');
                                setOtp('');
                                setMessage('');
                                setError('');
                            }}
                            className="font-medium text-slate-500 transition hover:text-slate-900"
                        >
                            Edit signup details
                        </button>
                    </div>
                </div>
            )}
        </AuthShell>
    );
}

export default Register;
