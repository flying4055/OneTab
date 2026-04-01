import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createCacheStorage } from './CacheManager';
import { notifyStoreUpdate } from './sync';
import navData from '../../nav.json';

// 专门为数据层设计的防抖存储，减少高频存取带来的 IO 开销
const dataStorage = createCacheStorage({ 
  delay: 1000,
  onSet: (name, value) => notifyStoreUpdate(name, value) // 当内存值更新时，立即广播通知其他标签页
});

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
    }),
    {
      name: 'nav_data_v4', // 升级版本号，强制清除旧缓存并使用新数据
      storage: createJSONStorage(() => dataStorage),
      onRehydrateStorage: () => (state) => {
        state.setHydrated(true);
      },
      // @ts-ignore - Zustand persist middleware type limitations
      /**
       * @param {{ categories?: any[] } | null | undefined} persistedState
       * @param {any} currentState
       */
      merge: (persistedState, currentState) => {
        // 直接使用 nav.json 的初始数据
        const initialCategories = navData.categories;
        const initialItems = initialCategories.length > 0 ? initialCategories[0].items.map(item => ({
          id: item.id,
          name: item.name,
          url: item.url,
          icon: item.src || '',
          'bg-color': item['bg-color'] || '#f0f9ff'
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
