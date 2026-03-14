const isBrowser = typeof window !== 'undefined';
const hostname = isBrowser ? window.location.hostname : '';
const origin = isBrowser ? window.location.origin : '';
const protocol = isBrowser ? window.location.protocol : 'http:';
const port = isBrowser ? window.location.port : '';
const hostWithBackendPort = `${protocol}//${hostname}:3000`;

const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
const isViteDevHost = ['5173', '5174', '5175'].includes(port);

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');
const stripApiSuffix = (value = '') => value.replace(/\/api\/?$/i, '');

const localApiOrigin = hostWithBackendPort;
const fallbackApiOrigin = isLocalHost || isViteDevHost ? localApiOrigin : origin;

const configuredApiUrl = trimTrailingSlash(import.meta.env.VITE_API_URL || '');
const configuredApiOrigin = trimTrailingSlash(import.meta.env.VITE_API_ORIGIN || '');
const configuredSocketUrl = trimTrailingSlash(import.meta.env.VITE_SOCKET_URL || '');

const isVercelHost = hostname.endsWith('.vercel.app');
const shouldUseSameOriginApi = isBrowser && !isLocalHost && !isViteDevHost && isVercelHost;

const resolvedApiOrigin =
    configuredApiOrigin ||
    (configuredApiUrl ? stripApiSuffix(configuredApiUrl) : fallbackApiOrigin);

export const API_ORIGIN = shouldUseSameOriginApi ? origin : resolvedApiOrigin;

export const API_BASE_URL = shouldUseSameOriginApi
    ? '/api'
    : configuredApiUrl
        ? `${stripApiSuffix(configuredApiUrl)}/api`
        : `${resolvedApiOrigin}/api`;

export const SOCKET_URL = configuredSocketUrl || resolvedApiOrigin;
