import { state } from '../core/state.js';
import { els } from '../core/elements.js';
import { saveNavData } from '../services/navStorage.js';
import { renderSites } from './sites.js';

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
            state.activeIndex = idx;
            renderTabs();
            renderSites();
        });

        li.addEventListener('dragstart', () => {
            state.dragIndex = idx;
        });

        li.addEventListener('dragover', (e) => e.preventDefault());

        li.addEventListener('drop', () => {
            if (state.dragIndex === null || state.dragIndex === idx) return;
            const moved = state.categories.splice(state.dragIndex, 1)[0];
            state.categories.splice(idx, 0, moved);
            state.dragIndex = null;
            saveNavData();
            renderTabs();
        });

        els.tabBar.appendChild(li);
    });
}
