import { els } from '../core/elements.js';
import { state } from '../core/state.js';
import { normalizeUrl, createSiteId } from '../core/utils.js';
import { renderSites } from './sites.js';
import { updateSearchResults } from './search.js';
import { saveNavData } from '../services/navStorage.js';

let modalState = { mode: 'add', categoryIndex: 0, itemIndex: null };

function getSiteByTarget(target) {
    if (!target) return null;
    const category = state.categories[target.categoryIndex];
    if (!category) return null;
    const item = (category.items || [])[target.itemIndex];
    if (!item) return null;
    return { category, item };
}

export function openBookmarkModal(mode, target) {
    if (!els.modalOverlay) return;
    modalState = {
        mode,
        categoryIndex: typeof target?.categoryIndex === 'number' ? target.categoryIndex : state.activeIndex,
        itemIndex: typeof target?.itemIndex === 'number' ? target.itemIndex : null
    };

    els.modalOverlay.classList.add('is-visible');
    document.body.classList.add('modal-open');

    els.modalSubmit.classList.remove('btn-danger');
    els.modalForm.classList.remove('is-hidden');
    els.modalConfirm.classList.add('is-hidden');

    if (mode === 'add') {
        els.modalTitle.textContent = '添加书签';
        els.modalSubmit.textContent = '保存';
        els.bookmarkName.value = '';
        els.bookmarkUrl.value = '';
        els.bookmarkName.focus();
        return;
    }

    if (mode === 'edit') {
        const ref = getSiteByTarget(modalState);
        const item = ref ? ref.item : null;
        els.modalTitle.textContent = '编辑书签';
        els.modalSubmit.textContent = '保存';
        els.bookmarkName.value = item?.name || '';
        els.bookmarkUrl.value = item?.url || '';
        els.bookmarkName.focus();
        return;
    }

    if (mode === 'delete') {
        const ref = getSiteByTarget(modalState);
        const item = ref ? ref.item : null;
        els.modalTitle.textContent = '删除书签';
        els.modalSubmit.textContent = '删除';
        els.modalSubmit.classList.add('btn-danger');
        els.modalForm.classList.add('is-hidden');
        els.modalConfirm.classList.remove('is-hidden');
        els.modalMessage.textContent = item ? `确定删除“${item.name || item.url}”吗？` : '确定删除该书签吗？';
    }
}

export function closeBookmarkModal() {
    if (!els.modalOverlay) return;
    els.modalOverlay.classList.remove('is-visible');
    document.body.classList.remove('modal-open');
}

export function handleModalSubmit() {
    if (modalState.mode === 'delete') {
        const category = state.categories[modalState.categoryIndex];
        if (!category || !Array.isArray(category.items)) return;
        category.items.splice(modalState.itemIndex, 1);
        saveNavData();
        renderSites();
        updateSearchResults();
        closeBookmarkModal();
        return;
    }

    const name = els.bookmarkName.value.trim();
    const url = normalizeUrl(els.bookmarkUrl.value);
    if (!name || !url) {
        alert('请填写正确的名称和链接');
        return;
    }

    if (modalState.mode === 'edit') {
        const ref = getSiteByTarget(modalState);
        if (!ref) return;
        ref.item.name = name;
        ref.item.url = url;
        saveNavData();
        renderSites();
        updateSearchResults();
        closeBookmarkModal();
        return;
    }

    const category = state.categories[modalState.categoryIndex];
    if (!category) return;
    if (!Array.isArray(category.items)) category.items = [];
    // 在当前页的最后加入（使用push而不是unshift）
    category.items.push({ id: createSiteId(), name, url });
    saveNavData();
    renderSites();
    updateSearchResults();
    closeBookmarkModal();
}

export function bindBookmarkModal() {
    if (els.modalClose) {
        els.modalClose.addEventListener('click', closeBookmarkModal);
    }

    if (els.modalCancel) {
        els.modalCancel.addEventListener('click', closeBookmarkModal);
    }

    if (els.modalSubmit) {
        els.modalSubmit.addEventListener('click', handleModalSubmit);
    }

    if (els.modalOverlay) {
        els.modalOverlay.addEventListener('click', (e) => {
            if (e.target === els.modalOverlay) closeBookmarkModal();
        });
    }

    [els.bookmarkName, els.bookmarkUrl].forEach(input => {
        if (!input) return;
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleModalSubmit();
            }
        });
    });
}
