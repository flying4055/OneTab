import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { Close as CloseIcon, CloudDownload as CloudDownloadIcon } from '@mui/icons-material';
import { useFeedback } from '../feedback/FeedbackProvider';

const PRESET_COLORS = [
  'transparent',
  '#ffffff',
  '#000000',
  '#ff0000',
  '#ffa500',
  '#ffff00',
  '#00ff00',
  '#0000ff',
  '#800080',
  '#9400d3'
];

export default function SiteEditorDialog({ open, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({ id: '', name: '', url: '', icon: '', bgColor: 'transparent', textColor: '' });
  const fileInputRef = useRef(null);
  const { showMessage } = useFeedback();
  const [fetchedIcons, setFetchedIcons] = useState([]);
  const [isFetchingIcons, setIsFetchingIcons] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({ 
          ...initialData,
          bgColor: initialData.bgColor || 'transparent',
          textColor: initialData.textColor || ''
        });
      } else {
        setFormData({ id: '', name: '', url: '', icon: '', bgColor: 'transparent', textColor: '' });
      }
      setFetchedIcons([]);
    }
  }, [open, initialData]);

  const handleChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleColorChange = (color) => {
    setFormData(prev => ({ ...prev, bgColor: color }));
  };

  const handleNativeColorChange = (e) => {
    setFormData(prev => ({ ...prev, bgColor: e.target.value }));
  };

  const handleNativeTextColorChange = (e) => {
    setFormData(prev => ({ ...prev, textColor: e.target.value }));
  };

  const handleResetColor = () => {
    setFormData(prev => ({ ...prev, bgColor: 'transparent', textColor: '' }));
  };

  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, icon: event.target.result.toString() }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveIcon = () => {
    setFormData(prev => ({ ...prev, icon: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFetchIcons = () => {
    if (!formData.url) {
      showMessage('请先输入网站链接', 'warning');
      return;
    }
    
    let hostname = '';
    try {
      let urlStr = formData.url;
      if (!urlStr.startsWith('http')) {
        urlStr = 'https://' + urlStr;
      }
      hostname = new URL(urlStr).hostname;
    } catch (e) {
      showMessage('链接格式无效，无法解析域名', 'error');
      return;
    }

    setIsFetchingIcons(true);
    
    // 生成多个可能的图标获取地址
    const potentialIcons = [
      `https://logo.clearbit.com/${hostname}`,
      `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
      `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
      `https://${hostname}/favicon.ico`,
      `https://${hostname}/apple-touch-icon.png`
    ];

    // 去重
    const uniqueIcons = [...new Set(potentialIcons)];
    setFetchedIcons(uniqueIcons);
    
    setTimeout(() => {
      setIsFetchingIcons(false);
      showMessage('已获取相关图标候选，请在下方选择', 'success');
    }, 500);
  };

  const handleSave = () => {
    if (!formData.name || !formData.url) return;
    
    // 简单的补全 URL 逻辑
    let finalUrl = formData.url;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    onSave({
      ...formData,
      url: finalUrl,
      id: formData.id || `site_${Date.now()}` // 生成临时ID
    });
    onClose();
  };

  const checkerboardStyle = {
    backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
    backgroundSize: '10px 10px',
    backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth
      slotProps={{
        backdrop: {
          invisible: true,
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(30px) saturate(150%)',
          WebkitBackdropFilter: 'blur(30px) saturate(150%)',
          color: 'white',
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          p: 1
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" component="div" fontWeight="bold" sx={{ fontSize: '1rem' }}>
          {initialData ? '编辑书签' : '添加书签'}
        </Typography>
        <IconButton aria-label="close" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)', p: 0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto' }}>
        {/* 名称 */}
        <Box>
          <Typography variant="body2" sx={{ mb: 1, color: '#e0e0e0', fontWeight: 500, fontSize: '0.8125rem' }}>名称</Typography>
          <Box 
            component="input"
            value={formData.name}
            onChange={handleChange('name')}
            sx={{
              width: '100%',
              bgcolor: 'rgba(26, 29, 39, 0.6)', // 半透明输入框
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              p: 1.5,
              color: 'white',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              '&:focus': { 
                borderColor: 'rgba(255, 255, 255, 0.3)',
                bgcolor: 'rgba(26, 29, 39, 0.8)'
              }
            }}
          />
        </Box>

        {/* 链接 */}
        <Box>
          <Typography variant="body2" sx={{ mb: 1, color: '#e0e0e0', fontWeight: 500, fontSize: '0.8125rem' }}>链接</Typography>
          <Box 
            component="input"
            value={formData.url}
            onChange={handleChange('url')}
            sx={{
              width: '100%',
              bgcolor: 'rgba(26, 29, 39, 0.6)', // 半透明输入框
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              p: 1.5,
              color: 'white',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              '&:focus': { 
                borderColor: 'rgba(255, 255, 255, 0.3)',
                bgcolor: 'rgba(26, 29, 39, 0.8)'
              }
            }}
          />
        </Box>

        {/* 图标 */}
        <Box>
          <Typography variant="body2" sx={{ mb: 1, color: '#e0e0e0', fontWeight: 500, fontSize: '0.8125rem' }}>图标</Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
            <Box 
              sx={{ 
                width: 64, 
                height: 64, 
                borderRadius: 3, 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                bgcolor: formData.bgColor !== 'transparent' ? formData.bgColor : 'rgba(26, 29, 39, 0.6)',
                ...(formData.bgColor === 'transparent' ? checkerboardStyle : {})
              }}
            >
              {formData.icon ? (
                <Box component="img" src={formData.icon} alt="icon" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>未设置</Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  component="label"
                  variant="outlined" 
                  size="small"
                  sx={{ 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  上传图片
                  <input type="file" hidden accept="image/*" onChange={handleIconUpload} ref={fileInputRef} />
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={handleRemoveIcon}
                  sx={{ 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  移除自定义
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={handleFetchIcons}
                  disabled={isFetchingIcons}
                  startIcon={isFetchingIcons ? null : <CloudDownloadIcon />}
                  sx={{ 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' },
                    '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.05)' }
                  }}
                >
                  {isFetchingIcons ? '获取中...' : '自动获取'}
                </Button>
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6875rem' }}>
                支持图片上传，保存时自动转换为 WebP。自动获取需先输入链接。
              </Typography>
            </Box>
          </Box>
          
          {fetchedIcons.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap', p: 1, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, border: '1px dashed rgba(255,255,255,0.1)' }}>
              <Typography variant="caption" sx={{ width: '100%', color: 'rgba(255,255,255,0.7)', fontSize: '0.6875rem', mb: 0.5 }}>
                点击选择图标 (部分可能加载失败)：
              </Typography>
              {fetchedIcons.map((iconUrl, index) => (
                <Box
                  key={index}
                  component="img"
                  src={iconUrl}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  onClick={() => setFormData(prev => ({ ...prev, icon: iconUrl }))}
                  sx={{
                    width: 54, // 放大到 54px
                    height: 54, // 放大到 54px
                    borderRadius: 2, // 圆角稍微增大以匹配更大的图标
                    cursor: 'pointer',
                    bgcolor: 'white',
                    objectFit: 'cover',
                    p: 0.5, // 内边距稍微增大一点
                    border: formData.icon === iconUrl ? '2px solid #5c73e6' : '2px solid transparent', // 边框也稍微加粗一点
                    transition: 'transform 0.1s',
                    '&:hover': { transform: 'scale(1.1)' }
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* 图标背景色与文字颜色 */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ mb: 1, color: '#e0e0e0', fontWeight: 500, fontSize: '0.8125rem' }}>图标背景色</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'center' }}>
              <Box sx={{ position: 'relative', display: 'flex' }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  component="label"
                  sx={{ 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    textTransform: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.75rem',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', ...checkerboardStyle, border: '1px solid rgba(255,255,255,0.2)' }} />
                  选择颜色
                  <input 
                    type="color" 
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} 
                    value={formData.bgColor !== 'transparent' ? formData.bgColor : '#ffffff'}
                    onChange={handleNativeColorChange}
                  />
                </Button>
              </Box>
              <Button 
                variant="outlined" 
                size="small"
                onClick={handleResetColor}
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.1)', 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                重置默认
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((color, index) => (
                <Box 
                  key={index}
                  onClick={() => handleColorChange(color)}
                  sx={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    cursor: 'pointer',
                    border: formData.bgColor === color ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                    bgcolor: color === 'transparent' ? 'transparent' : color,
                    ...(color === 'transparent' ? checkerboardStyle : {}),
                    boxShadow: formData.bgColor === color ? '0 0 0 1px rgba(255,255,255,0.3)' : 'none',
                    transition: 'transform 0.1s ease',
                    '&:hover': { transform: 'scale(1.1)' }
                  }}
                />
              ))}
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6875rem' }}>
              用于填充透明图标背景；默认透明。
            </Typography>
          </Box>

          {/* 文字颜色 */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ mb: 1, color: '#e0e0e0', fontWeight: 500, fontSize: '0.8125rem' }}>无图标时文字颜色</Typography>
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Button 
                variant="outlined" 
                size="small"
                component="label"
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.1)', 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  textTransform: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.75rem',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <Box sx={{ 
                  width: 14, height: 14, borderRadius: '50%', 
                  bgcolor: formData.textColor || '#000000',
                  border: '1px solid rgba(255,255,255,0.2)' 
                }} />
                选择颜色
                <input 
                  type="color" 
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} 
                  value={formData.textColor || '#000000'}
                  onChange={handleNativeTextColorChange}
                />
              </Button>
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6875rem', display: 'block' }}>
              当未设置图标时，用于显示首字母的颜色。
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 2, py: 2 }}>
        <Button 
          onClick={onClose} 
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
          onClick={handleSave} 
          size="small"
          disabled={!formData.name || !formData.url}
          sx={{ 
            bgcolor: 'rgba(92, 115, 230, 0.9)', 
            backdropFilter: 'blur(10px)',
            color: 'white',
            '&:hover': { bgcolor: 'rgba(92, 115, 230, 1)' },
            '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' },
            px: 3,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '0.8125rem'
          }}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
