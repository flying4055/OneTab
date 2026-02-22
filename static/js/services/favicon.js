import { state } from '../core/state.js';
import { ALLOWED_ICON_HOSTS } from '../core/constants.js';

const ICON_RESOLVE_TIMEOUT_MS = 4800;
const NEGATIVE_SITE_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_ICON_CANDIDATES = 3;

const LOCAL_FILE_PATH_PREFIXES = [
    'local:',
    'static/',
    '/static/',
    './static/',
    '../static/',
    'icons/',
    '/icons/',
    './icons/',
    '../icons/',
    'assets/',
    '/assets/',
    './assets/',
    '../assets/'
];

const pendingIconRequests = new Map();
const resolvedSiteIconCache = new Map();
const failedSiteIconCache = new Map();

function normalizeUrlForParsing(rawUrl) {
    const value = String(rawUrl || '').trim();
    if (!value) return '';
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value)) return value;
    if (value.startsWith('//')) return `https:${value}`;
    return `https://${value}`;
}

function parseUrl(rawUrl) {
    try {
        const normalized = normalizeUrlForParsing(rawUrl);
        if (!normalized) return null;
        return new URL(normalized);
    } catch {
        return null;
    }
}

function isHttpUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

function isDataImageUrl(url) {
    return String(url || '').startsWith('data:image/');
}

function resolveUrlAgainstSite(rawUrl, siteUrl) {
    const value = String(rawUrl || '').trim();
    if (!value) return '';

    if (value.startsWith('//')) return `https:${value}`;
    if (isHttpUrl(value)) return value;

    const siteParsed = parseUrl(siteUrl);
    if (!siteParsed) return '';
    if (siteParsed.protocol !== 'http:' && siteParsed.protocol !== 'https:') return '';

    try {
        return new URL(value, siteParsed.href).href;
    } catch {
        return '';
    }
}

function dedupeUrls(candidates) {
    const output = [];
    const seen = new Set();

    for (const candidate of candidates || []) {
        const value = String(candidate || '').trim();
        if (!value) continue;
        if (seen.has(value)) continue;
        seen.add(value);
        output.push(value);
    }

    return output;
}

function getHostnameFromUrl(url) {
    return parseUrl(url)?.hostname || '';
}

function isIgnoredLocalFilePath(rawValue) {
    const value = String(rawValue || '').trim().toLowerCase();
    if (!value) return false;
    if (value.startsWith('chrome-extension://')) return true;
    return LOCAL_FILE_PATH_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function sanitizeCandidateUrls(candidates) {
    return dedupeUrls((candidates || []).filter((url) => {
        if (isDataImageUrl(url)) return true;
        return isHttpUrl(url);
    }));
}

function resolveCustomSourceUrl(rawSource, siteUrl) {
    const value = String(rawSource || '').trim();
    if (!value) return '';

    if (isDataImageUrl(value)) return value;
    if (value.startsWith('data:')) return '';
    if (value.startsWith('blob:')) return '';
    if (value.startsWith('chrome-extension://')) return '';
    if (isIgnoredLocalFilePath(value)) return '';

    return resolveUrlAgainstSite(value, siteUrl);
}

function getDuckDuckGoFavicon(siteUrl) {
    const hostname = getHostnameFromUrl(siteUrl);
    if (!hostname) return '';
    return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostname)}.ico`;
}

function buildRemoteFallbackCandidates(siteUrl) {
    return [
        getFavicon(siteUrl),
        getDuckDuckGoFavicon(siteUrl)
    ];
}

function getBrowserFaviconCandidate(siteUrl) {
    const parsed = parseUrl(siteUrl);
    if (!parsed) return '';
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    if (location.protocol !== 'chrome-extension:') return '';

    const runtimeId = globalThis.chrome?.runtime?.id;
    if (!runtimeId) return '';

    return `chrome-extension://${runtimeId}/_favicon/?pageUrl=${encodeURIComponent(parsed.href)}&size=64`;
}

function createAbortError() {
    const error = new Error('Aborted');
    error.name = 'AbortError';
    return error;
}

function throwIfAborted(signal) {
    if (signal?.aborted) throw createAbortError();
}

function loadImageCandidate(candidateUrl, options = {}) {
    const { signal, timeoutMs = ICON_RESOLVE_TIMEOUT_MS } = options;
    if (!candidateUrl) return Promise.resolve(false);

    return new Promise((resolve) => {
        if (signal?.aborted) {
            resolve(false);
            return;
        }

        const img = new Image();
        let settled = false;
        let timeoutId = null;

        const cleanup = () => {
            if (settled) return;
            settled = true;
            img.onload = null;
            img.onerror = null;
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            if (signal) {
                signal.removeEventListener('abort', onAbort);
            }
        };

        const finish = (ok) => {
            cleanup();
            resolve(ok);
        };

        const onAbort = () => finish(false);

        img.onload = () => finish(true);
        img.onerror = () => finish(false);

        if (signal) {
            signal.addEventListener('abort', onAbort, { once: true });
        }

        timeoutId = setTimeout(() => finish(false), timeoutMs);
        img.src = candidateUrl;
    });
}

async function resolveFirstAvailableIcon(candidates, options = {}) {
    const { signal } = options;

    for (const candidateUrl of candidates) {
        throwIfAborted(signal);
        if (!candidateUrl) continue;

        const loaded = await loadImageCandidate(candidateUrl, options);
        throwIfAborted(signal);
        if (loaded) return candidateUrl;
    }

    return '';
}

