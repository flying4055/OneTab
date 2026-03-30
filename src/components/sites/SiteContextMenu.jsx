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
  onDelete 
}) {
  if (!contextMenu) return null;

  const handleAction = (action) => {
    return () => {
      action(contextMenu.site);
      onClose();
    };
  };

  return (
    <Menu
      open={contextMenu !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu !== null
          ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
          : undefined
      }
      PaperProps={{
        sx: {
          minWidth: 160,
          borderRadius: 3,
          bgcolor: 'rgba(34, 39, 54, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          color: 'white',
          backgroundImage: 'none',
          '& .MuiListItemIcon-root': {
            color: 'rgba(255, 255, 255, 0.7)',
          }
        }
      }}
    >
      <MenuItem onClick={handleAction(onEdit)} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}>
        <ListItemIcon>
          <EditIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}>编辑书签</ListItemText>
      </MenuItem>
      
      <MenuItem onClick={handleAction(onDelete)} sx={{ color: '#ff6b6b', '&:hover': { bgcolor: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', '& .MuiListItemIcon-root': { color: 'inherit' } } }}>
        <ListItemIcon sx={{ color: '#ff6b6b' }}>
          <DeleteIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}>删除书签</ListItemText>
      </MenuItem>
    </Menu>
  );
}
