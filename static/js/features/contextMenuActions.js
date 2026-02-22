import { els } from '../core/elements.js';
import { getContextTarget, closeContextMenu } from './contextMenu.js';
import { openBookmarkModal } from './modals.js';
import { copySearchInput, pasteSearchInputPlainText } from './search.js';
import { state } from '../core/state.js';

export function bindContextMenuActions() {
    if (!els.contextMenu) return;

    els.contextMenu.addEventListener('click', async (event) => {
        const action = event.target.closest('[data-action]')?.dataset.action;
        if (!action) return;

        const contextTarget = getContextTarget();
        closeContextMenu();

        if (action === 'add') {
            openBookmarkModal('add', { categoryIndex: state.activeIndex });
            return;
        }

        if (action === 'edit' && contextTarget?.type === 'site') {
            openBookmarkModal('edit', contextTarget);
            return;
        }

        if (action === 'delete' && contextTarget?.type === 'site') {
            openBookmarkModal('delete', contextTarget);
            return;
        }

        if (action === 'copy' && contextTarget?.type === 'search') {
            await copySearchInput();
            return;
        }

        if (action === 'paste' && contextTarget?.type === 'search') {
            await pasteSearchInputPlainText();
        }
    });
}
