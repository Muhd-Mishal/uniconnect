function SurfaceCard({ className = '', children }) {
    return (
        <div className={`rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.05)] sm:p-6 ${className}`}>
            {children}
        </div>
    );
}

export default SurfaceCard;
