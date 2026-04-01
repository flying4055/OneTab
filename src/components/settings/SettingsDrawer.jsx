import React, { useState } from 'react';
import { 
  Drawer, 
  Box, 
  Typography, 
  IconButton, 
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Button
} from '@mui/material';
import { 
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Wallpaper as WallpaperIcon,
  Settings as SettingsIcon,
  ColorLens as ColorLensIcon,
  Download as DownloadIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { useFeedback } from '../feedback/FeedbackProvider';
import { useDataStore, useSettingsStore } from '../../store';

const SETTINGS_WIDTH = 340;

export default function SettingsDrawer({ open, onClose, onOpenWallpaper, openInNewTab, toggleOpenInNewTab }) {
  const [expanded, setExpanded] = useState('panel1');
  const { showMessage } = useFeedback();
  const categories = useDataStore(state => state.categories);
  const setCategories = useDataStore(state => state.setCategories);
  const wallpaperUrl = useSettingsStore(state => state.wallpaperUrl);
  const setWallpaperUrl = useSettingsStore(state => state.setWallpaperUrl);
  const setOpenInNewTab = useSettingsStore(state => state.setOpenInNewTab);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleExport = () => {
    const searchEngine = useSettingsStore.getState().searchEngine;
    const exportData = {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      settings: {
        openInNewTab,
        wallpaperUrl,
        searchEngine
      },
      data: {
        categories
      }
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "onetab_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showMessage('配置导出成功', 'success');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const result = event.target.result;
          const imported = JSON.parse(typeof result === 'string' ? result : result.toString());
          if (imported.data && imported.data.categories) {
            setCategories(imported.data.categories);
          }
          if (imported.settings) {
            if (imported.settings.openInNewTab !== undefined) {
              setOpenInNewTab(imported.settings.openInNewTab);
            }
            if (imported.settings.wallpaperUrl !== undefined) {
              setWallpaperUrl(imported.settings.wallpaperUrl);
            }
            if (imported.settings.searchEngine !== undefined) {
              useSettingsStore.getState().setSearchEngine(imported.settings.searchEngine);
            }
          }
          showMessage('配置导入成功', 'success');
        } catch (error) {
          showMessage('导入失败：文件格式不正确', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': { 
          width: { xs: '100%', sm: SETTINGS_WIDTH },
          boxSizing: 'border-box',
          bgcolor: 'rgba(34, 39, 54, 0.75)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.3)',
          color: 'white',
          backgroundImage: 'none'
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: '1rem' }}>
          设置
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <Accordion 
          expanded={expanded === 'panel1'} 
          onChange={handleChange('panel1')} 
          disableGutters 
          elevation={0} 
          square
          sx={{ bgcolor: 'transparent', color: 'white', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ColorLensIcon sx={{ color: 'rgba(255,255,255,0.7)' }} fontSize="small" />
              <Typography fontWeight={500} sx={{ fontSize: '0.875rem' }}>外观设置</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={<Switch checked={openInNewTab} onChange={toggleOpenInNewTab} size="small" />}
              label={<Typography sx={{ fontSize: '0.875rem' }}>在新标签页中打开书签</Typography>}
            />
          </AccordionDetails>
        </Accordion>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        <Accordion 
          expanded={expanded === 'panel2'} 
          onChange={handleChange('panel2')} 
          disableGutters 
          elevation={0} 
          square
          sx={{ bgcolor: 'transparent', color: 'white', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WallpaperIcon sx={{ color: 'rgba(255,255,255,0.7)' }} fontSize="small" />
              <Typography fontWeight={500} sx={{ fontSize: '0.875rem' }}>壁纸与背景</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Button 
              variant="outlined" 
              fullWidth 
              size="small"
              startIcon={<WallpaperIcon />}
              onClick={onOpenWallpaper}
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                fontSize: '0.8125rem',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.3)',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              管理壁纸
            </Button>
          </AccordionDetails>
        </Accordion>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        <Accordion 
          expanded={expanded === 'panel3'} 
          onChange={handleChange('panel3')} 
          disableGutters 
          elevation={0} 
          square
          sx={{ bgcolor: 'transparent', color: 'white', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon sx={{ color: 'rgba(255,255,255,0.7)' }} fontSize="small" />
              <Typography fontWeight={500} sx={{ fontSize: '0.875rem' }}>高级设置与数据</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button 
              variant="outlined" 
              fullWidth 
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                fontSize: '0.8125rem',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.3)',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              导出配置备份
            </Button>
            <Button 
              variant="outlined" 
              fullWidth 
              size="small"
              component="label"
              startIcon={<UploadIcon />}
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                fontSize: '0.8125rem',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.3)',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              导入配置备份
              <input type="file" hidden accept=".json" onChange={handleImport} />
            </Button>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Drawer>
  );
}
