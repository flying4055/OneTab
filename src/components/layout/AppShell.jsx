import React from 'react';
import { Box, Container, IconButton } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

export default function AppShell({ children, onOpenSettings, wallpaperUrl }) {
  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* Main Content Area */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'background.default',
          position: 'relative',
          backgroundImage: wallpaperUrl ? `url(${wallpaperUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Main Work Area */}
        <Container 
          maxWidth="xl" 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            '& > *': {
              position: 'relative',
              zIndex: 1,
            }
          }}
        >
          {children}
        </Container>

        {/* Bottom Right Settings Icon */}
        <IconButton 
          onClick={onOpenSettings} 
          sx={{ 
            position: 'absolute', 
            bottom: 24, 
            right: 24, 
            color: 'rgba(255,255,255,0.7)',
            '&:hover': { color: 'white' },
            zIndex: 1000
          }}
        >
          <SettingsIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
