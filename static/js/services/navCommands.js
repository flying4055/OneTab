import { state } from '../core/state.js';
import { moveItem } from '../core/utils.js';
import { saveNavData } from './navStorage.js';
import { saveTabState, getValidTabIndex } from './tabState.js';
import { rebuildSearchIndex } from './searchIndex.js';

function isValidIndex(index, list) {
    return Number.isInteger(index) && index >= 0 && index < (list?.length || 0);
}

function commitNavMutation() {
    const saved = saveNavData();
    rebuildSearchIndex(state.categories);
    return saved;
}

function normalizeCategoryItems(category) {
    if (!category) return null;
    if (!Array.isArray(category.items)) {
        category.items = [];
    }
    return category.items;
}

function adjustActiveIndexAfterTabMove(from, to) {
    const current = state.activeIndex;
    if (current === from) {
        state.activeIndex = to;
        return;
    }
    if (from < current && to >= current) {
        state.activeIndex = current - 1;
        return;
    }
    if (from > current && to <= current) {
        state.activeIndex = current + 1;
    }
}

export function initializeNavState(categories) {
    state.categories = Array.isArray(categories) ? categories : [];
    state.activeIndex = getValidTabIndex(state.activeIndex, state.categories);
    saveTabState();
    rebuildSearchIndex(state.categories);
}

export function replaceCategories(categories, options = {}) {
    const { persist = true, keepActiveIndex = true } = options;
    state.categories = Array.isArray(categories) ? categories : [];
    state.activeIndex = keepActiveIndex
        ? getValidTabIndex(state.activeIndex, state.categories)
        : 0;
    saveTabState();
    rebuildSearchIndex(state.categories);
    if (!persist) return true;
    return saveNavData();
}

export function setActiveTabIndex(index) {
    const validIndex = getValidTabIndex(index, state.categories);
    if (validIndex === state.activeIndex) return false;
    state.activeIndex = validIndex;
    saveTabState();
    return true;
}

export function reorderCategory(from, to) {
    if (!isValidIndex(from, state.categories) || !isValidIndex(to, state.categories) || from === to) {
        return false;
    }
    moveItem(state.categories, from, to);
    adjustActiveIndexAfterTabMove(from, to);
    saveTabState();
    commitNavMutation();
    return true;
}

export function reorderSite(categoryIndex, from, to) {
    const category = state.categories[categoryIndex];
    const items = normalizeCategoryItems(category);
    if (!items || !isValidIndex(from, items) || !isValidIndex(to, items) || from === to) {
        return false;
    }
    moveItem(items, from, to);
    commitNavMutation();
    return true;
}

export function addSite(categoryIndex, site) {
    const category = state.categories[categoryIndex];
    const items = normalizeCategoryItems(category);
    if (!items || !site) return false;
    items.push(site);
    commitNavMutation();
    return true;
}

export function updateSite(categoryIndex, itemIndex, updater) {
    const category = state.categories[categoryIndex];
    const items = normalizeCategoryItems(category);
    if (!items || !isValidIndex(itemIndex, items)) return false;

    const target = items[itemIndex];
    if (typeof updater === 'function') {
        updater(target);
    } else if (updater && typeof updater === 'object') {
        Object.assign(target, updater);
    }

    commitNavMutation();
    return true;
}

export function removeSite(categoryIndex, itemIndex) {
    const category = state.categories[categoryIndex];
    const items = normalizeCategoryItems(category);
    if (!items || !isValidIndex(itemIndex, items)) return false;
    items.splice(itemIndex, 1);
    commitNavMutation();
    return true;
}
