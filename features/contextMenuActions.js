import { els } from '../core/elements.js';
import { getContextTarget, closeContextMenu } from './contextMenu.js';
import { openBookmarkModal } from './modals.js';
import { copySearchInput, pasteSearchInputPlainText } from './search.js';
import { state } from '../core/state.js';

export function bindContextMenuActions() {
    if (!els.contextMenu) return;
    els.contextMenu.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (!action) return;
        const contextTarget = getContextTarget();
        if (action === 'add') {
            openBookmarkModal('add', { categoryIndex: state.activeIndex });
        }
        if (action === 'edit' && contextTarget?.type === 'site') {
            openBookmarkModal('edit', contextTarget);
        }
        if (action === 'delete' && contextTarget?.type === 'site') {
            openBookmarkModal('delete', contextTarget);
        }
        if (action === 'copy' && contextTarget?.type === 'search') {
            copySearchInput();
        }
        if (action === 'paste' && contextTarget?.type === 'search') {
            pasteSearchInputPlainText();
        }
        closeContextMenu();
    });
}
