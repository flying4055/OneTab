import { els } from '../core/elements.js';
import { state } from '../core/state.js';
import { normalizeUrl, createSiteId } from '../core/utils.js';
import { renderSites } from './sites.js';
import { updateSearchResults } from './search.js';
import { addSite, updateSite, removeSite } from '../services/navCommands.js';

const ICON_CANVAS_SIZE = 160;
const ICON_WEBP_QUALITY_STEPS = [0.92, 0.84, 0.76, 0.68];
const ICON_MAX_DATA_URL_LENGTH = 240_000;
const BG_COLOR_KEY = 'bg-color';
const DEFAULT_ICON_BG_COLOR = 'transparent';
const COLOR_PICKER_FALLBACK_VALUE = '#ffffff';

let modalState = {
    mode: 'add',
    categoryIndex: 0,
    itemIndex: null,
    originalIconSrc: '',
    originalIconBgColor: DEFAULT_ICON_BG_COLOR,
    customIconDataUrl: '',
    removeCustomIcon: false,
    selectedIconBgColor: DEFAULT_ICON_BG_COLOR
};

function getSiteByTarget(target) {
    if (!target) return null;
    const category = state.categories[target.categoryIndex];
    if (!category) return null;
    const item = (category.items || [])[target.itemIndex];
    if (!item) return null;
    return { category, item };
}

function clearIconPreview() {
    if (!els.bookmarkIconPreview) return;
    while (els.bookmarkIconPreview.firstChild) {
        els.bookmarkIconPreview.removeChild(els.bookmarkIconPreview.firstChild);
    }
}

function normalizeIconBackgroundColor(value) {
    const raw = String(value || '').trim();
    if (!raw) return 'transparent';

    const lower = raw.toLowerCase();
    if (lower === 'transparent' || lower === 'none' || lower === 'rgba(0,0,0,0)' || lower === 'rgba(0, 0, 0, 0)') {
        return 'transparent';
    }

    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) {
        if (raw.length === 4) {
            return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
        }
        return raw.toLowerCase();
    }

    return '';
}

function getSiteIconBackgroundColor(item) {
    const bgColor = normalizeIconBackgroundColor(item?.[BG_COLOR_KEY]);
    if (bgColor) return bgColor;

    const legacyColor = normalizeIconBackgroundColor(item?.backgroundColor);
    if (legacyColor) return legacyColor;

    return DEFAULT_ICON_BG_COLOR;
}

function getEffectiveIconSrc() {
    if (modalState.removeCustomIcon) return '';
    if (modalState.customIconDataUrl) return modalState.customIconDataUrl;
    return modalState.originalIconSrc || '';
}

function getEffectiveIconBgColor() {
    const selected = normalizeIconBackgroundColor(modalState.selectedIconBgColor);
    if (selected) return selected;
    const original = normalizeIconBackgroundColor(modalState.originalIconBgColor);
    if (original) return original;
    return DEFAULT_ICON_BG_COLOR;
}

function syncIconBgInput() {
    if (!els.bookmarkIconBgColor) return;
    const effectiveColor = getEffectiveIconBgColor();
    els.bookmarkIconBgColor.value = effectiveColor === 'transparent'
        ? COLOR_PICKER_FALLBACK_VALUE
        : effectiveColor;
    syncIconBgTriggerSwatch(effectiveColor);
}

function syncIconBgTriggerSwatch(colorValue) {
    if (!els.bookmarkIconBgTriggerSwatch) return;
    const normalized = normalizeIconBackgroundColor(colorValue) || DEFAULT_ICON_BG_COLOR;
    els.bookmarkIconBgTriggerSwatch.style.backgroundColor = normalized === 'transparent' ? 'transparent' : normalized;
    els.bookmarkIconBgTriggerSwatch.classList.toggle('is-transparent', normalized === 'transparent');
}

