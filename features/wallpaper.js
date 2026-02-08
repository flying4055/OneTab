import { state } from '../core/state.js';
import { els } from '../core/elements.js';
import {
    WALLPAPER_STORAGE_KEY,
    WALLPAPER_MAX_SIZE,
    WALLPAPER_MAX_DIMENSION,
    WALLPAPER_TARGET_DIMENSION,
    WALLPAPER_OPTIMIZE_THRESHOLD,
    WALLPAPER_MAX_DATA_URL
} from '../core/constants.js';

export function applyWallpaper(dataUrl) {
    const next = dataUrl || '';
    if (state.wallpaperDataUrl === next) return;
    state.wallpaperDataUrl = next;
    const value = next ? `url("${next}")` : 'none';
    if (!document.body) return;
    document.body.style.setProperty('--wallpaper-image', value);
}

export function loadWallpaper() {
    try {
        const dataUrl = localStorage.getItem(WALLPAPER_STORAGE_KEY);
        if (dataUrl) {
            applyWallpaper(dataUrl);
        }
    } catch {
        // Ignore storage errors.
    }
}

function saveWallpaper(dataUrl) {
    if (!dataUrl) return false;
    try {
        localStorage.setItem(WALLPAPER_STORAGE_KEY, dataUrl);
        return true;
    } catch {
        return false;
    }
}

export function clearWallpaper() {
    try {
        localStorage.removeItem(WALLPAPER_STORAGE_KEY);
    } catch {
        // Ignore storage errors.
    }
    applyWallpaper('');
    updateWallpaperUI();
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('invalid image'));
        };
        img.src = url;
    });
}

function getScaledSize(width, height, maxDimension) {
    const maxSide = Math.max(width, height);
    if (maxSide <= maxDimension) {
        return { width, height, scale: 1 };
    }
    const scale = maxDimension / maxSide;
    return {
        width: Math.round(width * scale),
        height: Math.round(height * scale),
        scale
    };
}

function canvasToDataUrl(canvas) {
    let dataUrl = canvas.toDataURL('image/webp', 0.86);
    if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', 0.86);
    }
    return dataUrl;
}

function renderImageToDataUrl(img, targetDimension) {
    const size = getScaledSize(img.naturalWidth || img.width, img.naturalHeight || img.height, targetDimension);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvasToDataUrl(canvas);
}

export function updateWallpaperUI() {
    renderWallpaperPreview();
}

function renderWallpaperPreview() {
    if (!els.wallpaperPreview) return;
    els.wallpaperPreview.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'wallpaper-card';

    const thumb = document.createElement('div');
    thumb.className = 'wallpaper-thumb';
    if (state.wallpaperDataUrl) {
        thumb.style.backgroundImage = `url("${state.wallpaperDataUrl}")`;
    } else {
        thumb.classList.add('is-empty');
    }

    const meta = document.createElement('div');
    meta.className = 'wallpaper-meta';
    const title = document.createElement('div');
    title.className = 'wallpaper-title';
    title.textContent = '当前壁纸';
    const credit = document.createElement('div');
    credit.className = 'wallpaper-credit';
    credit.textContent = state.wallpaperDataUrl ? '已应用' : '默认背景';

    meta.appendChild(title);
    meta.appendChild(credit);
    card.appendChild(thumb);
    card.appendChild(meta);
    els.wallpaperPreview.appendChild(card);
}

export function bindWallpaper() {
    if (els.wallpaperUpload && els.wallpaperInput) {
        els.wallpaperUpload.addEventListener('click', () => {
            els.wallpaperInput.click();
        });
        els.wallpaperInput.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            if (!file.type || !file.type.startsWith('image/')) {
                alert('请选择图片文件');
                e.target.value = '';
                return;
            }
            if (file.size > WALLPAPER_MAX_SIZE) {
                alert('图片过大，壁纸限制：大小 ≤ 5MB，最大边 ≤ 4096px。');
                e.target.value = '';
                return;
            }
            try {
                const img = await loadImageFromFile(file);
                const maxSide = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height);
                if (maxSide > WALLPAPER_MAX_DIMENSION) {
                    alert('图片尺寸过大，壁纸限制：大小 ≤ 5MB，最大边 ≤ 4096px。');
                    e.target.value = '';
                    return;
                }
                let dataUrl = '';
                const shouldOptimize = file.size > WALLPAPER_OPTIMIZE_THRESHOLD || maxSide > WALLPAPER_TARGET_DIMENSION;
                if (shouldOptimize) {
                    dataUrl = renderImageToDataUrl(img, WALLPAPER_TARGET_DIMENSION);
                } else {
                    const raw = await readFileAsDataUrl(file);
                    dataUrl = typeof raw === 'string' ? raw : '';
                }
                if (!dataUrl) return;
                if (dataUrl.length > WALLPAPER_MAX_DATA_URL) {
                    alert('图片处理后仍过大，请尝试更小尺寸或更高压缩率的图片。');
                    e.target.value = '';
                    return;
                }
                const saved = saveWallpaper(dataUrl);
                applyWallpaper(dataUrl);
                updateWallpaperUI();
                if (!saved) {
                    alert('壁纸已应用，但缓存失败，请使用更小的图片。');
                }
            } catch {
                // Ignore file errors.
            }
            e.target.value = '';
        });
    }

    if (els.wallpaperClear) {
        els.wallpaperClear.addEventListener('click', clearWallpaper);
    }
}
