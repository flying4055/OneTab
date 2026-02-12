import { NAV_STORAGE_KEY } from '../core/constants.js';
import { normalizeNav } from '../core/utils.js';
import { state } from '../core/state.js';

export function saveNavData() {
    try {
        localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify({ version: 1, categories: state.categories }));
    } catch {
        // Ignore quota errors.
    }
}

export function loadNavFromStorage() {
    try {
        const raw = localStorage.getItem(NAV_STORAGE_KEY);
        if (!raw) return null;
        return normalizeNav(JSON.parse(raw));
    } catch {
        return null;
    }
}

export async function loadNavData() {
    const stored = loadNavFromStorage();
    if (stored) {
        return stored.categories;
    }
    try {
        const res = await fetch('nav.json');
        const json = await res.json();
        const data = normalizeNav(json);
        return data.categories;
    } catch {
        return [
            {
                id: 'bookmarks',
                label: '书签',
                items: []
            }
        ];
    }
}
