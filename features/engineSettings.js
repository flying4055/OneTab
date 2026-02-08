import { state } from '../core/state.js';
import { setupEngines } from './search.js';

const ENGINE_SETTINGS_KEY = 'engine_settings_v1';

function normalizeTemplate(raw) {
    let value = raw.trim();
    if (!value) return '';
    if (!/^https?:\/\//i.test(value)) {
        value = `https://${value}`;
    }
    if (value.includes('{query}')) return value;
    return `${value}{query}`;
}

function loadEngineSettings() {
    try {
        const raw = localStorage.getItem(ENGINE_SETTINGS_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function saveEngineSettings() {
    try {
        localStorage.setItem(ENGINE_SETTINGS_KEY, JSON.stringify({
            engines: state.engines,
            selectedEngine: state.selectedEngine
        }));
    } catch {
        // Ignore storage errors.
    }
}

function ensureSelectedEngine() {
    const exists = state.engines.some(engine => engine.value === state.selectedEngine);
    if (!exists) {
        state.selectedEngine = state.engines[0]?.value || '';
    }
}

function renderEngineList() {
    const list = document.getElementById('engineList');
    if (!list) return;
    list.innerHTML = '';

    state.engines.forEach((engine, idx) => {
        const item = document.createElement('div');
        item.className = 'engine-item';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'engineDefault';
        radio.checked = engine.value === state.selectedEngine;
        radio.addEventListener('change', () => {
            state.selectedEngine = engine.value;
            saveEngineSettings();
            setupEngines();
        });

        const textWrap = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'engine-item-name';
        name.textContent = engine.label || `引擎 ${idx + 1}`;
        const url = document.createElement('div');
        url.className = 'engine-item-url';
        url.textContent = engine.value;
        textWrap.appendChild(name);
        textWrap.appendChild(url);

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'engine-remove';
        remove.textContent = '删除';
        remove.addEventListener('click', () => {
            if (state.engines.length <= 1) return;
            state.engines.splice(idx, 1);
            ensureSelectedEngine();
            saveEngineSettings();
            setupEngines();
            renderEngineList();
        });

        item.appendChild(radio);
        item.appendChild(textWrap);
        item.appendChild(remove);
        list.appendChild(item);
    });
}

export function initEngineSettings() {
    const saved = loadEngineSettings();
    if (saved?.engines && Array.isArray(saved.engines)) {
        state.engines = saved.engines;
        state.selectedEngine = saved.selectedEngine || state.engines[0]?.value || '';
    }
    ensureSelectedEngine();
    setupEngines();
    renderEngineList();

    const addBtn = document.getElementById('engineAdd');
    const nameInput = document.getElementById('engineName');
    const urlInput = document.getElementById('engineUrl');

    if (addBtn && nameInput && urlInput) {
        addBtn.addEventListener('click', () => {
            const label = nameInput.value.trim();
            const template = normalizeTemplate(urlInput.value);
            if (!label || !template) return;
            state.engines.push({ label, value: template });
            nameInput.value = '';
            urlInput.value = '';
            saveEngineSettings();
            setupEngines();
            renderEngineList();
        });
    }
}
