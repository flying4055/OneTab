import { useEffect } from 'react';

/**
 * 全局键盘快捷键
 * - Ctrl+K → 聚焦搜索框
 * - Esc → 关闭所有弹窗/菜单
 *
 * @param {object} dialogs - 弹窗状态对象 { contextMenu, setContextMenu, settingsOpen, setSettingsOpen, ... }
 */
export function useKeyboardShortcuts(dialogs) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K → 聚焦搜索框
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const searchInput = /** @type {HTMLInputElement | null} */ (
          document.querySelector('input[aria-label="search web"]')
        );
        if (searchInput) searchInput.focus();
      }

      // Esc → 关闭所有弹窗/菜单
      if (e.key === 'Escape') {
        dialogs.closeAll?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dialogs]);
}
