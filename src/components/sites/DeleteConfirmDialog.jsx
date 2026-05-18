import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

/**
 * 删除确认弹窗
 */
export default function DeleteConfirmDialog({ open, site, onConfirm, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4, bgcolor: 'rgba(34, 39, 54, 0.75)',
          backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', color: 'white', backgroundImage: 'none',
        }
      }}>
      <DialogTitle sx={{ m: 0, p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: '1rem' }}>确认删除</Typography>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.1)', py: 3 }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>
          您确定要删除书签 <strong style={{ color: 'white' }}>{site?.name}</strong> 吗？此操作无法撤销。
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 2 }}>
        <Button onClick={onClose} size="small"
          sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }, px: 3, borderRadius: 2, textTransform: 'none', fontSize: '0.8125rem' }}>
          取消
        </Button>
        <Button onClick={() => { onConfirm(site); onClose(); }} size="small"
          sx={{ bgcolor: 'rgba(244, 67, 54, 0.9)', backdropFilter: 'blur(10px)', color: 'white',
            '&:hover': { bgcolor: 'rgba(244, 67, 54, 1)' }, px: 3, borderRadius: 2, textTransform: 'none', fontSize: '0.8125rem' }}>
          确认删除
        </Button>
      </DialogActions>
    </Dialog>
  );
}
