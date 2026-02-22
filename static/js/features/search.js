import { state } from '../core/state.js';
import { els } from '../core/elements.js';
import { SEARCH_RESULT_LIMIT } from '../core/constants.js';
import { formatDomainLabel } from '../core/utils.js';
import { recordSearchLatency } from '../services/perfBaseline.js';
import { rebuildSearchIndex, querySearchIndex } from '../services/searchIndex.js';

function getNow() {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        return performance.now();
    }
    return Date.now();
}

export function setupEngines() {
    if (!els.engineSelectBtn || !els.engineSelectLabel || !els.engineSelectDropdown) return;
    
    // 更新标签显示当前选中的引擎
    const currentEngine = state.engines.find(engine => engine.value === state.selectedEngine);
    if (currentEngine) {
        els.engineSelectLabel.textContent = currentEngine.label;
    }
    
    // 渲染下拉选项
    els.engineSelectDropdown.innerHTML = '';
    state.engines.forEach(engine => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.textContent = engine.label;
        option.setAttribute('role', 'option');
        option.setAttribute('data-value', engine.value);
        
        // 标记当前选中项
        if (engine.value === state.selectedEngine) {
            option.classList.add('is-selected');
            option.setAttribute('aria-selected', 'true');
        } else {
            option.setAttribute('aria-selected', 'false');
        }
        
        // 点击选项时更新状态
        option.addEventListener('click', () => {
            state.selectedEngine = engine.value;
            els.engineSelectLabel.textContent = engine.label;
            
            // 更新选中状态
            els.engineSelectDropdown.querySelectorAll('.custom-select-option').forEach(opt => {
                opt.classList.remove('is-selected');
                opt.setAttribute('aria-selected', 'false');
            });
            option.classList.add('is-selected');
            option.setAttribute('aria-selected', 'true');
            
            // 关闭下拉框
            closeEngineDropdown();
        });
        
        els.engineSelectDropdown.appendChild(option);
    });
    
    // 确保有选中的引擎
    if (!state.selectedEngine && state.engines.length) {
        state.selectedEngine = state.engines[0].value;
        els.engineSelectLabel.textContent = state.engines[0].label;
    }
}

// 打开下拉框
function openEngineDropdown() {
    if (!els.engineSelectBtn || !els.engineSelectDropdown) return;
    els.engineSelectDropdown.classList.remove('is-hidden');
    els.engineSelectBtn.setAttribute('aria-expanded', 'true');
}

// 关闭下拉框
function closeEngineDropdown() {
    if (!els.engineSelectBtn || !els.engineSelectDropdown) return;
    els.engineSelectDropdown.classList.add('is-hidden');
    els.engineSelectBtn.setAttribute('aria-expanded', 'false');
}

// 绑定下拉框事件
function bindEngineSelectEvents() {
    if (!els.engineSelectBtn) return;
    
    // 点击按钮切换下拉框
    els.engineSelectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !els.engineSelectDropdown.classList.contains('is-hidden');
        if (isOpen) {
            closeEngineDropdown();
        } else {
            openEngineDropdown();
        }
    });
    
    // 点击外部关闭下拉框
    document.addEventListener('click', (e) => {
        if (!els.engineSelect?.contains(e.target)) {
            closeEngineDropdown();
        }
    });
    
    // ESC 键关闭下拉框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeEngineDropdown();
        }
    });
}

// 导出绑定函数供初始化使用
export { bindEngineSelectEvents };

export function handleSearch() {
    const value = els.searchInput.value.trim();
    if (!value) return;
    const isUrl = /^(https?:\/\/|www\.)/i.test(value) || value.includes('.');
    if (isUrl) {
        const url = value.startsWith('http') ? value : `https://${value}`;
        window.open(url, '_blank');
        return;
    }
    const encoded = encodeURIComponent(value);
    const template = state.selectedEngine || '';
    const target = template.includes('{query}')
        ? template.replace('{query}', encoded)
        : `${template}${encoded}`;
    window.open(target, '_blank');
}

function getSearchMatches(value) {
    const query = value.trim();
    if (!query) return [];
    return querySearchIndex(query, SEARCH_RESULT_LIMIT);
}

