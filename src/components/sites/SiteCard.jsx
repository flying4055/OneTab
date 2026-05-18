import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSettingsStore } from '../../store';

export default function SiteCard({ site, onClick, onContextMenu, openInNewTab }) {
  const iconSize = useSettingsStore(state => state.iconSize);

  // dnd-kit 排序钩子
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: site.id });

  // 根据图标尺寸计算衍生尺寸（按比例缩放）
  const dimensions = useMemo(() => {
    const size = iconSize || 48;
    return {
      icon: size,
      container: size + 8,
      borderRadius: Math.round(size * 16 / 56),
      textSize: Math.max(10, Math.round(size * 11 / 56)),
    };
  }, [iconSize]);

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

  // 鼠标中键 → 新标签页打开
  const handleAuxClick = (e) => {
    if (e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      window.open(site.url, '_blank');
    }
  };

  const handleContextMenu = (e) => {
    if (onContextMenu) {
      e.preventDefault();
      e.stopPropagation();
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

  // 决定背景色
  const displayBgColor = site.bgColor && site.bgColor !== 'transparent'
    ? site.bgColor
    : '#ffffff';

  // 决定首字母文字颜色
  const displayTextColor = site.textColor
    ? site.textColor
    : (displayBgColor !== '#ffffff' ? 'white' : '#000000');

  // dnd-kit 拖拽变换样式
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      sx={{
        width: dimensions.container,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        cursor: isDragging ? 'grabbing' : 'pointer',
        touchAction: 'none',
        // 整体轻微上浮
        transition: 'transform 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      }}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      onAuxClick={handleAuxClick}
    >
      {/* 拖拽手柄覆盖在图标方块上 */}
      <Box
        {...listeners}
        sx={{
          position: 'relative',
          width: dimensions.icon,
          height: dimensions.icon,
        }}
      >
        <Box
          component="a"
          href={site.url}
          target={openInNewTab ? "_blank" : "_self"}
          onClick={handleClick}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            borderRadius: `${dimensions.borderRadius}px`,
            bgcolor: displayBgColor,
            overflow: 'hidden',
            textDecoration: 'none',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            pointerEvents: isDragging ? 'none' : 'auto',
            // 图标方块本身的 hover 微交互
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              transform: 'scale(1.06)',
            },
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
      </Box>
      <Typography
        variant="caption"
        component="div"
        align="center"
        noWrap
        sx={{
          width: '100%',
          fontSize: `${dimensions.textSize}px`,
          color: 'white',
          userSelect: 'none'
        }}
      >
        {site.name}
      </Typography>
    </Box>
  );
}
