import React from 'react';
import { Box, IconButton } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import SiteCard from './SiteCard';

export default function SiteGrid({ sites, onSiteClick = undefined, onSiteContextMenu, onAddSite, openInNewTab }) {
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
        alignItems: 'flex-start',
        // 内边距
        pb: 4
      }}
    >
      {sites.map((site) => (
        // 外层容器 - 添加 hover 上移效果
        <Box
          key={site.id}
          sx={{
            // hover 动画
            transition: 'transform 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
            }
          }}
        >
          <SiteCard
            site={site}
            onClick={onSiteClick}
            onContextMenu={onSiteContextMenu}
            openInNewTab={openInNewTab}
          />
        </Box>
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
            bgcolor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(30px) saturate(150%)',
            WebkitBackdropFilter: 'blur(30px) saturate(150%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            '&:hover': {
              transform: 'translateY(-2px)',
            }
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
