import React from 'react';
import { Box, Typography } from '@mui/material';

export default function SiteCard({ site, onClick, onContextMenu, openInNewTab }) {
  const getInitials = (name) => {
    return name ? name.substring(0, 1).toUpperCase() : '?';
  };

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick(site);
    }
  };

  const handleContextMenu = (e) => {
    if (onContextMenu) {
      e.preventDefault();
      e.stopPropagation();
      // 立即触发，提高响应速度
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

  // 决定背景色:
  // 如果用户明确设置了非透明的 bgColor，则使用它。
  // 否则，强制使用默认的纯白色。
  // 这确保了透明的图标（如 126 邮箱）也能被清晰看到，不至于和壁纸融为一体。
  const displayBgColor = site.bgColor && site.bgColor !== 'transparent' 
    ? site.bgColor 
    : '#ffffff';

  // 决定首字母文字颜色
  const displayTextColor = site.textColor 
    ? site.textColor 
    : (displayBgColor !== '#ffffff' ? 'white' : '#000000');

  return (
    <Box
      sx={{
        width: 64,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        cursor: 'pointer'
      }}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
    >
      <Box
        component="a"
        href={site.url}
        target={openInNewTab ? "_blank" : "_self"}
        onClick={handleClick}
        sx={{
          width: 56,
          height: 56,
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: displayBgColor,
          overflow: 'hidden',
          textDecoration: 'none',
          outline: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        {site.icon ? (
          <Box 
            component="img" 
            src={site.icon} 
            alt={site.name} 
            sx={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              display: 'block', 
              border: 'none',
              backgroundColor: 'transparent',
            }}
            onError={(e) => {
              // 简单处理图片加载失败，隐藏图片，交给父元素的背景色和子元素的文字兜底
              // 实际应用中可以替换为占位图或者文字
              if (e.target instanceof HTMLImageElement) {
                e.target.style.display = 'none';
              }
            }}
          />
        ) : (
          <Typography 
            variant="h6" 
            fontWeight="bold"
            sx={{ 
              color: displayTextColor
            }}
          >
            {getInitials(site.name)}
          </Typography>
        )}
      </Box>
      <Typography
        variant="caption"
        component="div"
        align="center"
        noWrap
        sx={{
          width: '100%',
          fontSize: '11px',
          color: 'white',
          userSelect: 'none'
        }}
      >
        {site.name}
      </Typography>
    </Box>
  );
}
