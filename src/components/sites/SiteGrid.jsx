import React, { useCallback, useMemo, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import SiteCard from './SiteCard';
import { useSettingsStore, useDataStore } from '../../store';

export default function SiteGrid({ sites, onSiteClick = undefined, onSiteContextMenu, onAddSite, openInNewTab }) {
  const gridGap = useSettingsStore(state => state.gridGap);
  const iconSize = useSettingsStore(state => state.iconSize);
  const reorderItems = useDataStore(state => state.reorderItems);

  // 加号按钮的尺寸与 SiteCard 保持一致
  const addBtnSize = iconSize || 48;
  const addContainerWidth = addBtnSize + 8;

  // 拖拽中的活跃卡片
  const [activeDragSite, setActiveDragSite] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const siteIds = useMemo(() => sites.map(s => s.id), [sites]);

  const handleDragStart = useCallback((event) => {
    const site = sites.find(s => s.id === event.active.id);
    setActiveDragSite(site || null);
  }, [sites]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveDragSite(null);

    if (!over || active.id === over.id) return;

    const oldIndex = sites.findIndex(s => s.id === active.id);
    const newIndex = sites.findIndex(s => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    reorderItems('home', oldIndex, newIndex);
  }, [sites, reorderItems]);

  // 拖拽中取消事件的清理
  const handleDragCancel = useCallback(() => {
    setActiveDragSite(null);
  }, []);

  if (!sites || sites.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'left', color: 'white' }}>
        暂无书签
      </Box>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={siteIds} strategy={rectSortingStrategy}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: `${gridGap}px`,
            justifyContent: 'flex-start',
            width: '100%',
            margin: '0 auto',
            alignItems: 'flex-start',
            pb: 4
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

          {/* Add Button — 不参与排序 */}
          <Box
            sx={{
              width: addContainerWidth,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <IconButton
              onClick={onAddSite}
              sx={{
                width: addBtnSize,
                height: addBtnSize,
                borderRadius: Math.round(addBtnSize * 16 / 56) + 'px',
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(30px) saturate(150%)',
                WebkitBackdropFilter: 'blur(30px) saturate(150%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px) scale(1.06)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }
              }}
            >
              <AddIcon />
            </IconButton>
            <Typography
              variant="caption"
              component="div"
              align="center"
              sx={{
                fontSize: `${Math.max(10, Math.round(addBtnSize * 11 / 56))}px`,
                color: 'white',
                userSelect: 'none',
              }}
            >
              新增书签
            </Typography>
          </Box>
        </Box>
      </SortableContext>

      {/* 拖拽悬浮影子 */}
      <DragOverlay dropAnimation={null}>
        {activeDragSite ? (
          <Box
            sx={{
              width: iconSize + 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              opacity: 0.9,
              transform: 'scale(1.08)',
            }}
          >
            <Box
              sx={{
                width: iconSize,
                height: iconSize,
                borderRadius: Math.round(iconSize * 16 / 56) + 'px',
                bgcolor: activeDragSite.bgColor && activeDragSite.bgColor !== 'transparent'
                  ? activeDragSite.bgColor : '#ffffff',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              {activeDragSite.icon ? (
                <Box
                  component="img"
                  src={activeDragSite.icon}
                  alt={activeDragSite.name}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#000' }}>
                  {activeDragSite.name ? activeDragSite.name.substring(0, 1).toUpperCase() : '?'}
                </Typography>
              )}
            </Box>
            <Typography
              variant="caption"
              align="center"
              noWrap
              sx={{
                fontSize: `${Math.max(10, Math.round(iconSize * 11 / 56))}px`,
                color: 'white',
                userSelect: 'none',
              }}
            >
              {activeDragSite.name}
            </Typography>
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
