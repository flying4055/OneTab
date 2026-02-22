import { WALLPAPER_MAX_DATA_URL } from '../core/constants.js';
import { normalizeNav, normalizeUrl } from '../core/utils.js';

const NAV_SCHEMA_VERSION = 1;

function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeText(value) {
    return String(value || '').trim();
}

function isValidHttpUrl(value) {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

function sanitizeSite(item, categoryIndex, itemIndex) {
    if (!isPlainObject(item)) return null;

    const name = sanitizeText(item.name);
    const normalizedUrl = normalizeUrl(item.url);
    if (!name || !normalizedUrl || !isValidHttpUrl(normalizedUrl)) {
        return null;
    }

    const fallbackId = `site-${categoryIndex}-${itemIndex}`;
    const id = sanitizeText(item.id) || fallbackId;

    return {
        ...item,
        id,
        name,
        url: normalizedUrl
    };
}

function sanitizeCategory(category, index) {
    if (!isPlainObject(category)) return null;

    const id = sanitizeText(category.id) || `cat-${index}`;
    const label = sanitizeText(category.label) || `分类 ${index + 1}`;
    const rawItems = Array.isArray(category.items) ? category.items : [];
    const items = rawItems
        .map((item, itemIndex) => sanitizeSite(item, index, itemIndex))
        .filter(Boolean);

    return {
        ...category,
        id,
        label,
        items
    };
}

export function normalizeAndValidateNavPayload(input) {
    let normalized;
    try {
        normalized = normalizeNav(input);
    } catch {
        return null;
    }

    if (!isPlainObject(normalized)) return null;
    const categories = Array.isArray(normalized.categories) ? normalized.categories : null;
    if (!categories) return null;

    const sanitizedCategories = categories
        .map((category, index) => sanitizeCategory(category, index))
        .filter(Boolean);

    return {
        version: NAV_SCHEMA_VERSION,
        categories: sanitizedCategories
    };
}

export function parseNavStoragePayload(raw) {
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        return normalizeAndValidateNavPayload(parsed);
    } catch {
        return null;
    }
}

export function serializeNavStoragePayload(categories) {
    const payload = normalizeAndValidateNavPayload({
        version: NAV_SCHEMA_VERSION,
        categories
    });
    if (!payload) return '';
    return JSON.stringify(payload);
}

export function parseTabStatePayload(raw) {
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        if (!isPlainObject(parsed)) return null;
        if (!Number.isInteger(parsed.activeIndex) || parsed.activeIndex < 0) return null;
        return {
            activeIndex: parsed.activeIndex,
            timestamp: Number.isFinite(parsed.timestamp) ? parsed.timestamp : Date.now()
        };
    } catch {
        return null;
    }
}

export function serializeTabStatePayload(activeIndex) {
    if (!Number.isInteger(activeIndex) || activeIndex < 0) return '';
    return JSON.stringify({
        activeIndex,
        timestamp: Date.now()
    });
}

export function isValidWallpaperDataUrl(dataUrl) {
    if (typeof dataUrl !== 'string') return false;
    const value = dataUrl.trim();
    if (!value) return false;
    if (!value.startsWith('data:image/')) return false;
    return value.length <= WALLPAPER_MAX_DATA_URL;
}

export function parseWallpaperStorageValue(raw) {
    if (!raw) return '';
    return isValidWallpaperDataUrl(raw) ? raw : '';
}

export function serializeWallpaperStorageValue(dataUrl) {
    if (!isValidWallpaperDataUrl(dataUrl)) return '';
    return dataUrl;
}
