import { els } from '../core/elements.js';
import { state } from '../core/state.js';
import { normalizeNav } from '../core/utils.js';
import { saveNavData } from '../services/navStorage.js';
import { renderTabs } from './tabs.js';
import { renderSites } from './sites.js';
import { updateSearchResults } from './search.js';

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
    const normalized = normalizeNav(data);
    state.categories = normalized.categories || [];
    state.activeIndex = 0;
    saveNavData();
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
