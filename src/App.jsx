import React, { useState, useMemo, useEffect, Suspense, lazy, useCallback } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { getTheme } from './theme';
import AppShell from './components/layout/AppShell';
import SearchBar from './components/search/SearchBar';
import SiteGrid from './components/sites/SiteGrid';
import SiteContextMenu from './components/sites/SiteContextMenu';
import SiteEditorDialog from './components/sites/SiteEditorDialog';
import DeleteConfirmDialog from './components/sites/DeleteConfirmDialog';
import { useFeedback } from './components/feedback/FeedbackProvider';
import { useDataStore, useSettingsStore, setupStoreSync } from './store';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useContextMenu } from './hooks/useContextMenu';
import { useBookmarkActions } from './hooks/useBookmarkActions';

const SettingsPanel = lazy(() => import('./components/settings/SettingsPanel'));
const WallpaperPicker = lazy(() => import('./components/wallpaper/WallpaperPicker'));

export default function App() {
  const mode = 'dark';

  // ───── Store ─────
  const categories = useDataStore((s) => s.categories);
  const wallpaperUrl = useSettingsStore((s) => s.wallpaperUrl);
  const setWallpaperUrl = useSettingsStore((s) => s.setWallpaperUrl);
  const openInNewTab = useSettingsStore((s) => s.openInNewTab);
  const toggleOpenInNewTab = useSettingsStore((s) => s.toggleOpenInNewTab);
  const contentMaxWidth = useSettingsStore((s) => s.contentMaxWidth);

  // ───── Hooks ─────
  const { showMessage } = useFeedback();
  const { contextMenu, open: openContextMenu, close: closeContextMenu } = useContextMenu();
  const { saveSite, confirmDelete } = useBookmarkActions(showMessage);

  // ───── Local state ─────
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wallpaperPickerOpen, setWallpaperPickerOpen] = useState(false);
  const [siteEditorOpen, setSiteEditorOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState(null);

  // ───── Derived ─────
  const maxWidth = useMemo(() => {
    if (contentMaxWidth > 0) return contentMaxWidth;
    return { xs: '100%', sm: 1280, md: 1440, lg: 1660, xl: 1920 };
  }, [contentMaxWidth]);

  const activeSites = useMemo(() => {
    return categories.length > 0 ? categories[0].items : [];
  }, [categories]);

  const theme = useMemo(() => getTheme(mode), []);

  // ───── Effects ─────
  useEffect(() => { setupStoreSync(); }, []);

  const closeAllDialogs = useCallback(() => {
    closeContextMenu();
    setSettingsOpen(false);
    setWallpaperPickerOpen(false);
    setSiteEditorOpen(false);
    setDeleteConfirmOpen(false);
  }, [closeContextMenu]);

  useKeyboardShortcuts({ closeAll: closeAllDialogs });

  // ───── Handlers ─────
  const handleEditSite = useCallback((site) => {
    setEditingSite(site);
    setSiteEditorOpen(true);
  }, []);

  const handleDeleteClick = useCallback((site) => {
    setSiteToDelete(site);
    setDeleteConfirmOpen(true);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell
        onOpenSettings={() => setSettingsOpen(true)}
        wallpaperUrl={wallpaperUrl}
      >
        <Box sx={{ width: '100%', mt: '15vh', px: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth }}>
          <SearchBar sites={categories.flatMap(c => c.items)} openInNewTab={openInNewTab} />

          <Box sx={{ width: '100%', height: 'calc(100vh - 25vh)', overflowY: 'auto', mt: 2, pt: '4px',
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' } },
          }}>
            <SiteGrid sites={activeSites} onSiteContextMenu={openContextMenu} openInNewTab={openInNewTab}
              onAddSite={() => { setEditingSite(null); setSiteEditorOpen(true); }} />
          </Box>
        </Box>
      </AppShell>

      <SiteContextMenu contextMenu={contextMenu} onClose={closeContextMenu}
        onEdit={handleEditSite} onDelete={handleDeleteClick}
        onOpenInCurrentTab={(site) => { window.location.href = site.url; }}
        onOpenInNewTab={(site) => { window.open(site.url, '_blank'); }} />

      <SiteEditorDialog open={siteEditorOpen} onClose={() => setSiteEditorOpen(false)}
        onSave={saveSite} initialData={editingSite} />

      <DeleteConfirmDialog open={deleteConfirmOpen} site={siteToDelete}
        onConfirm={confirmDelete} onClose={() => setDeleteConfirmOpen(false)} />

      <Suspense fallback={null}>
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)}
          openInNewTab={openInNewTab} toggleOpenInNewTab={toggleOpenInNewTab}
          onOpenWallpaper={() => setWallpaperPickerOpen(true)} />
        <WallpaperPicker open={wallpaperPickerOpen} onClose={() => setWallpaperPickerOpen(false)}
          onApply={(url) => setWallpaperUrl(url || '/bg.webp')} />
      </Suspense>
    </ThemeProvider>
  );
}
