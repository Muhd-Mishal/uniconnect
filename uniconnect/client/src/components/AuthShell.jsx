import { Link } from 'react-router-dom';

const notes = [
    'Campus networking without clutter',
    'OTP-secured signup and recovery',
    'Fast, quiet interface across devices',
];

function AuthShell({ eyebrow, title, description, footer, children }) {
    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <div className="mx-auto grid min-h-screen w-full max-w-6xl lg:grid-cols-[0.95fr_1.05fr]">
                <section className="flex flex-col justify-between border-b border-slate-200 px-5 py-6 sm:px-8 sm:py-8 lg:border-b-0 lg:border-r lg:px-12 lg:py-12">
                    <div>
                        <Link to="/" className="text-base font-semibold tracking-[0.16em] text-slate-900 uppercase">
                            UniConnect
                        </Link>
                        <div className="mt-10 max-w-md sm:mt-16 lg:mt-24">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                                {eyebrow}
                            </p>
                            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                                Modern auth with less chrome.
                            </h1>
                            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-500 sm:text-base">
                                A cleaner entry flow focused on readability, speed, and essential actions only.
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 border-t border-slate-200 pt-6">
                        <div className="grid gap-3 text-sm text-slate-500">
                            {notes.map((item) => (
                                <div key={item} className="flex items-center gap-3">
                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="flex items-center justify-center px-4 py-6 sm:px-8 sm:py-10 lg:px-12">
                    <div className="motion-rise-in w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-8">
                        <div className="mb-8">
                            <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                {eyebrow}
                            </div>
                            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
                        </div>

                        {children}

                        {footer && <div className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-500">{footer}</div>}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default AuthShell;
