import { useDataStore } from './useDataStore';
import { useSettingsStore } from './useSettingsStore';

/**
 * 跨标签页同步：利用浏览器原生 storage 事件。
 * 当 A 标签页通过 Zustand persist 同步写入 localStorage 后，
 * B 标签页自动收到 storage 事件 → 调用 rehydrate 刷新内存状态。
 */
export const setupStoreSync = () => {
  if (typeof window === 'undefined') return;

  const handleStorageChange = (e) => {
    if (e.key === 'nav_data_v4') {
      useDataStore.persist.rehydrate();
    }
    if (e.key === 'settings_data_v2') {
      useSettingsStore.persist.rehydrate();
    }
  };

  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};
