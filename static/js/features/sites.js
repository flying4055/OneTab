import { state } from '../core/state.js';
import { els } from '../core/elements.js';
import { openContextMenu } from './contextMenu.js';
import { updateSearchResults } from './search.js';
import { getSiteIcon, getSiteIconCandidates, preloadSiteIcons } from '../services/favicon.js';
import { reorderSite } from '../services/navCommands.js';
import { recordSiteFirstBatch } from '../services/perfBaseline.js';

const PRIORITY_ICON_LOAD_COUNT = 24;
const PRELOAD_ICON_COUNT = 24;
const INITIAL_RENDER_BATCH_COUNT = 18;
const NEXT_RENDER_BATCH_SIZE = 36;
const LAZY_ICON_ROOT_MARGIN = '120px 0px';

let currentRenderToken = 0;
let currentLazyIconObserver = null;
let pendingPreloadTimer = null;
let pendingPreloadIdleTask = null;
const activeIconLoadControllers = new Set();
const lazyIconPayloadMap = new WeakMap();
const pendingRenderFrameIds = new Set();
const pendingRenderTimerIds = new Set();
const reusableLoadedIconMap = new Map();

function getNow() {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        return performance.now();
    }
    return Date.now();
}

function scheduleRenderFrame(callback) {
    if ('requestAnimationFrame' in window) {
        const frameId = requestAnimationFrame(() => {
            pendingRenderFrameIds.delete(frameId);
            callback();
        });
        pendingRenderFrameIds.add(frameId);
        return;
    }

    const timerId = setTimeout(() => {
        pendingRenderTimerIds.delete(timerId);
        callback();
    }, 16);
    pendingRenderTimerIds.add(timerId);
}

function cancelPendingRenderTasks() {
    for (const frameId of pendingRenderFrameIds) {
        cancelAnimationFrame(frameId);
    }
    pendingRenderFrameIds.clear();

    for (const timerId of pendingRenderTimerIds) {
        clearTimeout(timerId);
    }
    pendingRenderTimerIds.clear();
}

function cancelPendingPreloadTasks() {
    if (pendingPreloadTimer !== null) {
        clearTimeout(pendingPreloadTimer);
        pendingPreloadTimer = null;
    }
    if (pendingPreloadIdleTask !== null && 'cancelIdleCallback' in window) {
        cancelIdleCallback(pendingPreloadIdleTask);
        pendingPreloadIdleTask = null;
    }
}

function resetIconLoadingState() {
    for (const controller of activeIconLoadControllers) {
        controller.abort();
    }
    activeIconLoadControllers.clear();

    if (currentLazyIconObserver) {
        currentLazyIconObserver.disconnect();
        currentLazyIconObserver = null;
    }

    cancelPendingPreloadTasks();
    cancelPendingRenderTasks();
}

function queueSiteIconLoad(site, iconContainer, renderToken) {
    const controller = new AbortController();
    activeIconLoadControllers.add(controller);
    loadSiteIcon(site, iconContainer, {
        renderToken,
        signal: controller.signal
    }).finally(() => {
        activeIconLoadControllers.delete(controller);
    });
}

function ensureLazyIconObserver(renderToken) {
    if (currentLazyIconObserver) return currentLazyIconObserver;

    currentLazyIconObserver = new IntersectionObserver((observerEntries, observer) => {
        if (renderToken !== currentRenderToken) return;

        observerEntries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const payload = lazyIconPayloadMap.get(entry.target);
            observer.unobserve(entry.target);
            lazyIconPayloadMap.delete(entry.target);

            if (!payload) return;
            queueSiteIconLoad(payload.site, payload.iconContainer, renderToken);
        });
    }, {
        root: null,
        rootMargin: LAZY_ICON_ROOT_MARGIN,
        threshold: 0.01
    });

    return currentLazyIconObserver;
}

function observeLazyIconEntries(entries, renderToken) {
    if (!entries.length) return;

    if (!('IntersectionObserver' in window)) {
        entries.forEach(({ site, iconContainer }) => {
            queueSiteIconLoad(site, iconContainer, renderToken);
        });
        return;
    }

    const observer = ensureLazyIconObserver(renderToken);
    entries.forEach(({ card, site, iconContainer }) => {
        lazyIconPayloadMap.set(card, { site, iconContainer });
        observer.observe(card);
    });
}

