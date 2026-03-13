function PageHero({ eyebrow, title, description, aside }) {
    return (
        <section className="mb-6 overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_60%,#334155_100%)] px-5 py-6 text-white shadow-[0_18px_40px_rgba(15,23,42,0.14)] sm:px-8 sm:py-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                    {eyebrow && (
                        <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">
                            {eyebrow}
                        </div>
                    )}
                    <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
                    {description && <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{description}</p>}
                </div>
                {aside && <div className="lg:min-w-[260px]">{aside}</div>}
            </div>
        </section>
    );
}

export default PageHero;
