import { useCallback, useRef } from 'react';
import { useDataStore } from '../store';

/**
 * 书签增删改操作 + 撤销删除
 * @param {(msg: string, severity?: string, actionLabel?: string, actionCb?: () => void) => void} showMessage
 */
export function useBookmarkActions(showMessage) {
  const categories = useDataStore((s) => s.categories);
  const addSite = useDataStore((s) => s.addSite);
  const updateSite = useDataStore((s) => s.updateSite);
  const deleteSite = useDataStore((s) => s.deleteSite);
  const deletedRef = useRef(null);

  /** 保存书签（新增或更新） */
  const saveSite = useCallback((siteData) => {
    let isUpdate = false;
    if (categories.length > 0) {
      const home = categories[0];
      const idx = home.items.findIndex((item) => item.id === siteData.id);
      if (idx >= 0) {
        updateSite('home', siteData);
        isUpdate = true;
      } else {
        addSite('home', siteData);
      }
    }
    setTimeout(() => {
      showMessage(isUpdate ? '书签更新成功' : '书签添加成功', 'success');
    }, 0);
  }, [categories, addSite, updateSite, showMessage]);

  /** 确认删除（带撤销 Snackbar） */
  const confirmDelete = useCallback((site) => {
    if (!site) return;
    const copy = { ...site };
    const name = copy.name;
    deletedRef.current = copy;
    deleteSite('home', copy.id);
    showMessage(`已删除「${name}」`, 'success', '撤销', undoDelete);
  }, [deleteSite, showMessage]);

  /** 撤销删除 */
  const undoDelete = useCallback(() => {
    const site = deletedRef.current;
    if (site) {
      addSite('home', site);
      showMessage(`已恢复「${site.name}」`, 'info');
      deletedRef.current = null;
    }
  }, [addSite, showMessage]);

  return { saveSite, confirmDelete };
}
