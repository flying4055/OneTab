import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

export default function SiteContextMenu({
  contextMenu,
  onClose,
  onEdit,
  onDelete,
  onOpenInCurrentTab,
  onOpenInNewTab
}) {
  if (!contextMenu) return null;

  const handleAction = (action) => {
    return () => {
      action(contextMenu.site);
      onClose();
    };
  };

  const handleOpenInCurrentTab = () => {
    window.location.href = contextMenu.site.url;
    onClose();
  };

  const handleOpenInNewTab = () => {
    window.open(contextMenu.site.url, '_blank');
    onClose();
  };

  // 处理菜单外部点击 - 立即关闭
  const handleMenuClose = (event, reason) => {
    if (reason === 'backdropClick') {
      onClose();
    }
  };

  return (
    <Menu
      open={contextMenu !== null}
      onClose={handleMenuClose}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu !== null
          ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
          : undefined
      }
      // 禁用默认焦点恢复，提高响应速度
      disableRestoreFocus
      // 立即响应关闭
      MenuListProps={{
        disablePadding: true
      }}
      // 背景点击关闭
      BackdropProps={{
        invisible: false,
        sx: {
          backgroundColor: 'transparent',
          cursor: 'default'
        }
      }}
      PaperProps={{
        sx: {
          minWidth: 160,
          borderRadius: 3,
          bgcolor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(30px) saturate(150%)',
          WebkitBackdropFilter: 'blur(30px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          color: 'white',
          backgroundImage: 'none',
          '& .MuiListItemIcon-root': {
            color: 'rgba(255, 255, 255, 0.7)',
          },
          '& .MuiListItemText-primary': {
            fontSize: '13px',
          }
        }
      }}
    >
      <MenuItem onClick={handleOpenInCurrentTab} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}>
        <ListItemIcon>
          <OpenInNewIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="在当前标签页打开" />
      </MenuItem>

      <MenuItem onClick={handleOpenInNewTab} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}>
        <ListItemIcon>
          <OpenInNewIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="在新标签页打开" />
      </MenuItem>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      <MenuItem onClick={handleAction(onEdit)} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}>
        <ListItemIcon>
          <EditIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="编辑书签" />
      </MenuItem>

      <MenuItem onClick={handleAction(onDelete)} sx={{ color: '#ff6b6b', '&:hover': { bgcolor: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', '& .MuiListItemIcon-root': { color: 'inherit' } } }}>
        <ListItemIcon sx={{ color: '#ff6b6b' }}>
          <DeleteIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="删除书签" />
      </MenuItem>
    </Menu>
  );
}
