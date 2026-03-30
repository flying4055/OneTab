import React, { useState } from 'react';
import { Tabs, Tab, Badge, Box, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

export default function GroupNavigation({ groups, activeGroup, onChange }) {
  const [contextMenu, setContextMenu] = useState(null);
  const [targetGroup, setTargetGroup] = useState(null);

  const handleChange = (event, newValue) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleContextMenu = (event, group) => {
    event.preventDefault();
    setTargetGroup(group);
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
    });
  };

  const handleClose = () => {
    setContextMenu(null);
    setTargetGroup(null);
  };

  return (
    <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs 
        value={activeGroup} 
        onChange={handleChange} 
        variant="scrollable"
        scrollButtons="auto"
        aria-label="site groups"
        sx={{
          minHeight: 48,
          '& .MuiTab-root': {
            minHeight: 48,
            fontSize: '1rem',
            textTransform: 'none',
            fontWeight: 500,
          }
        }}
      >
        {groups.map((group) => (
          <Tab 
            key={group.id} 
            value={group.id} 
            onContextMenu={(e) => handleContextMenu(e, group)}
            label={
              group.count > 0 ? (
                <Badge badgeContent={group.count} color="primary" sx={{ '& .MuiBadge-badge': { right: -15, top: 5 } }}>
                  {group.name}
                </Badge>
              ) : (
                group.name
              )
            } 
          />
        ))}
      </Tabs>

      {/* 分组右键菜单 */}
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleClose}>
          <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
          <ListItemText>添加分组</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>重命名分组</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleClose} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>删除分组</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
