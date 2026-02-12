import { els } from '../core/elements.js';

let contextTarget = null;

export function openContextMenu(x, y, target) {
    if (!els.contextMenu) return;
    contextTarget = target;
    const menu = els.contextMenu;

    const isSite = target.type === 'site';
    const isSearch = target.type === 'search';
    const isEmpty = target.type === 'empty';
    
    // 先隐藏所有项，再显示对应项
    menu.querySelectorAll('[data-context]').forEach(item => {
        item.classList.add('is-hidden');
    });
    
    menu.querySelectorAll(`[data-context="${target.type}"]`).forEach(item => {
        item.classList.remove('is-hidden');
    });

    menu.classList.add('is-visible');

    requestAnimationFrame(() => {
        const rect = menu.getBoundingClientRect();
        let left = x;
        let top = y;
        const padding = 16;
        
        // 优先向右下方显示，避免遮挡
        if (left + rect.width > window.innerWidth - padding) {
            left = Math.max(padding, x - rect.width);
        }
        if (top + rect.height > window.innerHeight - padding) {
            top = Math.max(padding, y - rect.height);
        }
        
        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
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
