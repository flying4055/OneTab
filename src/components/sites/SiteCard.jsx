import React from 'react';
import { CardActionArea, Avatar, Typography, Tooltip, Box } from '@mui/material';

export default function SiteCard({ site, onClick, onContextMenu, openInNewTab }) {
  const getInitials = (name) => {
    return name ? name.substring(0, 1).toUpperCase() : '?';
  };

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(site);
    }
  };

  const handleContextMenu = (e) => {
    if (onContextMenu) {
      e.preventDefault();
      onContextMenu(e, site);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ContextMenu') {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      handleContextMenu({
        preventDefault: () => {},
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      });
    }
  };

  return (
    <Box 
      sx={{ 
        width: 64, 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        transition: 'transform 0.2s ease',
        '&:hover, &:focus-within': {
          transform: 'translateY(-4px)',
        }
      }}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
    >
      <CardActionArea 
        component="a"
        href={site.url}
        target={openInNewTab ? "_blank" : "_self"}
        onClick={handleClick}
        sx={{ 
          width: 56,
          height: 56,
          borderRadius: '16px', // Squircle
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: site.bgColor && site.bgColor !== 'transparent' ? site.bgColor : '#ffffff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}
      >
        {site.icon ? (
          <Box component="img" src={site.icon} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Typography 
            variant="h6" 
            fontWeight="bold"
            sx={{ 
              color: site.textColor ? site.textColor : (site.bgColor && site.bgColor !== 'transparent' && site.bgColor !== '#ffffff' ? 'white' : '#000000')
            }}
          >
            {getInitials(site.name)}
          </Typography>
        )}
      </CardActionArea>
      <Typography 
        variant="caption" 
        component="div" 
        align="center" 
        noWrap 
        sx={{ 
          width: '100%',
          fontSize: '11px',
          color: 'white',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)'
        }}
      >
        {site.name}
      </Typography>
    </Box>
  );
}
