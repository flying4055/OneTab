import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createCacheStorage } from './CacheManager';
import { notifyStoreUpdate } from './sync';

// 设置的防抖存储
const settingsStorage = createCacheStorage({ 
  delay: 500,
  onSet: (name, value) => notifyStoreUpdate(name, value) // 状态变动时立即广播给其他标签页
});

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      wallpaperUrl: '/bg.webp', // 修改为当前根目录实际存在的壁纸
      openInNewTab: false,
      searchEngine: 'google', // 默认搜索引擎
      
      setWallpaperUrl: (url) => set({ wallpaperUrl: url || '' }),
      setOpenInNewTab: (value) => set({ openInNewTab: value }),
      toggleOpenInNewTab: () => set((state) => ({ openInNewTab: !state.openInNewTab })),
      setSearchEngine: (engine) => set({ searchEngine: engine }),
      
      // 可以在此处添加更多全局配置，比如透明度等
      wallpaperOpacity: 1,
      setWallpaperOpacity: (opacity) => set({ wallpaperOpacity: opacity }),
    }),
    {
      name: 'settings_data_v2', // 升级名称以触发刷新并清理旧的无效壁纸配置
      storage: createJSONStorage(() => settingsStorage),
      // @ts-ignore - Zustand persist middleware type limitations
      /**
       * @param {{ wallpaperUrl?: string; openInNewTab?: boolean; searchEngine?: string } | null | undefined} persistedState
       * @param {any} currentState
       */
      merge: (persistedState, currentState) => {
        const state = persistedState;
        // 如果是从旧版迁移
        if (!state) {
          const savedWallpaper = localStorage.getItem('wallpaper_url');
          const savedOpenInNewTab = localStorage.getItem('open_in_new_tab');
          return {
            ...currentState,
            wallpaperUrl: savedWallpaper !== null && savedWallpaper !== '/static/img/bg.jpg' ? savedWallpaper : currentState.wallpaperUrl,
            openInNewTab: savedOpenInNewTab !== null ? savedOpenInNewTab === 'true' : currentState.openInNewTab,
          };
        }
        return { ...currentState, ...state };
      }
    }
  )
);
