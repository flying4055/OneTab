import { els } from '../core/elements.js';
import { closeContextMenu } from './contextMenu.js';

export function openSettingsModal() {
    if (!els.settingsOverlay) return;
    els.settingsOverlay.classList.add('is-visible');
    document.body.classList.add('modal-open');
}

export function closeSettingsModal() {
    if (!els.settingsOverlay) return;
    els.settingsOverlay.classList.remove('is-visible');
    document.body.classList.remove('modal-open');
}

export function bindSettings() {
    if (els.settingsBtn) {
        els.settingsBtn.addEventListener('click', () => {
            closeContextMenu();
            openSettingsModal();
        });
    }

    if (els.settingsClose) {
        els.settingsClose.addEventListener('click', closeSettingsModal);
    }

    if (els.settingsOverlay) {
        els.settingsOverlay.addEventListener('click', (e) => {
            if (e.target === els.settingsOverlay) closeSettingsModal();
        });
    }

    // Data actions moved to data panel.
}
