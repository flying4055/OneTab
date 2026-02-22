import { NAV_STORAGE_KEY } from '../core/constants.js';
import { state } from '../core/state.js';
import {
    normalizeAndValidateNavPayload,
    parseNavStoragePayload,
    serializeNavStoragePayload
} from '../contracts/storageContracts.js';

const ICON_SRC_HYDRATE_MARKER_KEY = 'nav_icon_src_hydrated_v1';

function normalizeUrlKey(input) {
    const value = String(input || '').trim();
    if (!value) return '';
    try {
        return new URL(value).toString().toLowerCase();
    } catch {
        return '';
    }
}

function normalizeIconSource(input) {
    const value = String(input || '').trim();
    if (!value) return '';
    if (value.startsWith('data:image/')) return value;
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    return '';
}

function buildSeedSrcMap(categories) {
    const srcMap = new Map();
    for (const category of categories || []) {
        for (const item of category?.items || []) {
            const urlKey = normalizeUrlKey(item?.url);
            const src = normalizeIconSource(item?.src);
            if (!urlKey || !src || srcMap.has(urlKey)) continue;
            srcMap.set(urlKey, src);
        }
    }
    return srcMap;
}

function fillMissingIconSource(categories, srcMap) {
    let changed = 0;
    for (const category of categories || []) {
        for (const item of category?.items || []) {
            const currentSrc = normalizeIconSource(item?.src);
            if (currentSrc) continue;
            const urlKey = normalizeUrlKey(item?.url);
            if (!urlKey) continue;
            const seedSrc = srcMap.get(urlKey);
            if (!seedSrc) continue;
            item.src = seedSrc;
            changed += 1;
        }
    }
    return changed;
}

async function hydrateMissingIconSourceFromSeed(storedCategories) {
    try {
        const marker = localStorage.getItem(ICON_SRC_HYDRATE_MARKER_KEY);
        if (marker === 'done') return storedCategories;
    } catch {
        // Ignore storage errors.
    }

    try {
        const response = await fetch('nav.json');
        if (!response.ok) return storedCategories;
        const seedJson = await response.json();
        const seedData = normalizeAndValidateNavPayload(seedJson);
        if (!seedData) return storedCategories;

        const srcMap = buildSeedSrcMap(seedData.categories);
        if (srcMap.size === 0) return storedCategories;

        const changed = fillMissingIconSource(storedCategories, srcMap);
        if (changed > 0) {
            const serialized = serializeNavStoragePayload(storedCategories);
            if (serialized) {
                localStorage.setItem(NAV_STORAGE_KEY, serialized);
                console.info(`书签图标源已自动补齐 ${changed} 条。`);
            }
        }

        try {
            localStorage.setItem(ICON_SRC_HYDRATE_MARKER_KEY, 'done');
        } catch {
            // Ignore storage errors.
        }

        return storedCategories;
    } catch {
        return storedCategories;
    }
}

export function saveNavData() {
    try {
        const serialized = serializeNavStoragePayload(state.categories);
        if (!serialized) {
            console.warn('保存书签数据失败：数据校验未通过。');
            return false;
        }
        localStorage.setItem(NAV_STORAGE_KEY, serialized);
        return true;
    } catch {
        console.warn('保存书签数据失败：可能是 localStorage 容量不足。');
        return false;
    }
}

export function loadNavFromStorage() {
    try {
        const raw = localStorage.getItem(NAV_STORAGE_KEY);
        if (!raw) return null;
        return parseNavStoragePayload(raw);
    } catch {
        return null;
    }
}

export async function loadNavData() {
    const stored = loadNavFromStorage();
    if (stored) {
        const hydratedCategories = await hydrateMissingIconSourceFromSeed(stored.categories || []);
        return hydratedCategories;
    }
    try {
        const res = await fetch('nav.json');
        const json = await res.json();
        const data = normalizeAndValidateNavPayload(json);
        if (data) {
            return data.categories;
        }
        console.warn('nav.json 校验失败，使用默认分类。');
    } catch {
        // Ignore network errors and fallback to defaults.
    }

    return [
        {
            id: 'bookmarks',
            label: '书签',
            items: []
        }
    ];
}
