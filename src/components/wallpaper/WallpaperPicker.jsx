import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog, Box, Typography, IconButton, Tabs, Tab,
  CircularProgress, Button, TextField,
} from '@mui/material';
import {
  Close as CloseIcon, Check as CheckIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Link as LinkIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useFeedback } from '../feedback/FeedbackProvider';
import { useSettingsStore } from '../../store';

const SOURCES = [
  { key: 'nature',  label: '自然风光' },
  { key: 'city',    label: '城市建筑' },
  { key: 'minimal', label: '极简抽象' },
  { key: 'custom',  label: '自定义' },
];

const MAX_IMG_WIDTH = 1920;
const MAX_IMG_HEIGHT = 1200;
const JPEG_QUALITY = 0.82;

/* ═══════════════ Image helpers ═══════════════ */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        let w = width, h = height;
        if (w > MAX_IMG_WIDTH || h > MAX_IMG_HEIGHT) {
          const scale = Math.min(MAX_IMG_WIDTH / w, MAX_IMG_HEIGHT / h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = /** @type {string} */ (reader.result);
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const { width, height } = img;
      let w = width, h = height;
      if (w > MAX_IMG_WIDTH || h > MAX_IMG_HEIGHT) {
        const scale = Math.min(MAX_IMG_WIDTH / w, MAX_IMG_HEIGHT / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => reject(new Error('图片链接加载失败，可能存在跨域限制'));
    img.src = url;
  });
}

const TAB_DEBOUNCE = 300;

/* ═══════════════ Curated JSON ═══════════════ */
let curatedCache = null;
async function fetchCurated(sourceKey) {
  if (!curatedCache) {
    const res = await fetch('/curated-wallpapers.json');
    if (!res.ok) throw new Error(`Curated HTTP ${res.status}`);
    curatedCache = await res.json();
  }
  const src = curatedCache.sources?.[sourceKey];
  if (!src) return [];
  return src.wallpapers.map(w => ({ ...w, category: src.name }));
}

const BUILTIN_WALLPAPERS = [
  { id: 'local_bg1', name: '内置壁纸 1', url: '/bg1.webp' },
  { id: 'local_bg2', name: '内置壁纸 2', url: '/bg2.webp' },
  { id: 'local_bg3', name: '内置壁纸 3', url: '/bg3.webp' },
];

/* ═══════════════ Custom Tab ═══════════════ */
function CustomTab({ selected, onSelect, onApply }) {
  const { showMessage } = useFeedback();
  const customWallpapers = useSettingsStore((s) => s.customWallpapers);
  const addCustomWallpaper = useSettingsStore((s) => s.addCustomWallpaper);
  const removeCustomWallpaper = useSettingsStore((s) => s.removeCustomWallpaper);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const dropRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(async (file) => {
    if (!file.type.startsWith('image/')) {
      showMessage('请选择图片文件', 'error');
      return;
    }
    setLoading(true);
    try {
      const dataUrl = await compressImage(file);
      const wp = { id: `cust_${Date.now()}`, name: file.name, dataUrl, createdAt: Date.now() };
      addCustomWallpaper(wp);
      onSelect(dataUrl);
      showMessage('壁纸已添加', 'success');
    } catch {
      showMessage('图片处理失败', 'error');
    }
    setLoading(false);
  }, [addCustomWallpaper, onSelect, showMessage]);

  const processUrl = useCallback(async () => {
    const url = urlInput.trim();
    if (!url) return;
    setLoading(true);
    try {
      const dataUrl = await loadImageFromUrl(url);
      const name = url.split('/').pop()?.split('?')[0] || '自定义壁纸';
      const wp = { id: `cust_${Date.now()}`, name, dataUrl, createdAt: Date.now() };
      addCustomWallpaper(wp);
      onSelect(dataUrl);
      setUrlInput('');
      showMessage('壁纸已添加', 'success');
    } catch (e) {
      showMessage(e.message || '链接加载失败', 'error');
    }
    setLoading(false);
  }, [urlInput, addCustomWallpaper, onSelect, showMessage]);

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
    const onDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); };
    const onDrop = (e) => {
      e.preventDefault(); e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) processFile(file);
    };
    el.addEventListener('dragover', onDragOver);
    el.addEventListener('dragleave', onDragLeave);
    el.addEventListener('drop', onDrop);
    return () => {
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('dragleave', onDragLeave);
      el.removeEventListener('drop', onDrop);
    };
  }, [processFile]);

  const fileInputRef = useRef(null);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* 内置壁纸 */}
      <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
        内置壁纸
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 1.5 }}>
        {BUILTIN_WALLPAPERS.map((wp) => (
          <Box key={wp.id} onClick={() => onSelect(wp.url)}
            sx={{
              position: 'relative', borderRadius: 2, overflow: 'hidden', cursor: 'pointer',
              aspectRatio: '16/10', bgcolor: 'rgba(255,255,255,0.05)',
              border: selected === wp.url ? '2px solid #5c73e6' : '2px solid transparent',
              transition: 'border-color 0.15s, transform 0.15s',
              '&:hover': { transform: 'scale(1.03)' },
            }}>
            <Box component="img" src={wp.url} alt={wp.name}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {selected === wp.url && (
              <Box sx={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', bgcolor: '#5c73e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon sx={{ fontSize: 16, color: 'white' }} />
              </Box>
            )}
            <Typography sx={{
              position: 'absolute', bottom: 0, left: 0, right: 0, px: 1, py: 0.6,
              fontSize: '0.65rem', color: 'white',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            }}>{wp.name}</Typography>
          </Box>
        ))}
      </Box>

      {/* 上传区域 */}
      <Box ref={dropRef} onClick={() => fileInputRef.current?.click()}
        sx={{
          border: `2px dashed ${dragOver ? '#5c73e6' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 2, p: 3, textAlign: 'center', cursor: 'pointer',
          bgcolor: dragOver ? 'rgba(92,115,230,0.08)' : 'rgba(255,255,255,0.02)',
          transition: 'border-color 0.2s, background-color 0.2s',
          '&:hover': { borderColor: 'rgba(255,255,255,0.25)', bgcolor: 'rgba(255,255,255,0.04)' },
        }}>
        {loading ? (
          <CircularProgress size={28} sx={{ color: '#5c73e6' }} />
        ) : (
          <>
            <AddPhotoIcon sx={{ fontSize: 36, color: 'rgba(255,255,255,0.25)', mb: 1 }} />
            <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>
              拖拽图片到此处或<Box component="span" sx={{ color: '#5c73e6', cursor: 'pointer' }}>点击上传</Box>
            </Typography>
            <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.25)', mt: 0.5 }}>
              支持 JPG / PNG / WebP，自动压缩至合适尺寸
            </Typography>
          </>
        )}
        <input ref={fileInputRef} type="file" hidden accept="image/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ''; }} />
      </Box>

      {/* URL 输入 */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField size="small" fullWidth placeholder="或粘贴图片链接..."
          value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') processUrl(); }}
          disabled={loading}
          InputProps={{ startAdornment: <LinkIcon sx={{ color: 'rgba(255,255,255,0.3)', mr: 0.5, fontSize: 18 }} /> }}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'white', fontSize: '0.8125rem',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              '&.Mui-focused fieldset': { borderColor: '#5c73e6' },
            },
          }} />
        <Button variant="outlined" size="small" onClick={processUrl} disabled={loading || !urlInput.trim()}
          sx={{ borderColor: 'rgba(255,255,255,0.12)', color: 'white', textTransform: 'none', fontSize: '0.8125rem', whiteSpace: 'nowrap',
            '&:hover': { borderColor: '#5c73e6', bgcolor: 'rgba(92,115,230,0.1)' },
            '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.05)' } }}>
          加载
        </Button>
      </Box>

      {/* 已上传的壁纸列表 */}
      {customWallpapers.length > 0 && (
        <>
          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
            已上传的壁纸
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 1.5 }}>
            {[...customWallpapers].reverse().map((wp) => (
              <Box key={wp.id} onClick={() => onSelect(wp.dataUrl)}
                sx={{
                  position: 'relative', borderRadius: 2, overflow: 'hidden', cursor: 'pointer',
                  aspectRatio: '16/10', bgcolor: 'rgba(255,255,255,0.05)',
                  border: selected === wp.dataUrl ? '2px solid #5c73e6' : '2px solid transparent',
                  transition: 'border-color 0.15s, transform 0.15s',
                  '&:hover': { transform: 'scale(1.03)' },
                }}>
                <Box component="img" src={wp.dataUrl} alt={wp.name}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {selected === wp.dataUrl && (
                  <Box sx={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', bgcolor: '#5c73e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckIcon sx={{ fontSize: 16, color: 'white' }} />
                  </Box>
                )}
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeCustomWallpaper(wp.id); if (selected === wp.dataUrl) onSelect(null); }}
                  sx={{ position: 'absolute', top: 4, left: 4, width: 24, height: 24, bgcolor: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.7)',
                    '&:hover': { bgcolor: 'rgba(220,50,50,0.7)', color: 'white' } }}>
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <Typography sx={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, px: 1, py: 0.6,
                  fontSize: '0.65rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                }}>{wp.name}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}

/* ═══════════════ Main Component ═══════════════ */
export default function WallpaperPicker({ open, onClose, onApply }) {
  const [tab, setTab] = useState(0);
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const { showMessage } = useFeedback();

  const cacheRef = useRef({});
  const debounceRef = useRef(null);

  const isCustomTab = SOURCES[tab]?.key === 'custom';

  const loadSource = useCallback(async (sourceKey) => {
    const cached = cacheRef.current[sourceKey];
    if (cached) {
      setWallpapers(cached);
      return;
    }

    setLoading(true);
    setSelected(null);
    try {
      const result = await fetchCurated(sourceKey);
      cacheRef.current[sourceKey] = result;
      setWallpapers(result);
    } catch {
      showMessage('加载壁纸失败', 'error');
    }
    setLoading(false);
  }, [showMessage]);

  useEffect(() => {
    if (open) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const key = SOURCES[tab].key;
      setPreview(null);
      if (key !== 'custom') {
        debounceRef.current = setTimeout(() => loadSource(key), TAB_DEBOUNCE);
      }
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [open, tab, loadSource]);

  const selectedWallpaper = isCustomTab ? null : wallpapers.find(w => w.id === selected);

  const handleCustomSelect = useCallback((dataUrl) => {
    setSelected(dataUrl);
    setPreview(dataUrl);
  }, []);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3, bgcolor: '#14161e', color: 'white',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          height: '85vh', maxHeight: 700, backgroundImage: 'none',
        }
      }}>

      <Box sx={{ display: 'flex', alignItems: 'center', px: 3, pt: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.05rem', flexGrow: 1 }}>选择壁纸</Typography>
        <Button size="small" onClick={() => { onApply(null); showMessage('已恢复默认壁纸', 'info'); onClose(); }}
          sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'none', fontSize: '0.75rem', mr: 1 }}>
          恢复默认
        </Button>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.6)' }}><CloseIcon fontSize="small" /></IconButton>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}
        sx={{
          minHeight: 40, px: 2, borderBottom: '1px solid rgba(255,255,255,0.06)',
          '& .MuiTabs-indicator': { bgcolor: '#5c73e6', height: 2 },
          '& .MuiTab-root': { minHeight: 40, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', textTransform: 'none', py: 0.5, px: 2 },
          '& .Mui-selected': { color: 'white' },
        }}>
        {SOURCES.map((s, i) => (
          <Tab key={s.key} label={s.label} value={i} />
        ))}
      </Tabs>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2 }}>
        {isCustomTab ? (
          <CustomTab selected={selected} onSelect={handleCustomSelect} onApply={onApply} />
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={32} sx={{ color: '#5c73e6' }} />
          </Box>
        ) : wallpapers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'rgba(255,255,255,0.3)' }}>暂无壁纸</Box>
        ) : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 2,
          }}>
            {wallpapers.map((wp) => (
              <Box key={wp.id} onClick={() => { setSelected(wp.id); setPreview(wp.url); }}
                sx={{
                  position: 'relative', borderRadius: 2, overflow: 'hidden', cursor: 'pointer',
                  aspectRatio: '16/10', bgcolor: 'rgba(255,255,255,0.05)',
                  border: selected === wp.id ? '2px solid #5c73e6' : '2px solid transparent',
                  transition: 'border-color 0.15s, transform 0.15s',
                  '&:hover': { transform: 'scale(1.02)' },
                }}>
                <Box component="img" src={wp.thumb} alt={wp.name} loading="lazy"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => { const t = /** @type {HTMLImageElement} */ (e.target); t.style.display = 'none'; }} />
                {selected === wp.id && (
                  <Box sx={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', bgcolor: '#5c73e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckIcon sx={{ fontSize: 16, color: 'white' }} />
                  </Box>
                )}
                <Typography sx={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, px: 1.5, py: 0.8,
                  fontSize: '0.7rem', color: 'white',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                }}>{wp.name}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {preview && (
        <Box sx={{ px: 3, py: 2, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(0,0,0,0.3)' }}>
          <Box sx={{ width: 120, height: 68, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
            <Box component="img" src={preview} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Box>
          <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', flex: 1 }}>
            {isCustomTab ? '自定义壁纸预览' : selectedWallpaper?.name || '预览'}
          </Typography>
          <Button variant="contained" size="small"
            onClick={() => { onApply(preview); showMessage('壁纸已应用', 'success'); onClose(); }}
            sx={{ bgcolor: '#5c73e6', textTransform: 'none', fontSize: '0.8125rem', px: 3, '&:hover': { bgcolor: '#4c63d6' } }}>
            应用壁纸
          </Button>
        </Box>
      )}
    </Dialog>
  );
}
