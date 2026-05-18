import { useState, useCallback, useEffect } from 'react';

/**
 * 书签右键菜单状态管理
 */
export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState(null);

  const open = useCallback((event, site) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      site,
    });
  }, []);

  const close = useCallback(() => setContextMenu(null), []);

  // 全局点击关闭右键菜单
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

  return { contextMenu, open, close };
}