function renderIconPreview() {
    if (!els.bookmarkIconPreview) return;
    clearIconPreview();
    const effectiveBgColor = getEffectiveIconBgColor();
    els.bookmarkIconPreview.style.backgroundColor = effectiveBgColor === 'transparent' ? 'transparent' : effectiveBgColor;
    els.bookmarkIconPreview.classList.toggle('is-transparent', effectiveBgColor === 'transparent');

    const effectiveIconSrc = getEffectiveIconSrc();
    if (effectiveIconSrc) {
        const img = document.createElement('img');
        img.className = 'bookmark-icon-preview-img';
        img.alt = 'icon preview';
        img.src = effectiveIconSrc;
        img.addEventListener('error', () => {
            img.remove();
            renderIconPreviewPlaceholder();
        }, { once: true });
        els.bookmarkIconPreview.appendChild(img);
        return;
    }

    renderIconPreviewPlaceholder();
}

function renderIconPreviewPlaceholder() {
    if (!els.bookmarkIconPreview) return;
    const placeholder = document.createElement('span');
    placeholder.className = 'bookmark-icon-placeholder';
    placeholder.textContent = '未设置';
    els.bookmarkIconPreview.appendChild(placeholder);
}

function resetIconEditor(item) {
    modalState.originalIconSrc = String(item?.src || '');
    modalState.originalIconBgColor = getSiteIconBackgroundColor(item);
    modalState.customIconDataUrl = '';
    modalState.removeCustomIcon = false;
    modalState.selectedIconBgColor = modalState.originalIconBgColor;
    if (els.bookmarkIconFile) {
        els.bookmarkIconFile.value = '';
    }
    syncIconBgInput();
    renderIconPreview();
}

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('图标文件无法读取'));
        };

        img.src = objectUrl;
    });
}

function drawImageToSquareCanvas(image, canvasSize = ICON_CANVAS_SIZE) {
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const sourceWidth = image.naturalWidth || image.width || canvasSize;
    const sourceHeight = image.naturalHeight || image.height || canvasSize;
    const scale = Math.min(canvasSize / sourceWidth, canvasSize / sourceHeight);
    const drawWidth = Math.max(1, Math.round(sourceWidth * scale));
    const drawHeight = Math.max(1, Math.round(sourceHeight * scale));
    const dx = Math.floor((canvasSize - drawWidth) / 2);
    const dy = Math.floor((canvasSize - drawHeight) / 2);

    ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
    return canvas;
}

function generateCompressedDataUrl(canvas) {
    let output = '';
    for (const quality of ICON_WEBP_QUALITY_STEPS) {
        output = canvas.toDataURL('image/webp', quality);
        if (output && output !== 'data:,' && output.length <= ICON_MAX_DATA_URL_LENGTH) {
            return output;
        }
    }

    if (!output || output === 'data:,') {
        output = canvas.toDataURL('image/png');
    }
    return output;
}

async function convertImageFileToDataUrl(file) {
    if (!file) {
        throw new Error('请选择图标文件');
    }
    if (!String(file.type || '').startsWith('image/')) {
        throw new Error('仅支持图片文件');
    }

    const image = await loadImageFromFile(file);
    const canvas = drawImageToSquareCanvas(image);
    const dataUrl = generateCompressedDataUrl(canvas);
    if (!dataUrl || dataUrl === 'data:,') {
        throw new Error('图标转换失败');
    }
    return dataUrl;
}

async function handleIconFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        const dataUrl = await convertImageFileToDataUrl(file);
        modalState.customIconDataUrl = dataUrl;
        modalState.removeCustomIcon = false;
        renderIconPreview();
    } catch (error) {
        alert(error?.message || '图标处理失败');
    } finally {
        if (els.bookmarkIconFile) {
            els.bookmarkIconFile.value = '';
        }
    }
}

function handleIconBgColorInput(event) {
    const normalized = normalizeIconBackgroundColor(event.target.value);
    modalState.selectedIconBgColor = normalized || DEFAULT_ICON_BG_COLOR;
    syncIconBgInput();
    renderIconPreview();
}

