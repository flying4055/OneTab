import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      wallpaperUrl: '/bg.webp',
      openInNewTab: false,
      searchEngine: 'google',
      
      setWallpaperUrl: (url) => set({ wallpaperUrl: url || '/bg.webp' }),
      setOpenInNewTab: (value) => set({ openInNewTab: value }),
      toggleOpenInNewTab: () => set((state) => ({ openInNewTab: !state.openInNewTab })),
      setSearchEngine: (engine) => set({ searchEngine: engine }),
      
      // 图标相关设置
      iconSize: 48,
      setIconSize: (size) => set({ iconSize: Math.max(48, size) }),
      gridGap: 16,
      setGridGap: (gap) => set({ gridGap: Math.max(8, gap) }),

      // 内容区域最大宽度（0 = 自动适配全宽）
      contentMaxWidth: 0,
      setContentMaxWidth: (w) => set({ contentMaxWidth: Math.max(0, w) }),

      wallpaperOpacity: 1,
      setWallpaperOpacity: (opacity) => set({ wallpaperOpacity: opacity }),
    }),
    {
      name: 'settings_data_v2',
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
