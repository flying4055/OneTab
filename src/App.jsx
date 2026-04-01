import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { ThemeProvider, CssBaseline, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { getTheme } from './theme';
import AppShell from './components/layout/AppShell';
import SearchBar from './components/search/SearchBar';
import SiteGrid from './components/sites/SiteGrid';
import SiteContextMenu from './components/sites/SiteContextMenu';
import SiteEditorDialog from './components/sites/SiteEditorDialog';
import { useFeedback } from './components/feedback/FeedbackProvider';
import { useDataStore, useSettingsStore, setupStoreSync } from './store';

// 懒加载非首屏组件
const SettingsDrawer = lazy(() => import('./components/settings/SettingsDrawer'));
const WallpaperManager = lazy(() => import('./components/wallpaper/WallpaperManager'));

export default function App() {
  const mode = 'dark'; // 固定为暗黑主题
  
  // Zustand Stores
  const categories = useDataStore((state) => state.categories);
  const setCategories = useDataStore((state) => state.setCategories);
  const deleteSite = useDataStore((state) => state.deleteSite);

  const wallpaperUrl = useSettingsStore((state) => state.wallpaperUrl);
  const setWallpaperUrl = useSettingsStore((state) => state.setWallpaperUrl);
  const openInNewTab = useSettingsStore((state) => state.openInNewTab);
  const toggleOpenInNewTab = useSettingsStore((state) => state.toggleOpenInNewTab);
  
  const [activeGroupId, setActiveGroupId] = useState('');
  
  const [contextMenu, setContextMenu] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wallpaperManagerOpen, setWallpaperManagerOpen] = useState(false);

  // Site Editor State
  const [siteEditorOpen, setSiteEditorOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState(null);

  const { showMessage, showLoading, hideLoading } = useFeedback();

  // Setup cross-tab sync
  useEffect(() => {
    const cleanupSync = setupStoreSync();
    return () => {
      cleanupSync && cleanupSync();
    };
  }, []);

  const handleApplyWallpaper = (url) => {
    setWallpaperUrl(url || '');
  };

  const theme = useMemo(() => getTheme(mode), [mode]);

  // 获取当前激活分组的站点列表 (现在只有主页)
  const activeSites = useMemo(() => {
    return categories.length > 0 ? categories[0].items : [];
  }, [categories]);

  // Context Menu Handlers
  const handleSiteContextMenu = (event, site) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      site,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // 全局点击监听 - 关闭右键菜单
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [contextMenu]);

  const handleOpenNewTab = (site) => {
    window.open(site.url, '_blank');
  };

  const handleEditSite = (site) => {
    setEditingSite(site);
    setSiteEditorOpen(true);
  };

  const handleDeleteClick = (site) => {
    setSiteToDelete(site);
    setDeleteConfirmOpen(true);
  };

  const addSite = useDataStore((state) => state.addSite);
  const updateSite = useDataStore((state) => state.updateSite);

  const confirmDeleteSite = () => {
    if (siteToDelete) {
      const siteName = siteToDelete.name;
      // We assume everything is in 'home' category
      deleteSite('home', siteToDelete.id);
      
      // 将 showMessage 移出同步渲染周期，或者使用 useEffect 监听操作完成
      setTimeout(() => {
        showMessage(`已删除 ${siteName}`, 'success');
      }, 0);
    }
    setDeleteConfirmOpen(false);
    setSiteToDelete(null);
  };

  // 站点编辑器保存处理
  const handleSaveSite = (siteData) => {
    let isUpdate = false;
    if (categories.length > 0) {
      const homeCat = categories[0];
      const existingIndex = homeCat.items.findIndex(item => item.id === siteData.id);
      
      if (existingIndex >= 0) {
        updateSite('home', siteData);
        isUpdate = true;
      } else {
        addSite('home', siteData);
      }
    }
    
    // 延迟触发消息通知，避免在 React 渲染阶段触发 Context Provider 的 setState
    setTimeout(() => {
      showMessage(isUpdate ? '书签更新成功' : '书签添加成功', 'success');
    }, 0);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell 
        onOpenSettings={() => setSettingsOpen(true)}
        wallpaperUrl={wallpaperUrl}
      >
        <Box
          sx={{
            width: '100%',
            mt: '15vh',
            px: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            // Responsive width based on requested breakpoints
            maxWidth: {
              xs: '100%',
              sm: 1280,
              md: 1440,
              lg: 1660,
              xl: 1920
            }
          }}
        >
          <SearchBar
            sites={categories.flatMap(c => c.items)} // Pass all sites for matching
            openInNewTab={openInNewTab}
          />

          {/* 书签滚动容器 */}
          <Box 
            sx={{ 
              width: '100%',
              // 计算高度：视口高度 - 顶部间距 - 搜索栏高度 - 底部安全距离
              height: 'calc(100vh - 25vh)',
              overflowY: 'auto',
              mt: 2,
              // 顶部内边距，防止第一个书签上移时被遮挡
              pt: '4px',
              // 自定义滚动条样式
              '&::-webkit-scrollbar': {
                width: '8px'
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px'
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)'
                }
              }
            }}
          >
            <SiteGrid
              sites={activeSites}
              onSiteContextMenu={handleSiteContextMenu}
              openInNewTab={openInNewTab}
              onAddSite={() => {
                setEditingSite(null);
                setSiteEditorOpen(true);
              }}
            />
          </Box>
        </Box>
      </AppShell>
      
      <SiteContextMenu
        contextMenu={contextMenu}
        onClose={handleCloseContextMenu}
        onEdit={handleEditSite}
        onDelete={handleDeleteClick}
        onOpenInCurrentTab={(site) => {
          window.location.href = site.url;
        }}
        onOpenInNewTab={(site) => {
          window.open(site.url, '_blank');
        }}
      />

      <SiteEditorDialog
        open={siteEditorOpen}
        onClose={() => setSiteEditorOpen(false)}
        onSave={handleSaveSite}
        initialData={editingSite}
      />

      {/* 删除确认弹窗 */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: 'rgba(34, 39, 54, 0.75)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            color: 'white',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" component="div" fontWeight="bold" sx={{ fontSize: '1rem' }}>确认删除</Typography>
          <IconButton aria-label="close" onClick={() => setDeleteConfirmOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.1)', py: 3 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>
            您确定要删除书签 <strong style={{ color: 'white' }}>{siteToDelete?.name}</strong> 吗？此操作无法撤销。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 2 }}>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)} 
            size="small"
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              px: 3,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.8125rem'
            }}
          >
            取消
          </Button>
          <Button 
            onClick={confirmDeleteSite} 
            size="small"
            sx={{ 
              bgcolor: 'rgba(244, 67, 54, 0.9)', 
              backdropFilter: 'blur(10px)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(244, 67, 54, 1)' },
              px: 3,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.8125rem'
            }}
          >
            确认删除
          </Button>
        </DialogActions>
      </Dialog>

      <Suspense fallback={null}>
        <SettingsDrawer 
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          openInNewTab={openInNewTab}
          toggleOpenInNewTab={toggleOpenInNewTab}
          onOpenWallpaper={() => setWallpaperManagerOpen(true)}
        />

        <WallpaperManager 
          open={wallpaperManagerOpen}
          onClose={() => setWallpaperManagerOpen(false)}
          onApply={handleApplyWallpaper}
        />
      </Suspense>
    </ThemeProvider>
  );
}