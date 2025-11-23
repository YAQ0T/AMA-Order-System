const DEFAULT_API_PORT = '3003';

const normalizeBaseUrl = (url) => {
    if (!url) return null;
    return url.endsWith('/') ? url.slice(0, -1) : url;
};

const buildDefaultApiUrl = () => {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:${DEFAULT_API_PORT}`;
};

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL) || buildDefaultApiUrl();
