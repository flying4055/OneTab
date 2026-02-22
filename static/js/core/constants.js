export const NAV_STORAGE_KEY = 'nav_data_v1';
export const WALLPAPER_STORAGE_KEY = 'wallpaper_v1';
export const TAB_STATE_STORAGE_KEY = 'tab_state_v1';
export const SEARCH_RESULT_LIMIT = 8;
export const WALLPAPER_MAX_SIZE = 5 * 1024 * 1024;
export const WALLPAPER_MAX_DIMENSION = 4096;
export const WALLPAPER_TARGET_DIMENSION = 2560;
export const WALLPAPER_OPTIMIZE_THRESHOLD = 1024 * 1024;
export const WALLPAPER_MAX_DATA_URL = 2_400_000;
export const ALLOWED_ICON_HOSTS = [
    'google.com',
    'gstatic.com',
    'files.codelife.cc',
    'img.alicdn.com',
    'w1.v2ai.top',
    's.w.org'
];

// 图标缓存配置
export const CACHE_CONFIG = {
    // 内存缓存配置
    MEMORY_CACHE: {
        MAX_SIZE: 100,  // 最大缓存条目数
        TTL: 30 * 60 * 1000  // 30分钟内存缓存超时
    },
    
    // IndexedDB 缓存配置
    INDEXEDDB_CACHE: {
        DB_NAME: 'OneTabIconCache',
        DB_VERSION: 1,
        STORE_NAME: 'icons',
        MAX_ENTRIES: 1000,  // 最大存储条目数
        CLEANUP_INTERVAL: 24 * 60 * 60 * 1000  // 24小时清理间隔
    },
    
    // 不同类型图标的缓存策略
    CACHE_STRATEGIES: {
        GOOGLE_FAVICON: {
            ttl: 24 * 60 * 60 * 1000,  // 1天
            maxAge: '1d'
        },
        DIRECT_ICON: {
            ttl: 7 * 24 * 60 * 60 * 1000,  // 7天
            maxAge: '7d'
        },
        DATA_URL: {
            ttl: Infinity,  // 永久缓存
            maxAge: '1y'
        }
    },
    
    // HTTP 请求配置
    HTTP: {
        TIMEOUT: 10000,  // 10秒超时
        RETRY_ATTEMPTS: 3,  // 重试次数
        CONCURRENT_LIMIT: 6   // 并发请求数限制
    }
};
