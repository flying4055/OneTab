import React, { useState } from 'react';
import {
  Drawer, Box, Typography, IconButton, Tabs, Tab,
  Slider, Button, Select, MenuItem, FormControl,
} from '@mui/material';
import {
  Close as CloseIcon,
  Wallpaper as WallpaperIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useFeedback } from '../feedback/FeedbackProvider';
import { useDataStore, useSettingsStore } from '../../store';

const DRAWER_WIDTH = 340;

const WIDTH_OPTIONS = [
  { value: 0, label: '自动' },
  { value: 400, label: '400px' },
  { value: 640, label: '640px' },
  { value: 768, label: '768px' },
  { value: 1024, label: '1024px' },
  { value: 1280, label: '1280px' },
  { value: 1440, label: '1440px' },
  { value: 1680, label: '1680px' },
  { value: 1920, label: '1920px' },
  { value: 2560, label: '2560px' },
];

/* ───── TabPanel ───── */
function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return (
    <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {children}
    </Box>
  );
}

/* ───── Section Heading ───── */
function SectionLabel({ text }) {
  return (
    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
      {text}
    </Typography>
  );
}

/* ───── Slider Row ───── */
function SliderRow({ label, value, onChange, min, max, step }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)' }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>{value}px</Typography>
      </Box>
      <Slider value={value} onChange={(_, v) => onChange(v)} min={min} max={max} step={step}
        size="small" valueLabelDisplay="auto"
        sx={{ color: '#5c73e6', '& .MuiSlider-thumb': { width: 14, height: 14 }, '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.1)' } }} />
    </Box>
  );
}

/* ───── Outline Button ───── */
/**
 * @param {{ children: any, startIcon?: any, onClick?: any, component?: any, [key: string]: any }} props
 */
function OutlineBtn({ children, startIcon, onClick, component: Comp, ...rest }) {
  const baseSx = {
    borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)',
    bgcolor: 'rgba(255,255,255,0.04)', textTransform: 'none', fontSize: '0.8125rem',
    '&:hover': { borderColor: 'rgba(255,255,255,0.2)', bgcolor: 'rgba(255,255,255,0.08)' }
  };
  return (
    <Button variant="outlined" fullWidth size="small" startIcon={startIcon} onClick={onClick}
      {...(Comp ? { component: Comp } : {})} sx={baseSx} {...rest}>
      {children}
    </Button>
  );
}

/* ═══════════════════ Main Component ═══════════════════ */
export default function SettingsPanel({ open, onClose, onOpenWallpaper, openInNewTab, toggleOpenInNewTab }) {
  const [tab, setTab] = useState(0);
  const { showMessage } = useFeedback();
  const categories = useDataStore(s => s.categories);
  const setCategories = useDataStore(s => s.setCategories);
  const setWallpaperUrl = useSettingsStore(s => s.setWallpaperUrl);
  const setOpenInNewTab = useSettingsStore(s => s.setOpenInNewTab);
  const iconSize = useSettingsStore(s => s.iconSize);
  const setIconSize = useSettingsStore(s => s.setIconSize);
  const gridGap = useSettingsStore(s => s.gridGap);
  const setGridGap = useSettingsStore(s => s.setGridGap);
  const contentMaxWidth = useSettingsStore(s => s.contentMaxWidth);
  const setContentMaxWidth = useSettingsStore(s => s.setContentMaxWidth);

  /* ───── Export ───── */
  const handleExport = () => {
    const state = useSettingsStore.getState();
    const data = { version: '2.0.0', exportDate: new Date().toISOString(),
      settings: { openInNewTab, wallpaperUrl: state.wallpaperUrl, searchEngine: state.searchEngine, iconSize, gridGap, contentMaxWidth },
      data: { categories } };
    const a = document.createElement('a');
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    a.download = "onetab_backup.json";
    a.click();
    showMessage('配置导出成功', 'success');
  };

  /* ───── Import ───── */
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const r = JSON.parse(ev.target.result.toString());
        if (r.data?.categories) setCategories(r.data.categories);
        const s = r.settings || {};
        if (s.openInNewTab !== undefined) setOpenInNewTab(s.openInNewTab);
        if (s.wallpaperUrl !== undefined) setWallpaperUrl(s.wallpaperUrl);
        if (s.searchEngine !== undefined) useSettingsStore.getState().setSearchEngine(s.searchEngine);
        if (s.iconSize !== undefined) setIconSize(s.iconSize);
        if (s.gridGap !== undefined) setGridGap(s.gridGap);
        if (s.contentMaxWidth !== undefined) setContentMaxWidth(s.contentMaxWidth);
        showMessage('配置导入成功', 'success');
      } catch { showMessage('导入失败：文件格式不正确', 'error'); }
    };
    reader.readAsText(file);
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box',
        bgcolor: 'rgba(22, 24, 33, 0.97)', backdropFilter: 'blur(30px)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.4)', color: 'white', backgroundImage: 'none' }}}>

      {/* ─── Header ─── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, pt: 2, pb: 0.5 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '1rem' }}>设置</Typography>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.6)' }}><CloseIcon fontSize="small" /></IconButton>
      </Box>

      {/* ─── Tabs ─── */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)}
        sx={{
          minHeight: 40, px: 1,
          '& .MuiTabs-indicator': { bgcolor: '#5c73e6', height: 2 },
          '& .MuiTab-root': { minHeight: 40, minWidth: 0, flex: 1, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', textTransform: 'none', py: 0.5 },
          '& .Mui-selected': { color: 'white' },
        }}>
        <Tab label="外观" />
        <Tab label="图标" />
        <Tab label="数据" />
      </Tabs>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>

        {/* ═══ 外观 ═══ */}
        <TabPanel value={tab} index={0}>
          <SectionLabel text="布局" />
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)' }}>内容宽度</Typography>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>{contentMaxWidth === 0 ? '自动' : `${contentMaxWidth}px`}</Typography>
            </Box>
            <FormControl fullWidth size="small">
              <Select value={contentMaxWidth} onChange={e => setContentMaxWidth(e.target.value)}
                sx={{ color: 'white', fontSize: '0.8125rem',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#5c73e6' },
                  '.MuiSvgIcon-root': { color: 'rgba(255,255,255,0.5)' } }}
                MenuProps={{ PaperProps: { sx: { bgcolor: '#1a1d28', color: 'white', maxHeight: 300 } } }}>
                {WIDTH_OPTIONS.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: '0.8125rem' }}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          <SectionLabel text="壁纸" />
          <OutlineBtn startIcon={<WallpaperIcon />} onClick={onOpenWallpaper}>管理壁纸</OutlineBtn>
        </TabPanel>

        {/* ═══ 图标 ═══ */}
        <TabPanel value={tab} index={1}>
          <SliderRow label="图标尺寸" value={iconSize} onChange={setIconSize} min={48} max={96} step={4} />
          <SliderRow label="卡片间距" value={gridGap} onChange={setGridGap} min={8} max={40} step={2} />
        </TabPanel>

        {/* ═══ 数据 ═══ */}
        <TabPanel value={tab} index={2}>
          <OutlineBtn startIcon={<DownloadIcon />} onClick={handleExport}>导出配置备份</OutlineBtn>
          <OutlineBtn startIcon={<UploadIcon />} component="label">
            导入配置备份
            <input type="file" hidden accept=".json" onChange={handleImport} />
          </OutlineBtn>
        </TabPanel>

      </Box>
    </Drawer>
  );
}
