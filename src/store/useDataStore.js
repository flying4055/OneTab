import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import navData from '../../nav.json';

export const useDataStore = create(
  persist(
    (set, get) => ({
      categories: [],
      isHydrated: false,
      
      setHydrated: (state) => set({ isHydrated: state }),
      setCategories: (newCategories) => set({ categories: newCategories }),
      
      addSite: (categoryId, newSite) => set((state) => {
        const newCategories = state.categories.map(cat => {
          if (cat.id === categoryId) {
            return {
              ...cat,
              items: [...cat.items, newSite]
            };
          }
          return cat;
        });
        return { categories: newCategories };
      }),
      
      updateSite: (categoryId, updatedSite) => set((state) => {
        const newCategories = state.categories.map(cat => {
          if (cat.id === categoryId) {
            return {
              ...cat,
              items: cat.items.map(item => item.id === updatedSite.id ? updatedSite : item)
            };
          }
          return cat;
        });
        return { categories: newCategories };
      }),
      
      deleteSite: (categoryId, siteId) => set((state) => {
        const newCategories = state.categories.map(cat => {
          if (cat.id === categoryId) {
            return {
              ...cat,
              items: cat.items.filter(item => item.id !== siteId)
            };
          }
          return cat;
        });
        return { categories: newCategories };
      }),

      // 拖拽排序：重新排列指定分类下的条目
      reorderItems: (categoryId, fromIndex, toIndex) => set((state) => {
        const newCategories = state.categories.map(cat => {
          if (cat.id === categoryId) {
            const items = [...cat.items];
            const [moved] = items.splice(fromIndex, 1);
            items.splice(toIndex, 0, moved);
            return { ...cat, items };
          }
          return cat;
        });
        return { categories: newCategories };
      }),
    }),
    {
      name: 'nav_data_v4',
      onRehydrateStorage: () => (state) => {
        state.setHydrated(true);
      },
      // @ts-ignore - Zustand persist middleware type limitations
      /**
       * @param {{ categories?: any[] } | null | undefined} persistedState
       * @param {any} currentState
       */
      merge: (persistedState, currentState) => {
        // 如果有持久化数据且包含有效分类，则使用持久化数据
        if (persistedState && persistedState.categories && persistedState.categories.length > 0) {
          return {
            ...currentState,
            categories: persistedState.categories,
          };
        }

        // 无持久化数据时（首次安装 / 清除缓存），使用 nav.json 种子数据
        // 兼容旧格式 (src / bg-color) 和新格式 (icon / bgColor / textColor)
        const initialCategories = navData.categories;
        const initialItems = initialCategories.length > 0 ? initialCategories[0].items.map((/** @type {any} */ item) => ({
          id: item.id,
          name: item.name,
          url: item.url,
          icon: item.icon || item.src || '',
          bgColor: item.bgColor || item['bg-color'] || '#f0f9ff',
          textColor: item.textColor || ''
        })) : [];

        return {
          ...currentState,
          categories: [{
            id: 'home',
            label: '主页',
            items: initialItems
          }]
        };
      }
    }
  )
);