function getSiteRequestKey(site) {
    const id = String(site?.id || '');
    const url = String(site?.url || '');
    const src = String(site?.src || '');
    const iconSource = String(site?.iconSource || '');
    return `${id}|${url}|${src}|${iconSource}`;
}

function isSiteNegativeCacheHit(requestKey) {
    const expiresAt = failedSiteIconCache.get(requestKey);
    if (!expiresAt) return false;
    if (Date.now() >= expiresAt) {
        failedSiteIconCache.delete(requestKey);
        return false;
    }
    return true;
}

function setSiteNegativeCache(requestKey) {
    failedSiteIconCache.set(requestKey, Date.now() + NEGATIVE_SITE_CACHE_TTL_MS);
}

function clearSiteNegativeCache(requestKey) {
    failedSiteIconCache.delete(requestKey);
}

function buildCustomCandidates(site) {
    const siteUrl = String(site?.url || '').trim();
    const rawCustomSrc = String(site?.src || '').trim();
    if (!rawCustomSrc) return [];

    const resolved = resolveCustomSourceUrl(rawCustomSrc, siteUrl);
    return sanitizeCandidateUrls([resolved]);
}

function buildRemoteCandidates(site) {
    const siteUrl = String(site?.url || '').trim();
    const browserCandidate = sanitizeCandidateUrls([getBrowserFaviconCandidate(siteUrl)]);
    const fallbackCandidates = sanitizeCandidateUrls(buildRemoteFallbackCandidates(siteUrl));

    return dedupeUrls([
        ...browserCandidate,
        ...fallbackCandidates
    ]).slice(0, MAX_ICON_CANDIDATES);
}

function buildSiteIconCandidates(site) {
    if (!site) return [];
    const customCandidates = buildCustomCandidates(site);
    const remoteCandidates = buildRemoteCandidates(site);

    return dedupeUrls([
        ...customCandidates,
        ...remoteCandidates
    ]);
}

export function getFavicon(siteUrl) {
    const hostname = getHostnameFromUrl(siteUrl);
    if (!hostname) return '';
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
}

export function getSiteIconCandidates(site) {
    return buildSiteIconCandidates(site);
}

export async function getSiteIcon(site, options = {}) {
    if (!site) return '';

    const { signal, ignoreNegativeCache = false } = options;
    const requestKey = getSiteRequestKey(site);
    throwIfAborted(signal);

    // 关键优化：同一站点命中后直接复用，避免重复探测所有候选地址
    if (resolvedSiteIconCache.has(requestKey)) {
        return resolvedSiteIconCache.get(requestKey);
    }

    // 预加载场景不应污染失败缓存，避免一次网络波动导致后续渲染直接跳过
    if (!ignoreNegativeCache && isSiteNegativeCacheHit(requestKey)) {
        return '';
    }

    if (pendingIconRequests.has(requestKey)) {
        return pendingIconRequests.get(requestKey);
    }

    const task = resolveFirstAvailableIcon(buildSiteIconCandidates(site), { signal })
        .then((resolved) => {
            if (resolved) {
                resolvedSiteIconCache.set(requestKey, resolved);
                clearSiteNegativeCache(requestKey);
                return resolved;
            }
            if (!ignoreNegativeCache) {
                setSiteNegativeCache(requestKey);
            }
            return '';
        })
        .catch((error) => {
            if (error?.name === 'AbortError') return '';
            if (!ignoreNegativeCache) {
                setSiteNegativeCache(requestKey);
            }
            return '';
        })
        .finally(() => {
            pendingIconRequests.delete(requestKey);
        });

    pendingIconRequests.set(requestKey, task);
    return task;
}

export function isAllowedIconUrl(url) {
    if (!url) return false;
    if (isDataImageUrl(url)) return true;

    try {
        const host = new URL(url).hostname.toLowerCase();
        return ALLOWED_ICON_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
    } catch {
        return false;
    }
}

export function getIcon(site) {
    const [firstCandidate] = getSiteIconCandidates(site);
    return firstCandidate || '';
}

export async function loadFaviconCache() {
    state.faviconCache = {};
    pendingIconRequests.clear();
    resolvedSiteIconCache.clear();
    failedSiteIconCache.clear();
}

export function saveFaviconCache() {
}

export async function cacheFavicon(domain, dataUrl) {
    void domain;
    void dataUrl;
}

export async function getCachedFavicon(domain) {
    void domain;
    return '';
}

export async function tryCacheIcon(img, domain) {
    void img;
    void domain;
}

export function canCacheIcon(url) {
    return isAllowedIconUrl(url);
}

export function getCacheStats() {
    return {
        cacheDisabled: true,
        pendingSiteRequests: pendingIconRequests.size,
        resolvedSiteCacheSize: resolvedSiteIconCache.size,
        negativeSiteCacheSize: failedSiteIconCache.size
    };
}

export async function preloadSiteIcons(sites) {
    if (!Array.isArray(sites) || sites.length === 0) return;

    const queue = sites.slice(0, 24);
    const batchSize = 6;
    const tasks = [];

    for (const site of queue) {
        tasks.push(getSiteIcon(site, { ignoreNegativeCache: true }).catch(() => ''));
        if (tasks.length >= batchSize) {
            await Promise.all(tasks.splice(0, batchSize));
        }
    }

    if (tasks.length > 0) {
        await Promise.all(tasks);
    }
}

export async function clearAllIconCache() {
    pendingIconRequests.clear();
    resolvedSiteIconCache.clear();
    failedSiteIconCache.clear();
}
