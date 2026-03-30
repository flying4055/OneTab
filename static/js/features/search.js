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

function getEngineIconHTML(engineLabel) {
    if (engineLabel.includes('Google')) {
        return '<img src="https://www.google.com/favicon.ico" alt="Google">';
    } else if (engineLabel.includes('Bing')) {
        return '<img src="https://cn.bing.com/favicon.ico" alt="Bing">';
    } else if (engineLabel.includes('百度') || engineLabel.includes('Baidu')) {
        return '<img src="https://www.baidu.com/favicon.ico" alt="百度">';
    } else if (engineLabel.includes('Duck')) {
        return '<img src="https://duckduckgo.com/favicon.ico" alt="DuckDuckGo">';
    }
    // Search icon for others / default "Search" option
    return `<svg viewBox="0 0 24 24" width="28" height="28" fill="#ff6b00"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`;
}

export function setupEngines() {
    if (!els.engineSelectBtn || !els.engineSelectIcon || !els.engineSelectDropdown) return;
    
    const updateCurrentEngineIcon = (engine) => {
        if (!engine) return;
        els.engineSelectIcon.innerHTML = getEngineIconHTML(engine.label);
    };

    // 更新标签显示当前选中的引擎
    const currentEngine = state.engines.find(engine => engine.value === state.selectedEngine);
    updateCurrentEngineIcon(currentEngine);
    
    // 渲染下拉选项
    els.engineSelectDropdown.innerHTML = '';
    state.engines.forEach((engine, index) => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.setAttribute('role', 'option');
        option.setAttribute('data-value', engine.value);
        
        // Add delete button for non-default engines (you can adjust this logic)
        const isDefault = ['搜索', 'Google', 'Bing', '百度', 'DuckDuckGo'].includes(engine.label);
        const deleteBtnHtml = !isDefault ? `<button class="engine-delete-btn" aria-label="删除引擎"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>` : '';

        // Add checkmark for selected option
        const isSelected = engine.value === state.selectedEngine;
        const checkmarkHtml = `<div class="engine-selected-check" style="opacity: ${isSelected ? 1 : 0};">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        </div>`;

        option.innerHTML = `
            <div class="engine-icon-wrapper">
                ${getEngineIconHTML(engine.label)}
                ${deleteBtnHtml}
            </div>
            <div class="custom-select-option-label">${engine.label}</div>
            ${checkmarkHtml}
        `;
        
        // 标记当前选中项
        if (engine.value === state.selectedEngine) {
            option.classList.add('is-selected');
            option.setAttribute('aria-selected', 'true');
        } else {
            option.setAttribute('aria-selected', 'false');
        }
        
        // 点击选项时更新状态
        option.addEventListener('click', (e) => {
            // If delete button is clicked, don't select the engine
            if (e.target.closest('.engine-delete-btn')) {
                e.stopPropagation();
                // Placeholder for delete logic
                state.engines.splice(index, 1);
                if (state.selectedEngine === engine.value) {
                    state.selectedEngine = state.engines[0]?.value || 'default';
                }
                setupEngines();
                return;
            }

            state.selectedEngine = engine.value;
            updateCurrentEngineIcon(engine);
            
            // Re-render to update checkmarks
            setupEngines();
            
            // 关闭下拉框
            closeEngineDropdown();
        });
        
        els.engineSelectDropdown.appendChild(option);
    });
    
    // Add the "Add" button tile
    const addOption = document.createElement('div');
    addOption.className = 'custom-select-option engine-add-btn';
    addOption.innerHTML = `
        <div class="engine-icon-wrapper">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
        </div>
        <div class="custom-select-option-label">添加</div>
        <!-- Add empty spacer to keep height consistent with selected items -->
        <div class="engine-selected-check" style="opacity: 0;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        </div>
    `;
    addOption.addEventListener('click', (e) => {
        e.stopPropagation();
        // Trigger modal to add search engine (Assuming a future integration or current simple alert)
        alert('添加搜索引擎功能开发中');
        closeEngineDropdown();
    });
    els.engineSelectDropdown.appendChild(addOption);
    
    // 确保有选中的引擎
    if (!state.selectedEngine && state.engines.length) {
        state.selectedEngine = state.engines[0].value;
        updateCurrentEngineIcon(state.engines[0]);
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
