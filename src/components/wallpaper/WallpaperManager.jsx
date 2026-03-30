import React, { useState } from 'react';
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
import { Close as CloseIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { useFeedback } from '../feedback/FeedbackProvider';

export default function WallpaperManager({ open, onClose, onApply }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const { showMessage } = useFeedback();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showMessage('图片大小不能超过 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    if (onApply && previewUrl) {
      onApply(previewUrl);
      showMessage('壁纸已更新', 'success');
      onClose();
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    if (onApply) {
      onApply(null);
      showMessage('已重置为默认背景', 'info');
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
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
        <Typography variant="subtitle1" component="div" fontWeight="bold" sx={{ fontSize: '1rem' }}>壁纸管理</Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'rgba(255,255,255,0.7)' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <Box 
          sx={{ 
            width: '100%', 
            height: 240, 
            bgcolor: 'rgba(26, 29, 39, 0.6)',
            borderRadius: 2,
            border: '2px dashed rgba(255, 255, 255, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            mb: 3
          }}
        >
          {previewUrl ? (
            <Box 
              component="img" 
              src={previewUrl} 
              alt="Wallpaper Preview" 
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.5)', mb: 1 }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>暂无自定义壁纸</Typography>
            </>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="outlined" 
            size="small"
            component="label" 
            startIcon={<CloudUploadIcon />} 
            sx={{ 
              borderRadius: 2,
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
            上传本地图片
            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
          </Button>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 2, py: 2 }}>
        <Button 
          onClick={handleReset} 
          size="small"
          sx={{ 
            mr: 'auto', 
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            fontSize: '0.8125rem',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
          }}
        >
          恢复默认
        </Button>
        <Button 
          onClick={onClose} 
          size="small"
          sx={{ 
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            fontSize: '0.8125rem',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
          }}
        >
          取消
        </Button>
        <Button 
          onClick={handleApply} 
          disabled={!previewUrl} 
          size="small"
          sx={{ 
            borderRadius: 2,
            bgcolor: 'rgba(92, 115, 230, 0.9)', 
            backdropFilter: 'blur(10px)',
            color: 'white',
            fontSize: '0.8125rem',
            '&:hover': { bgcolor: 'rgba(92, 115, 230, 1)' },
            '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
          }}
        >
          应用壁纸
        </Button>
      </DialogActions>
    </Dialog>
  );
}
