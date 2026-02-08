const TIME_SETTINGS_KEY = 'time_settings_v1';

const DEFAULTS = {
    enabled: true,
    use24h: true,
    showSeconds: false,
    showDate: true
};

let timerId = null;

function loadTimeSettings() {
    try {
        const raw = localStorage.getItem(TIME_SETTINGS_KEY);
        if (!raw) return { ...DEFAULTS };
        const parsed = JSON.parse(raw);
        return {
            enabled: Boolean(parsed.enabled ?? DEFAULTS.enabled),
            use24h: Boolean(parsed.use24h ?? DEFAULTS.use24h),
            showSeconds: Boolean(parsed.showSeconds ?? DEFAULTS.showSeconds),
            showDate: Boolean(parsed.showDate ?? DEFAULTS.showDate)
        };
    } catch {
        return { ...DEFAULTS };
    }
}

function saveTimeSettings(settings) {
    try {
        localStorage.setItem(TIME_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
        // Ignore storage errors.
    }
}

function formatTime(date, settings) {
    let hours = date.getHours();
    let suffix = '';
    if (!settings.use24h) {
        suffix = hours >= 12 ? ' PM' : ' AM';
        hours = hours % 12 || 12;
    }
    const mins = String(date.getMinutes()).padStart(2, '0');
    const secs = String(date.getSeconds()).padStart(2, '0');
    const hh = String(hours).padStart(2, '0');
    return settings.showSeconds ? `${hh}:${mins}:${secs}${suffix}` : `${hh}:${mins}${suffix}`;
}

function formatDate(date) {
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short'
    });
}

function renderTime(settings) {
    const widget = document.getElementById('timeWidget');
    const clock = document.getElementById('timeClock');
    const dateEl = document.getElementById('timeWidgetDate');
    if (!widget || !clock || !dateEl) return;
    if (!settings.enabled) {
        widget.classList.add('is-hidden');
        return;
    }
    widget.classList.remove('is-hidden');
    const now = new Date();
    clock.textContent = formatTime(now, settings);
    dateEl.textContent = settings.showDate ? formatDate(now) : '';
    dateEl.style.display = settings.showDate ? 'block' : 'none';
}

function scheduleTick(settings) {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
    const interval = settings.showSeconds ? 1000 : 10000;
    timerId = window.setInterval(() => renderTime(settings), interval);
}

export function initTimeSettings() {
    const settings = loadTimeSettings();
    const enabled = document.getElementById('timeEnabled');
    const use24h = document.getElementById('time24h');
    const showSeconds = document.getElementById('timeSeconds');
    const showDate = document.getElementById('timeDate');

    if (enabled) enabled.checked = settings.enabled;
    if (use24h) use24h.checked = settings.use24h;
    if (showSeconds) showSeconds.checked = settings.showSeconds;
    if (showDate) showDate.checked = settings.showDate;

    const apply = () => {
        settings.enabled = Boolean(enabled?.checked);
        settings.use24h = Boolean(use24h?.checked);
        settings.showSeconds = Boolean(showSeconds?.checked);
        settings.showDate = Boolean(showDate?.checked);
        saveTimeSettings(settings);
        renderTime(settings);
        scheduleTick(settings);
    };

    [enabled, use24h, showSeconds, showDate]
        .filter(Boolean)
        .forEach(el => {
            el.addEventListener('change', apply);
        });

    renderTime(settings);
    scheduleTick(settings);
}