function applyIconChange(item) {
    if (!item) return;

    item[BG_COLOR_KEY] = getEffectiveIconBgColor();
    delete item.backgroundColor;

    if (modalState.removeCustomIcon) {
        delete item.src;
        delete item.iconSource;
        delete item.iconType;
        delete item.iconMime;
        delete item.iconUpdatedAt;
        return;
    }

    if (modalState.customIconDataUrl) {
        item.src = modalState.customIconDataUrl;
        item.type = 'icon';
        item.iconSource = 'custom_upload';
        item.iconType = 'data_url';
        item.iconMime = getDataUrlMime(modalState.customIconDataUrl);
        item.iconUpdatedAt = Date.now();
    }
}

function getDataUrlMime(dataUrl) {
    const value = String(dataUrl || '');
    const match = value.match(/^data:([^;,]+)[;,]/i);
    return match ? String(match[1]).toLowerCase() : '';
}

export function openBookmarkModal(mode, target, options = {}) {
    if (!els.modalOverlay) return;

    modalState = {
        mode,
        categoryIndex: typeof target?.categoryIndex === 'number' ? target.categoryIndex : state.activeIndex,
        itemIndex: typeof target?.itemIndex === 'number' ? target.itemIndex : null,
        originalIconSrc: '',
        originalIconBgColor: DEFAULT_ICON_BG_COLOR,
        customIconDataUrl: '',
        removeCustomIcon: false,
        selectedIconBgColor: DEFAULT_ICON_BG_COLOR
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
        resetIconEditor(null);
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
        resetIconEditor(item);

        if (options.focusIconEditor) {
            if (els.bookmarkIconBgTriggerBtn) {
                els.bookmarkIconBgTriggerBtn.focus();
            } else {
                els.bookmarkIconUploadBtn?.focus();
            }
        } else {
            els.bookmarkName.focus();
        }
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

export function requestBookmarkIconPicker() {
    if (!els.bookmarkIconFile) return;
    els.bookmarkIconFile.click();
}

export function requestBookmarkIconBgPicker() {
    if (!els.bookmarkIconBgColor) return;
    els.bookmarkIconBgColor.click();
}

export function handleModalSubmit() {
    if (modalState.mode === 'delete') {
        const removed = removeSite(modalState.categoryIndex, modalState.itemIndex);
        if (!removed) return;
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
        const updated = updateSite(modalState.categoryIndex, modalState.itemIndex, (target) => {
            target.name = name;
            target.url = url;
            applyIconChange(target);
        });
        if (!updated) return;
        renderSites();
        updateSearchResults();
        closeBookmarkModal();
        return;
    }

    const newSite = { id: createSiteId(), name, url };
    applyIconChange(newSite);

    const created = addSite(modalState.categoryIndex, newSite);
    if (!created) return;

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

    if (els.bookmarkIconUploadBtn) {
        els.bookmarkIconUploadBtn.addEventListener('click', requestBookmarkIconPicker);
    }

    if (els.bookmarkIconResetBtn) {
        els.bookmarkIconResetBtn.addEventListener('click', () => {
            modalState.customIconDataUrl = '';
            modalState.removeCustomIcon = true;
            renderIconPreview();
        });
    }

    if (els.bookmarkIconFile) {
        els.bookmarkIconFile.addEventListener('change', handleIconFileChange);
    }

    if (els.bookmarkIconBgColor) {
        els.bookmarkIconBgColor.addEventListener('input', handleIconBgColorInput);
    }

    if (els.bookmarkIconBgTriggerBtn) {
        els.bookmarkIconBgTriggerBtn.addEventListener('click', requestBookmarkIconBgPicker);
    }

    if (els.bookmarkIconBgResetBtn) {
        els.bookmarkIconBgResetBtn.addEventListener('click', () => {
            modalState.selectedIconBgColor = DEFAULT_ICON_BG_COLOR;
            syncIconBgInput();
            renderIconPreview();
        });
    }

    if (els.bookmarkIconBgPresets) {
        els.bookmarkIconBgPresets.addEventListener('click', (event) => {
            const presetButton = event.target.closest('[data-color]');
            if (!presetButton) return;
            const normalized = normalizeIconBackgroundColor(presetButton.dataset.color);
            modalState.selectedIconBgColor = normalized || DEFAULT_ICON_BG_COLOR;
            syncIconBgInput();
            renderIconPreview();
        });
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
