import { useDataStore } from './useDataStore';
import { useSettingsStore } from './useSettingsStore';

// BroadcastChannel 用于实时跨标签页通信
const syncChannel = typeof window !== 'undefined' ? new BroadcastChannel('onetab_sync_channel') : null;

export const notifyStoreUpdate = (storeName, value) => {
  if (syncChannel) {
    syncChannel.postMessage({ type: 'STORE_UPDATED', storeName, payload: value });
  }
};

export const setupStoreSync = () => {
  if (typeof window === 'undefined') return;

  // 1. 处理 BroadcastChannel 的实时消息（适用于 CacheManager 防抖未落盘前的实时状态同步）
  const handleMessage = (event) => {
    if (event.data && event.data.type === 'STORE_UPDATED') {
      const { storeName, payload } = event.data;
      
      if (storeName === 'nav_data_v3') {
        // 更新内存状态并通过 zustand 暴露的方法更新 store
        // 注意：Zustand Persist 中存储的数据结构包含了 { state: {...}, version: ... }
        try {
          if (payload) {
            const parsed = JSON.parse(payload);
            if (parsed.state) {
              useDataStore.setState(parsed.state, true);
            }
          }
        } catch(e) {
          console.error("Failed to sync nav_data", e);
        }
      }
      if (storeName === 'settings_data_v2') {
        try {
          if (payload) {
            const parsed = JSON.parse(payload);
            if (parsed.state) {
              useSettingsStore.setState(parsed.state, true);
            }
          }
        } catch(e) {
          console.error("Failed to sync settings_data", e);
        }
      }
    }
  };

  if (syncChannel) {
    syncChannel.addEventListener('message', handleMessage);
  }

  // 2. 保留 storage 事件作为兜底保障（当另一个标签页防抖结束最终落盘时触发）
  const handleStorageChange = (e) => {
    if (e.key === 'nav_data_v3') {
      useDataStore.persist.rehydrate();
    }
    if (e.key === 'settings_data_v2') {
      useSettingsStore.persist.rehydrate();
    }
  };

  window.addEventListener('storage', handleStorageChange);

  return () => {
    if (syncChannel) {
      syncChannel.removeEventListener('message', handleMessage);
    }
    window.removeEventListener('storage', handleStorageChange);
  };
};
