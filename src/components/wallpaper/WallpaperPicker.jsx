import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog, Box, Typography, IconButton, Tabs, Tab,
  CircularProgress, Button,
} from '@mui/material';
import {
  Close as CloseIcon, Check as CheckIcon,
} from '@mui/icons-material';
import { useFeedback } from '../feedback/FeedbackProvider';

const SOURCES = [
  { key: 'nature',  label: '自然风光' },
  { key: 'city',    label: '城市建筑' },
  { key: 'minimal', label: '极简抽象' },
];

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
      debounceRef.current = setTimeout(() => loadSource(key), TAB_DEBOUNCE);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [open, tab, loadSource]);

  const selectedWallpaper = wallpapers.find(w => w.id === selected);

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
        {loading ? (
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
            {selectedWallpaper?.name || '预览'}
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
