import { state } from '../core/state.js';
import { els } from '../core/elements.js';
import { renderSites } from './sites.js';
import { setActiveTabIndex, reorderCategory } from '../services/navCommands.js';
import { updateSearchResults } from './search.js';

export function renderTabs() {
    if (!els.tabBar) return;
    els.tabBar.innerHTML = '';
    state.categories.forEach((cat, idx) => {
        const li = document.createElement('li');
        li.className = 'tab-btn' + (idx === state.activeIndex ? ' tab-active' : '');
        li.textContent = cat.label;
        li.draggable = true;
        li.dataset.index = String(idx);

        li.addEventListener('click', () => {
            setActiveTabIndex(idx);
            renderTabs();
            renderSites();
        });

        li.addEventListener('dragstart', () => {
            state.dragIndex = idx;
        });

        li.addEventListener('dragover', (e) => e.preventDefault());

        li.addEventListener('drop', () => {
            if (state.dragIndex === null || state.dragIndex === idx) return;
            reorderCategory(state.dragIndex, idx);
            state.dragIndex = null;
            renderTabs();
            renderSites();
            updateSearchResults();
        });

        els.tabBar.appendChild(li);
    });
}