function createSiteCard(site, idx, renderToken, lazyIconEntries, priorityIconEntries) {
    const card = document.createElement('a');
    card.className = 'site-card';
    card.href = site.url;
    card.target = '_self';
    card.rel = 'noreferrer';
    card.dataset.categoryIndex = String(state.activeIndex);
    card.dataset.itemIndex = String(idx);
    card.draggable = true;

    card.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        event.stopPropagation();

        openContextMenu(event.clientX, event.clientY, {
            type: 'site',
            categoryIndex: state.activeIndex,
            itemIndex: idx
        });
    });

    card.addEventListener('dragstart', (event) => {
        state.dragSiteIndex = idx;
        card.classList.add('is-dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', site.url || '');
    });

    card.addEventListener('dragover', (event) => {
        if (state.dragSiteIndex === null || state.dragSiteIndex === idx) return;
        event.preventDefault();
        card.classList.add('is-drag-over');
    });

    card.addEventListener('dragleave', () => {
        card.classList.remove('is-drag-over');
    });

    card.addEventListener('drop', (event) => {
        event.preventDefault();
        card.classList.remove('is-drag-over');
        const from = state.dragSiteIndex;
        if (from === null || from === idx) return;

        const moved = reorderSite(state.activeIndex, from, idx);
        state.dragSiteIndex = null;
        if (!moved) return;

        renderSites();
        updateSearchResults();
    });

    card.addEventListener('dragend', () => {
        state.dragSiteIndex = null;
        card.classList.remove('is-dragging');
        card.classList.remove('is-drag-over');
    });

    const icon = document.createElement('div');
    icon.className = 'site-icon';
    icon.style.backgroundColor = site['bg-color'] || site.backgroundColor || '#f0f9ff';
    icon.dataset.siteIconKey = getSiteIconCacheKey(site);

    const placeholder = document.createElement('span');
    placeholder.className = 'site-fallback';
    placeholder.textContent = (site.name || '').slice(0, 1);
    icon.appendChild(placeholder);

    if (idx < PRIORITY_ICON_LOAD_COUNT) {
        priorityIconEntries.push({
            site,
            iconContainer: icon
        });
    } else {
        lazyIconEntries.push({
            card,
            site,
            iconContainer: icon
        });
    }

    const title = document.createElement('div');
    title.className = 'site-title';
    title.textContent = site.name || '';
    title.title = site.name || '';

    card.appendChild(icon);
    card.appendChild(title);
    return card;
}

function getSiteIconCacheKey(site) {
    return [
        String(site?.id || ''),
        String(site?.url || ''),
        String(site?.src || ''),
        String(site?.iconSource || '')
    ].join('|');
}

function snapshotLoadedIconsFromGrid() {
    if (!els.siteGrid) return;

    const iconNodes = els.siteGrid.querySelectorAll('.site-icon[data-site-icon-key]');
    iconNodes.forEach((iconNode) => {
        const key = String(iconNode.dataset.siteIconKey || '').trim();
        if (!key) return;

        const imageNode = iconNode.querySelector('.site-img');
        if (!imageNode || imageNode.naturalWidth <= 0) return;
        reusableLoadedIconMap.set(key, imageNode);
    });
}

function restoreLoadedIcon(site, iconContainer) {
    const siteKey = getSiteIconCacheKey(site);
    if (!siteKey) return false;

    const cachedImage = reusableLoadedIconMap.get(siteKey);
    if (!cachedImage) return false;
    if (cachedImage.naturalWidth <= 0) {
        reusableLoadedIconMap.delete(siteKey);
        return false;
    }

    reusableLoadedIconMap.delete(siteKey);
    cachedImage.style.display = '';
    iconContainer.appendChild(cachedImage);

    const fallback = iconContainer.querySelector('.site-fallback');
    if (fallback) {
        fallback.remove();
    }
    return true;
}

function renderSiteRange(items, start, end, renderToken) {
    if (!els.siteGrid) return;
    if (renderToken !== currentRenderToken) return;

    const fragment = document.createDocumentFragment();
    const lazyIconEntries = [];
    const priorityIconEntries = [];

    for (let idx = start; idx < end; idx += 1) {
        const site = items[idx];
        if (!site) continue;
        const card = createSiteCard(site, idx, renderToken, lazyIconEntries, priorityIconEntries);
        fragment.appendChild(card);
    }

    els.siteGrid.appendChild(fragment);

    // 关键修复：优先图标必须在节点挂载到 DOM 后再启动加载，否则 isConnected 为 false 会直接跳过
    for (const entry of priorityIconEntries) {
        queueSiteIconLoad(entry.site, entry.iconContainer, renderToken);
    }

    observeLazyIconEntries(lazyIconEntries, renderToken);
}

function renderRemainingInBatches(items, start, renderToken) {
    let cursor = start;

    const renderNextBatch = () => {
        if (renderToken !== currentRenderToken) return;
        if (cursor >= items.length) return;

        const end = Math.min(items.length, cursor + NEXT_RENDER_BATCH_SIZE);
        renderSiteRange(items, cursor, end, renderToken);
        cursor = end;

        if (cursor < items.length) {
            scheduleRenderFrame(renderNextBatch);
        }
    };

    scheduleRenderFrame(renderNextBatch);
}

