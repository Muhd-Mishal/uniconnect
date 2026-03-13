const isBrowser = typeof window !== 'undefined';
const hostname = isBrowser ? window.location.hostname : '';
const origin = isBrowser ? window.location.origin : '';
const protocol = isBrowser ? window.location.protocol : 'http:';
const port = isBrowser ? window.location.port : '';
const hostWithBackendPort = `${protocol}//${hostname}:3000`;

const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
const isViteDevHost = port === '5173' || port === '5174' || port === '5175';

export const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    (isLocalHost || isViteDevHost ? `${hostWithBackendPort}/api` : `${origin}/api`);

export const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    (isLocalHost || isViteDevHost ? hostWithBackendPort : origin);

export const API_ORIGIN =
    import.meta.env.VITE_API_ORIGIN ||
    (isLocalHost || isViteDevHost ? hostWithBackendPort : origin);
