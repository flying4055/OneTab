import { state } from '../core/state.js';
import { els } from '../core/elements.js';
import { moveItem, getDomain } from '../core/utils.js';
import { openContextMenu } from './contextMenu.js';
import { saveNavData } from '../services/navStorage.js';
import { updateSearchResults } from './search.js';
import {
    getCachedFavicon,
    getIcon,
    tryCacheIcon,
    canCacheIcon
} from '../services/favicon.js';

export function renderSites() {
    if (!els.siteGrid) return;
    els.siteGrid.innerHTML = '';
    const cat = state.categories[state.activeIndex];
    const items = cat ? (cat.items || []) : [];

    items.forEach((site, idx) => {
        const a = document.createElement('a');
        a.className = 'site-card';
        a.href = site.url;
        // a.target = '_blank';
        a.target = '_self';
        a.rel = 'noreferrer';
        a.dataset.categoryIndex = String(state.activeIndex);
        a.dataset.itemIndex = String(idx);
        a.draggable = true;

        a.addEventListener('contextmenu', (e) => {
            if (!e.target.closest('.site-icon')) return;
            e.preventDefault();
            e.stopPropagation();
            openContextMenu(e.clientX, e.clientY, {
                type: 'site',
                categoryIndex: state.activeIndex,
                itemIndex: idx
            });
        });

        a.addEventListener('dragstart', (e) => {
            state.dragSiteIndex = idx;
            a.classList.add('is-dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', site.url || '');
        });

        a.addEventListener('dragover', (e) => {
            if (state.dragSiteIndex === null || state.dragSiteIndex === idx) return;
            e.preventDefault();
            a.classList.add('is-drag-over');
        });

        a.addEventListener('dragleave', () => {
            a.classList.remove('is-drag-over');
        });

        a.addEventListener('drop', (e) => {
            e.preventDefault();
            a.classList.remove('is-drag-over');
            const from = state.dragSiteIndex;
            if (from === null || from === idx) return;
            const category = state.categories[state.activeIndex];
            if (!category || !Array.isArray(category.items)) return;
            moveItem(category.items, from, idx);
            state.dragSiteIndex = null;
            saveNavData();
            renderSites();
            updateSearchResults();
        });

        a.addEventListener('dragend', () => {
            state.dragSiteIndex = null;
            a.classList.remove('is-dragging');
            a.classList.remove('is-drag-over');
        });

        const icon = document.createElement('div');
        icon.className = 'site-icon';
        icon.style.backgroundColor = site.backgroundColor || '#f0f9ff';

        const domain = getDomain(site.url);
        const cached = getCachedFavicon(domain);
        const iconUrl = cached || getIcon(site);
        if (iconUrl) {
            const img = document.createElement('img');
            img.className = 'site-img';
            img.src = iconUrl;
            img.alt = '';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.addEventListener('error', () => {
                img.remove();
                const fallback = document.createElement('span');
                fallback.className = 'site-fallback';
                fallback.textContent = (site.name || '').substr(0, 1);
                icon.appendChild(fallback);
            });
            img.addEventListener('load', () => {
                if (!cached && canCacheIcon(iconUrl)) {
                    tryCacheIcon(img, domain);
                }
            });
            icon.appendChild(img);
        } else {
            const fallback = document.createElement('span');
            fallback.className = 'site-fallback';
            fallback.textContent = (site.name || '').substr(0, 1);
            icon.appendChild(fallback);
        }

        const title = document.createElement('div');
        title.className = 'site-title';
        title.textContent = site.name || '';
        title.title = site.name || '';

        a.appendChild(icon);
        a.appendChild(title);
        els.siteGrid.appendChild(a);
    });
}

export function bindSiteGridDrag() {
    if (!els.siteGrid) return;
    els.siteGrid.addEventListener('dragover', (e) => {
        if (state.dragSiteIndex === null) return;
        e.preventDefault();
    });

    els.siteGrid.addEventListener('drop', (e) => {
        if (state.dragSiteIndex === null) return;
        if (e.target.closest('.site-card')) return;
        const category = state.categories[state.activeIndex];
        if (!category || !Array.isArray(category.items)) return;
        const from = state.dragSiteIndex;
        const to = category.items.length - 1;
        moveItem(category.items, from, to);
        state.dragSiteIndex = null;
        saveNavData();
        renderSites();
        updateSearchResults();
    });
}