export function renderSites() {
    if (!els.siteGrid) return;
    currentRenderToken += 1;
    const renderToken = currentRenderToken;

    // 关键优化：切换 tab 前先缓存已加载图标，回到该 tab 时优先复用，避免重复请求导致图标退化
    snapshotLoadedIconsFromGrid();
    resetIconLoadingState();
    els.siteGrid.innerHTML = '';

    const category = state.categories[state.activeIndex];
    const items = category ? (category.items || []) : [];
    if (!items.length) return;

    const visibleSites = items.slice(0, PRELOAD_ICON_COUNT);
    preloadVisibleIcons(visibleSites, renderToken);

    const initialCount = Math.min(items.length, INITIAL_RENDER_BATCH_COUNT);
    const firstBatchStartMs = getNow();
    renderSiteRange(items, 0, initialCount, renderToken);
    recordSiteFirstBatch(getNow() - firstBatchStartMs, initialCount, items.length);

    if (initialCount < items.length) {
        renderRemainingInBatches(items, initialCount, renderToken);
    }
}

async function loadSiteIcon(site, iconContainer, options = {}) {
    const { renderToken, signal } = options;
    if (!iconContainer || !iconContainer.isConnected) return;
    if (renderToken !== currentRenderToken || signal?.aborted) return;
    if (restoreLoadedIcon(site, iconContainer)) return;

    try {
        const resolvedIconUrl = await getSiteIcon(site, { signal });
        const candidateUrls = buildIconCandidateQueue(site, resolvedIconUrl);
        if (!candidateUrls.length) return;
        if (renderToken !== currentRenderToken || signal?.aborted) return;
        if (!iconContainer.isConnected) return;

        if (iconContainer.querySelector('.site-img')) return;

        mountSiteIconFromCandidates(iconContainer, candidateUrls, {
            renderToken,
            signal
        });
    } catch (error) {
        if (error?.name === 'AbortError') return;
        console.warn('加载站点图标失败:', error);
    }
}

function buildIconCandidateQueue(site, resolvedIconUrl) {
    const queue = [];
    if (resolvedIconUrl) {
        queue.push(String(resolvedIconUrl).trim());
    }
    const fallbackCandidates = getSiteIconCandidates(site);
    for (const candidate of fallbackCandidates) {
        const value = String(candidate || '').trim();
        if (!value || queue.includes(value)) continue;
        queue.push(value);
    }
    return queue;
}

function mountSiteIconFromCandidates(iconContainer, candidates, context) {
    const { renderToken, signal } = context;

    const tryMount = (index) => {
        if (index >= candidates.length) return;
        if (renderToken !== currentRenderToken || signal?.aborted || !iconContainer.isConnected) return;
        if (iconContainer.querySelector('.site-img')) return;

        const img = document.createElement('img');
        img.className = 'site-img';
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.style.display = 'none';

        const finalizeSuccess = () => {
            if (renderToken !== currentRenderToken || signal?.aborted || !iconContainer.isConnected) {
                img.remove();
                return;
            }
            img.removeEventListener('load', finalizeSuccess);
            img.removeEventListener('error', handleError);
            const fallback = iconContainer.querySelector('.site-fallback');
            if (fallback) {
                fallback.remove();
            }
            img.style.display = '';
        };

        const handleError = () => {
            img.removeEventListener('load', finalizeSuccess);
            img.removeEventListener('error', handleError);
            img.remove();
            // 关键兜底：当前候选失败时继续尝试下一个图标地址，避免直接退化为文字图标
            tryMount(index + 1);
        };

        img.addEventListener('load', finalizeSuccess);
        img.addEventListener('error', handleError);

        img.src = candidates[index];
        iconContainer.appendChild(img);

        if (img.complete && img.naturalWidth > 0) {
            finalizeSuccess();
        }
    };

    tryMount(0);
}

function preloadVisibleIcons(sites, renderToken) {
    if (!Array.isArray(sites) || sites.length === 0) return;

    const runPreload = async () => {
        if (renderToken !== currentRenderToken) return;
        try {
            await preloadSiteIcons(sites);
        } catch (error) {
            console.warn('预加载图标失败:', error);
        }
    };

    if ('requestIdleCallback' in window) {
        pendingPreloadIdleTask = requestIdleCallback(() => {
            pendingPreloadIdleTask = null;
            runPreload();
        }, { timeout: 1600 });
    } else {
        pendingPreloadTimer = setTimeout(() => {
            pendingPreloadTimer = null;
            runPreload();
        }, 500);
    }
}

export function bindSiteGridDrag() {
    if (!els.siteGrid) return;
    els.siteGrid.addEventListener('dragover', (event) => {
        if (state.dragSiteIndex === null) return;
        event.preventDefault();
    });

    els.siteGrid.addEventListener('drop', (event) => {
        if (state.dragSiteIndex === null) return;
        if (event.target.closest('.site-card')) return;

        const category = state.categories[state.activeIndex];
        const itemCount = category?.items?.length || 0;
        if (!itemCount) return;

        const from = state.dragSiteIndex;
        const to = itemCount - 1;
        const moved = reorderSite(state.activeIndex, from, to);
        state.dragSiteIndex = null;
        if (!moved) return;

        renderSites();
        updateSearchResults();
    });
}
