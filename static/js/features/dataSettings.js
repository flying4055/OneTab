import { els } from '../core/elements.js';
import { state } from '../core/state.js';
import { renderTabs } from './tabs.js';
import { renderSites } from './sites.js';
import { updateSearchResults } from './search.js';
import { normalizeAndValidateNavPayload } from '../contracts/storageContracts.js';
import { replaceCategories } from '../services/navCommands.js';

function exportBookmarks() {
    const payload = { version: 1, categories: state.categories };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nav.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

async function importBookmarks(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    const normalized = normalizeAndValidateNavPayload(data);
    if (!normalized) {
        throw new Error('invalid-nav-schema');
    }
    const nextCategories = normalized.categories || [];
    replaceCategories(nextCategories, { persist: true, keepActiveIndex: false });
    renderTabs();
    renderSites();
    updateSearchResults();
}

export function initDataSettings() {
    if (els.dataExport) {
        els.dataExport.addEventListener('click', exportBookmarks);
    }

    if (els.dataImport && els.dataFile) {
        els.dataImport.addEventListener('click', () => {
            els.dataFile.click();
        });
        els.dataFile.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            try {
                await importBookmarks(file);
            } catch {
                alert('导入失败，请确认文件格式为 nav.json。');
            }
            e.target.value = '';
        });
    }
}
