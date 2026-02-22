import { els } from './core/elements.js';
import { loadFaviconCache } from './services/favicon.js';
import { loadNavData } from './services/navStorage.js';
import { renderTabs } from './features/tabs.js';
import { renderSites, bindSiteGridDrag } from './features/sites.js';
import {
    bindSearchInput,
    hideSearchResults,
    bindEngineSelectEvents
} from './features/search.js';
import { openContextMenu, closeContextMenu } from './features/contextMenu.js';
import { bindContextMenuActions } from './features/contextMenuActions.js';
import { bindBookmarkModal, closeBookmarkModal } from './features/modals.js';
import { bindSettings, closeSettingsModal } from './features/settings.js';
import { loadWallpaper, updateWallpaperUI, bindWallpaper } from './features/wallpaper.js';
import { initUiSettings } from './features/uiSettings.js';
import { initSettingsPanels } from './features/settingsPanels.js';
import { initEngineSettings } from './features/engineSettings.js';
import { initTimeSettings } from './features/timeSettings.js';
import { initDataSettings } from './features/dataSettings.js';
import {
    initPerfBaseline,
    markBootstrapStart,
    markBootstrapEnd
} from './services/perfBaseline.js';
import { initializeNavState } from './services/navCommands.js';

function bindGlobalContextMenu() {
    if (els.sidebar) {
        els.sidebar.addEventListener('contextmenu', (e) => {
            if (e.target.closest('#contextMenu')) return;
            e.preventDefault();
            openContextMenu(e.clientX, e.clientY, { type: 'empty' });
        });
    }

    if (els.searchInput) {
        els.searchInput.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openContextMenu(e.clientX, e.clientY, { type: 'search' });
        });
    }

    document.addEventListener('contextmenu', (e) => {
        const allowMenu = e.target.closest('.site-icon')
            || e.target.closest('.sidebar')
            || e.target.closest('#contextMenu')
            || e.target.closest('#searchInput');
        if (allowMenu) return;
        e.preventDefault();
        closeContextMenu();
    });
}

function bindGlobalEvents() {
    document.addEventListener('click', (e) => {
        if (els.contextMenu && !els.contextMenu.contains(e.target)) {
            closeContextMenu();
        }
        if (els.searchResults && !els.searchResults.contains(e.target) && e.target !== els.searchInput) {
            hideSearchResults();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeContextMenu();
            closeBookmarkModal();
            closeSettingsModal();
            hideSearchResults();
        }
    });

    window.addEventListener('resize', closeContextMenu);
    window.addEventListener('scroll', closeContextMenu, true);
}

async function init() {
    initPerfBaseline();
    markBootstrapStart();

    await loadFaviconCache();
    loadWallpaper();
    initUiSettings();
    initSettingsPanels();
    initEngineSettings();
    initTimeSettings();
    initDataSettings();
    const categories = await loadNavData();
    initializeNavState(categories);
    
    renderTabs();
    renderSites();
    updateWallpaperUI();

    bindSearchInput();
    bindEngineSelectEvents();
    bindSiteGridDrag();
    bindGlobalContextMenu();
    bindContextMenuActions();
    bindBookmarkModal();
    bindSettings();
    bindWallpaper();
    bindGlobalEvents();

    if (els.app) {
        els.app.removeAttribute('data-cloak');
    }

    markBootstrapEnd();
}

init();
