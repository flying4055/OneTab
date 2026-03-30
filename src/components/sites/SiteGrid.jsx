import React from 'react';
import { Box, IconButton } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import SiteCard from './SiteCard';

export default function SiteGrid({ sites, onSiteClick, onSiteContextMenu, onAddSite, openInNewTab }) {
  if (!sites || sites.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'left', color: 'white' }}>
        暂无书签
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '16px', 
        justifyContent: 'flex-start',
        width: '100%',
        margin: '0 auto',
        alignItems: 'flex-start'
      }}
    >
      {sites.map((site) => (
        <SiteCard 
          key={site.id} 
          site={site} 
          onClick={onSiteClick}
          onContextMenu={onSiteContextMenu}
          openInNewTab={openInNewTab}
        />
      ))}
      
      {/* Add Button */}
      <Box 
        sx={{ 
          width: 64, 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <IconButton 
          onClick={onAddSite}
          sx={{ 
            width: 56,
            height: 56,
            borderRadius: '16px',
            bgcolor: 'rgba(255,255,255,0.4)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.6)',
            }
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