function renderSearchResults(query, results) {
    if (!els.searchResults) return;
    els.searchResults.innerHTML = '';
    if (!results.length) {
        els.searchResults.classList.add('is-hidden');
        return;
    }

    const header = document.createElement('div');
    header.className = 'search-results-header';
    header.textContent = `匹配书签（${results.length}）`;

    const list = document.createElement('div');
    list.className = 'search-results-list';

    results.forEach((site, idx) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'search-result';
        button.dataset.index = String(idx);
        if (idx === state.searchActiveIndex) {
            button.classList.add('is-active');
        }

        const name = document.createElement('span');
        name.className = 'search-result-name';
        name.textContent = site.name || site.url;

        const meta = document.createElement('span');
        meta.className = 'search-result-meta';
        const label = formatDomainLabel(site.domain) || site.domain || site.url;
        meta.textContent = `${label}${site.categoryLabel ? ` · ${site.categoryLabel}` : ''}`;

        button.appendChild(name);
        button.appendChild(meta);

        button.addEventListener('click', () => {
            if (site.url) {
                window.open(site.url, '_blank');
            }
            hideSearchResults();
        });

        list.appendChild(button);
    });

    els.searchResults.appendChild(header);
    els.searchResults.appendChild(list);
    els.searchResults.classList.remove('is-hidden');
}

function setActiveSearchIndex(nextIndex) {
    if (!els.searchResults) return;
    const buttons = Array.from(els.searchResults.querySelectorAll('.search-result'));
    state.searchActiveIndex = nextIndex;
    buttons.forEach((btn, idx) => {
        btn.classList.toggle('is-active', idx === nextIndex);
    });
    if (nextIndex >= 0 && buttons[nextIndex]) {
        buttons[nextIndex].scrollIntoView({ block: 'nearest' });
    }
}

export function hideSearchResults() {
    if (!els.searchResults) return;
    els.searchResults.innerHTML = '';
    els.searchResults.classList.add('is-hidden');
    state.searchMatches = [];
    state.searchActiveIndex = -1;
}

export function updateSearchResults() {
    if (!els.searchInput) return 0;
    const value = els.searchInput.value.trim();
    if (!value) {
        hideSearchResults();
        return 0;
    }
    const results = getSearchMatches(value);
    state.searchMatches = results;
    if (state.searchActiveIndex >= results.length) {
        state.searchActiveIndex = -1;
    }
    renderSearchResults(value, results);
    return results.length;
}

export function handleSearchInput(e) {
    state.searchInputValue = e.target.value;
    state.searchActiveIndex = -1;
    const startMs = getNow();
    const resultCount = updateSearchResults();
    const durationMs = getNow() - startMs;
    recordSearchLatency(state.searchInputValue, resultCount, durationMs);
}

export function handleSearchKeydown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!state.searchMatches.length) return;
        e.preventDefault();
        const total = state.searchMatches.length;
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        let next = state.searchActiveIndex;
        if (next === -1) {
            next = delta === 1 ? 0 : total - 1;
        } else {
            next = (next + delta + total) % total;
        }
        setActiveSearchIndex(next);
        return;
    }

    if (e.key === 'Enter') {
        if (state.searchActiveIndex >= 0 && state.searchMatches[state.searchActiveIndex]) {
            const site = state.searchMatches[state.searchActiveIndex];
            if (site.url) {
                window.open(site.url, '_blank');
            }
            hideSearchResults();
            return;
        }
        handleSearch();
    }
}

function getInputSelection(input) {
    const start = Number.isInteger(input.selectionStart) ? input.selectionStart : input.value.length;
    const end = Number.isInteger(input.selectionEnd) ? input.selectionEnd : start;
    return {
        start,
        end,
        text: input.value.slice(start, end)
    };
}

export async function copySearchInput() {
    if (!els.searchInput) return;
    const selection = getInputSelection(els.searchInput);
    const text = selection.text || els.searchInput.value;
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        // Ignore clipboard errors.
    }
}

export async function pasteSearchInputPlainText() {
    if (!els.searchInput) return;
    try {
        const text = await navigator.clipboard.readText();
        if (!text) return;
        const selection = getInputSelection(els.searchInput);
        const value = els.searchInput.value;
        const next = value.slice(0, selection.start) + text + value.slice(selection.end);
        els.searchInput.value = next;
        const cursor = selection.start + text.length;
        els.searchInput.selectionStart = cursor;
        els.searchInput.selectionEnd = cursor;
        els.searchInput.focus();
        updateSearchResults();
    } catch {
        // Ignore clipboard errors.
    }
}

export function bindSearchInput() {
    if (!els.searchInput) return;
    els.searchInput.addEventListener('keydown', handleSearchKeydown);
    els.searchInput.addEventListener('input', handleSearchInput);
}

export function rebuildSearchData() {
    rebuildSearchIndex(state.categories);
}
