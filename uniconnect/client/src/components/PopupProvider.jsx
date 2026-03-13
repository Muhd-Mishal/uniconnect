import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CircleAlert, CircleCheckBig, TriangleAlert, X } from 'lucide-react';

const PopupContext = createContext(null);

const toneStyles = {
    info: {
        icon: CircleAlert,
        iconClassName: 'bg-sky-100 text-sky-700',
        buttonClassName: 'bg-slate-950 text-white hover:bg-slate-800',
    },
    success: {
        icon: CircleCheckBig,
        iconClassName: 'bg-emerald-100 text-emerald-700',
        buttonClassName: 'bg-emerald-600 text-white hover:bg-emerald-500',
    },
    danger: {
        icon: TriangleAlert,
        iconClassName: 'bg-rose-100 text-rose-700',
        buttonClassName: 'bg-rose-600 text-white hover:bg-rose-500',
    },
};

export function PopupProvider({ children }) {
    const [popup, setPopup] = useState(null);

    const closePopup = useCallback((result) => {
        setPopup((current) => {
            current?.resolve?.(result);
            return null;
        });
    }, []);

    const showAlert = useCallback((message, options = {}) => new Promise((resolve) => {
        setPopup({
            type: 'alert',
            title: options.title || 'Notice',
            message,
            confirmLabel: options.confirmLabel || 'OK',
            tone: options.tone || 'info',
            resolve,
        });
    }), []);

    const showConfirm = useCallback((message, options = {}) => new Promise((resolve) => {
        setPopup({
            type: 'confirm',
            title: options.title || 'Please confirm',
            message,
            confirmLabel: options.confirmLabel || 'Confirm',
            cancelLabel: options.cancelLabel || 'Cancel',
            tone: options.tone || 'danger',
            resolve,
        });
    }), []);

    const value = useMemo(() => ({
        alert: showAlert,
        confirm: showConfirm,
    }), [showAlert, showConfirm]);

    const tone = popup ? toneStyles[popup.tone] || toneStyles.info : toneStyles.info;
    const Icon = tone.icon;

    return (
        <PopupContext.Provider value={value}>
            {children}

            {popup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
                        <div className="flex items-start justify-between gap-4">
                            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone.iconClassName}`}>
                                <Icon size={22} />
                            </div>
                            <button
                                type="button"
                                onClick={() => closePopup(false)}
                                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Close popup"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-4">
                            <h3 className="text-xl font-semibold text-slate-950">{popup.title}</h3>
                            <p className="mt-2 text-sm leading-7 text-slate-600">{popup.message}</p>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            {popup.type === 'confirm' && (
                                <button
                                    type="button"
                                    onClick={() => closePopup(false)}
                                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                    {popup.cancelLabel}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => closePopup(true)}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tone.buttonClassName}`}
                            >
                                {popup.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PopupContext.Provider>
    );
}

export function usePopup() {
    const context = useContext(PopupContext);

    if (!context) {
        throw new Error('usePopup must be used within PopupProvider');
    }

    return context;
}
