const SETTINGS_KEY = 'ui_settings_v1';

const DEFAULTS = {
    roundingSmooth: true,
    iconRadius: 10,
    iconSize: 48,
    iconOpacity: 100,
    gapX: 10,
    gapY: 10
};

function readNumber(value, fallback) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return { ...DEFAULTS };
        const parsed = JSON.parse(raw);
        return {
            roundingSmooth: Boolean(parsed.roundingSmooth ?? DEFAULTS.roundingSmooth),
            iconRadius: readNumber(parsed.iconRadius, DEFAULTS.iconRadius),
            iconSize: readNumber(parsed.iconSize, DEFAULTS.iconSize),
            iconOpacity: readNumber(parsed.iconOpacity, DEFAULTS.iconOpacity),
            gapX: readNumber(parsed.gapX, DEFAULTS.gapX),
            gapY: readNumber(parsed.gapY, DEFAULTS.gapY)
        };
    } catch {
        return { ...DEFAULTS };
    }
}

function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
        // Ignore storage errors.
    }
}

function applySettings(settings) {
    const root = document.documentElement;
    const iconRadius = Math.max(0, settings.iconRadius);
    const cardRadius = settings.roundingSmooth ? Math.max(iconRadius + 2, 10) : 12;
    root.style.setProperty('--radius-icon-dynamic', `${iconRadius}px`);
    root.style.setProperty('--radius-card-dynamic', `${cardRadius}px`);
    root.style.setProperty('--icon-size', `${settings.iconSize}px`);
    root.style.setProperty('--icon-opacity', `${settings.iconOpacity / 100}`);
    root.style.setProperty('--grid-gap-x', `${settings.gapX}px`);
    root.style.setProperty('--grid-gap-y', `${settings.gapY}px`);
}

function setValue(el, value) {
    if (!el) return;
    el.textContent = String(value);
}

function initControls(settings) {
    const roundingToggle = document.getElementById('roundingToggle');
    const iconRadius = document.getElementById('iconRadius');
    const iconRadiusValue = document.getElementById('iconRadiusValue');
    const iconSize = document.getElementById('iconSize');
    const iconSizeValue = document.getElementById('iconSizeValue');
    const iconOpacity = document.getElementById('iconOpacity');
    const iconOpacityValue = document.getElementById('iconOpacityValue');
    const spacingLink = document.getElementById('spacingLink');
    const gapX = document.getElementById('gapX');
    const gapXValue = document.getElementById('gapXValue');
    const gapY = document.getElementById('gapY');
    const gapYValue = document.getElementById('gapYValue');

    if (roundingToggle) roundingToggle.checked = settings.roundingSmooth;
    if (iconRadius) iconRadius.value = String(settings.iconRadius);
    if (iconSize) iconSize.value = String(settings.iconSize);
    if (iconOpacity) iconOpacity.value = String(settings.iconOpacity);
    if (gapX) gapX.value = String(settings.gapX);
    if (gapY) gapY.value = String(settings.gapY);
    setValue(iconRadiusValue, settings.iconRadius);
    setValue(iconSizeValue, settings.iconSize);
    setValue(iconOpacityValue, settings.iconOpacity);
    setValue(gapXValue, settings.gapX);
    setValue(gapYValue, settings.gapY);

    const handleUpdate = () => {
        settings.roundingSmooth = Boolean(roundingToggle?.checked);
        settings.iconRadius = readNumber(iconRadius?.value, settings.iconRadius);
        settings.iconSize = readNumber(iconSize?.value, settings.iconSize);
        settings.iconOpacity = readNumber(iconOpacity?.value, settings.iconOpacity);
        settings.gapX = readNumber(gapX?.value, settings.gapX);
        settings.gapY = readNumber(gapY?.value, settings.gapY);

        if (spacingLink?.checked) {
            if (gapX && gapY && gapX.value !== gapY.value) {
                gapY.value = gapX.value;
                settings.gapY = settings.gapX;
                setValue(gapYValue, settings.gapY);
            }
        }

        applySettings(settings);
        saveSettings(settings);
        setValue(iconRadiusValue, settings.iconRadius);
        setValue(iconSizeValue, settings.iconSize);
        setValue(iconOpacityValue, settings.iconOpacity);
        setValue(gapXValue, settings.gapX);
        setValue(gapYValue, settings.gapY);
    };

    [roundingToggle, iconRadius, iconSize, iconOpacity, gapX, gapY, spacingLink]
        .filter(Boolean)
        .forEach(el => {
            el.addEventListener('input', handleUpdate);
            el.addEventListener('change', handleUpdate);
        });

    if (spacingLink?.checked && gapX && gapY && gapX.value !== gapY.value) {
        gapY.value = gapX.value;
        settings.gapY = settings.gapX;
        setValue(gapYValue, settings.gapY);
    }
}

export function initUiSettings() {
    const settings = loadSettings();
    applySettings(settings);
    initControls(settings);
}
