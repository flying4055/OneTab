import { state } from '../core/state.js';
import { ALLOWED_ICON_HOSTS } from '../core/constants.js';

const FAVICON_CACHE_KEY = 'favicon_cache_v1';

export function getFavicon(url) {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
        return '';
    }
}

export function isAllowedIconUrl(url) {
    if (!url) return false;
    if (url.startsWith('data:')) return true;
    if (url.startsWith('chrome-extension://')) return true;
    if (url.startsWith(location.origin)) return true;
    try {
        const host = new URL(url).hostname.toLowerCase();
        return ALLOWED_ICON_HOSTS.some(allowed => host === allowed || host.endsWith(`.${allowed}`));
    } catch {
        return false;
    }
}

export function getIcon(site) {
    if (site && site.src && isAllowedIconUrl(site.src)) return site.src;
    return getFavicon(site.url);
}

export function loadFaviconCache() {
    try {
        const raw = localStorage.getItem(FAVICON_CACHE_KEY);
        if (raw) state.faviconCache = JSON.parse(raw) || {};
    } catch {
        state.faviconCache = {};
    }
}

export function saveFaviconCache() {
    try {
        localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(state.faviconCache));
    } catch {
        // Ignore quota errors.
    }
}

export function cacheFavicon(domain, dataUrl) {
    if (!domain || !dataUrl) return;
    state.faviconCache[domain] = { dataUrl, ts: Date.now() };
    saveFaviconCache();
}

export function getCachedFavicon(domain) {
    if (!domain) return '';
    const entry = state.faviconCache[domain];
    return entry && entry.dataUrl ? entry.dataUrl : '';
}

export function tryCacheIcon(img, domain) {
    if (!img || !domain) return;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 32;
        canvas.height = img.naturalHeight || 32;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        cacheFavicon(domain, dataUrl);
    } catch {
        // If canvas is tainted or any error occurs, skip caching.
    }
}

export function canCacheIcon(url) {
    if (!url) return false;
    if (url.startsWith('data:')) return true;
    if (url.startsWith(location.origin)) return true;
    if (url.startsWith('chrome-extension://')) return true;
    return false;
}
