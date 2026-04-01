// src/store/CacheManager.js
export const createCacheStorage = (options = {}) => {
  const {
    delay = 1000,
    prefix = '',
    onSet = null, // 允许外部传入回调
  } = options;

  // In-memory cache to hold latest value before flushing
  const cache = new Map();
  const timers = new Map();

  const flush = (key) => {
    if (cache.has(key)) {
      const value = cache.get(key);
      localStorage.setItem(prefix + key, value);
      cache.delete(key);
    }
    if (timers.has(key)) {
      clearTimeout(timers.get(key));
      timers.delete(key);
    }
  };

  // Ensure data is saved when the window unloads
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      for (const key of cache.keys()) {
        flush(key);
      }
    });
  }

  return {
    getItem: (name) => {
      // Return from memory cache if available, otherwise read from storage
      if (cache.has(name)) {
        return cache.get(name);
      }
      return localStorage.getItem(prefix + name);
    },
    setItem: (name, value) => {
      // Update memory cache immediately
      cache.set(name, value);
      
      // 触发外部回调通知（如果有）
      if (onSet) {
        onSet(name, value);
      }

      // Debounce and schedule flush
      if (timers.has(name)) {
        clearTimeout(timers.get(name));
      }

      const timer = setTimeout(() => {
        if (typeof window.requestIdleCallback !== 'undefined') {
          window.requestIdleCallback(() => flush(name));
        } else {
          flush(name);
        }
      }, delay);

      timers.set(name, timer);
    },
    removeItem: (name) => {
      if (timers.has(name)) {
        clearTimeout(timers.get(name));
        timers.delete(name);
      }
      cache.delete(name);
      localStorage.removeItem(prefix + name);
    },
  };
};

// Default debounced storage for general use
export const debouncedStorage = createCacheStorage({ delay: 500 });
