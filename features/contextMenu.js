import { els } from '../core/elements.js';

let contextTarget = null;

export function openContextMenu(x, y, target) {
    if (!els.contextMenu) return;
    contextTarget = target;
    const menu = els.contextMenu;

    const isSite = target.type === 'site';
    const isSearch = target.type === 'search';
    const isEmpty = target.type === 'empty';
    menu.querySelectorAll('[data-context]').forEach(item => {
        const context = item.dataset.context;
        const visible = (context === 'site' && isSite)
            || (context === 'search' && isSearch)
            || (context === 'empty' && isEmpty);
        item.classList.toggle('is-hidden', !visible);
    });

    menu.classList.add('is-visible');

    requestAnimationFrame(() => {
        const rect = menu.getBoundingClientRect();
        let left = x;
        let top = y;
        const padding = 12;
        if (left + rect.width > window.innerWidth - padding) {
            left = window.innerWidth - rect.width - padding;
        }
        if (top + rect.height > window.innerHeight - padding) {
            top = window.innerHeight - rect.height - padding;
        }
        menu.style.left = `${Math.max(left, padding)}px`;
        menu.style.top = `${Math.max(top, padding)}px`;
    });
}

export function closeContextMenu() {
    if (!els.contextMenu) return;
    els.contextMenu.classList.remove('is-visible');
    contextTarget = null;
}

export function getContextTarget() {
    return contextTarget;
}
