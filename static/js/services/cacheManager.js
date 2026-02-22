import { CACHE_CONFIG } from '../core/constants.js';

/**
 * 多层级图标缓存管理器
 * 实现内存缓存 -> IndexedDB缓存 -> HTTP缓存的三级缓存架构
 */
class IconCacheManager {
    constructor() {
        this.memoryCache = new Map();  // 内存缓存 (LRU)
        this.pendingRequests = new Map();  // 正在进行的请求
        this.db = null;
        this.isInitialized = false;
        this.lastCleanup = Date.now();
        
        // 内存缓存的访问顺序跟踪 (用于LRU)
        this.accessOrder = new Set();
    }

    /**
     * 初始化缓存管理器
     */
    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.initIndexedDB();
            await this.migrateOldData();
            this.startPeriodicCleanup();
            this.isInitialized = true;
        } catch (error) {
            console.warn('缓存管理器初始化失败:', error);
        }
    }

    /**
     * 初始化 IndexedDB
     */
    initIndexedDB() {
        // 检查浏览器是否支持 IndexedDB
        if (!window.indexedDB) {
            console.warn('浏览器不支持 IndexedDB，使用内存缓存');
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const { DB_NAME, DB_VERSION, STORE_NAME } = CACHE_CONFIG.INDEXEDDB_CACHE;
            
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                console.warn('IndexedDB 初始化失败:', request.error);
                resolve(); // 降级到仅使用内存缓存
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 如果存储对象不存在，则创建它
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'domain' });
                    store.createIndex('timestamp', 'timestamp');
                    store.createIndex('lastAccess', 'lastAccess');
                }
            };
        });
    }

    /**
     * 迁移旧的 localStorage 数据
     */
    async migrateOldData() {
        try {
            const oldData = localStorage.getItem('favicon_cache_v1');
            if (oldData) {
                const parsed = JSON.parse(oldData);
                const entries = Object.entries(parsed);
                
                // 批量迁移数据到 IndexedDB
                const transaction = this.db.transaction([CACHE_CONFIG.INDEXEDDB_CACHE.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(CACHE_CONFIG.INDEXEDDB_CACHE.STORE_NAME);
                
                for (const [domain, entry] of entries) {
                    if (entry && entry.dataUrl) {
                        store.put({
                            domain,
                            dataUrl: entry.dataUrl,
                            timestamp: entry.ts || Date.now(),
                            lastAccess: Date.now(),
                            strategy: 'DATA_URL'
                        });
                    }
                }
                
                // 清除旧数据
                localStorage.removeItem('favicon_cache_v1');
            }
        } catch (error) {
            console.warn('数据迁移失败:', error);
        }
    }

    /**
     * 获取缓存键
     * 说明：
     * - Google favicon：按目标站点 domain 参数缓存，避免全部命中 google.com
     * - 直链图标：按完整 URL（不含 hash）缓存，避免同域不同路径图标串位
     * - DataURL：按内容生成短哈希，避免过长键值
     */
    getCacheKey(url, strategy = 'DIRECT_ICON') {
        if (!url) return '';

        // DataURL 使用内容哈希，避免直接把超长字符串作为键
        if (strategy === 'DATA_URL' || url.startsWith('data:')) {
            return `data:${this.hashString(url)}`;
        }

        try {
            const parsed = new URL(url, window.location.href);

            // Google favicon 按目标 domain 参数分桶
            if (strategy === 'GOOGLE_FAVICON' ||
                (parsed.hostname.includes('google.com') && parsed.pathname.includes('/s2/favicons'))) {
                const targetDomain = (parsed.searchParams.get('domain') || '').toLowerCase().replace(/^www\./, '');
                const size = parsed.searchParams.get('sz') || '64';
                if (targetDomain) {
                    return `google:${targetDomain}:${size}`;
                }
            }

            // 直链图标按完整 URL（origin + pathname + search）缓存
            const normalizedPath = parsed.pathname || '/';
            const normalizedSearch = parsed.search || '';
            return `url:${parsed.origin}${normalizedPath}${normalizedSearch}`;
        } catch {
            return `raw:${url}`;
        }
    }

    /**
     * 生成稳定短哈希（FNV-1a 32bit）
     */
    hashString(text) {
        let hash = 0x811c9dc5;
        for (let i = 0; i < text.length; i++) {
            hash ^= text.charCodeAt(i);
            hash = (hash * 0x01000193) >>> 0;
        }
        return hash.toString(16).padStart(8, '0');
    }

    /**
     * 从内存缓存获取
     */
    getFromMemory(key) {
        const entry = this.memoryCache.get(key);
        if (!entry) return null;
        
        // 检查是否过期
        if (Date.now() - entry.timestamp > CACHE_CONFIG.MEMORY_CACHE.TTL) {
            this.memoryCache.delete(key);
            this.accessOrder.delete(key);
            return null;
        }
        
        // 更新访问顺序
        this.accessOrder.delete(key);
        this.accessOrder.add(key);
        
        return entry.data;
    }

    /**
     * 存储到内存缓存
     */
    setInMemory(key, data, strategy = 'DIRECT_ICON') {
        // 如果达到最大容量，删除最久未使用的项
        if (this.memoryCache.size >= CACHE_CONFIG.MEMORY_CACHE.MAX_SIZE) {
            const oldestKey = this.accessOrder.values().next().value;
            if (oldestKey) {
                this.memoryCache.delete(oldestKey);
                this.accessOrder.delete(oldestKey);
            }
        }
        
        this.memoryCache.set(key, {
            data,
            timestamp: Date.now(),
            strategy
        });
        this.accessOrder.add(key);
    }

    /**
     * 从 IndexedDB 获取
     */
    async getFromIndexedDB(key) {
        if (!this.db) return null;
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction([CACHE_CONFIG.INDEXEDDB_CACHE.STORE_NAME], 'readonly');
            const store = transaction.objectStore(CACHE_CONFIG.INDEXEDDB_CACHE.STORE_NAME);
            const request = store.get(key);
            
            request.onsuccess = () => {
                const entry = request.result;
                if (!entry) {
                    resolve(null);
                    return;
                }
                
                // 检查是否过期
                const strategyConfig = CACHE_CONFIG.CACHE_STRATEGIES[entry.strategy] || 
                                    CACHE_CONFIG.CACHE_STRATEGIES.DIRECT_ICON;
                
                if (strategyConfig.ttl !== Infinity && 
                    Date.now() - entry.timestamp > strategyConfig.ttl) {
                    // 删除过期条目
                    this.deleteFromIndexedDB(key);
                    resolve(null);
                    return;
                }
                
                // 更新最后访问时间
                this.updateLastAccess(key);
                resolve(entry.dataUrl);
            };
            
            request.onerror = () => resolve(null);
        });
    }

    /**
     * 存储到 IndexedDB
     */
    async setInIndexedDB(key, dataUrl, strategy = 'DIRECT_ICON') {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction([CACHE_CONFIG.INDEXEDDB_CACHE.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CACHE_CONFIG.INDEXEDDB_CACHE.STORE_NAME);
            
            store.put({
                domain: key,
                dataUrl,
                timestamp: Date.now(),
                lastAccess: Date.now(),
                strategy
            });
            
            // 检查是否需要清理旧数据
            this.checkAndCleanup();
        } catch (error) {
            console.warn('IndexedDB 存储失败:', error);
        }
    }

    /**
     * 从 IndexedDB 删除
     */
    async deleteFromIndexedDB(key) {
        if (!this.db) return;
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction([CACHE_CONFIG.INDEXEDDB_CACHE.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CACHE_CONFIG.INDEXEDDB_CACHE.STORE_NAME);
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
        });
    }

    /**
     * 更新最后访问时间
     */
    async updateLastAccess(key) {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction([CACHE_CONFIG.INDEXEDDB_CACHE.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CACHE_CONFIG.INDEXEDDB_CACHE.STORE_NAME);
            const getRequest = store.get(key);
            
            getRequest.onsuccess = () => {
                const entry = getRequest.result;
                if (entry) {
                    entry.lastAccess = Date.now();
                    store.put(entry);
                }
            };
        } catch (error) {
            // 忽略错误
        }
    }

    /**
     * 获取缓存数据（多层级）
     */
    async get(key) {
        // 1. 内存缓存
        const memoryResult = this.getFromMemory(key);
        if (memoryResult) {
            return memoryResult;
        }
        
        // 2. IndexedDB 缓存
        const indexedDBResult = await this.getFromIndexedDB(key);
        if (indexedDBResult) {
            // 同步到内存缓存
            this.setInMemory(key, indexedDBResult);
            return indexedDBResult;
        }
        
        return null;
    }

    /**
     * 设置缓存数据（多层级）
     */
    async set(key, dataUrl, strategy = 'DIRECT_ICON') {
        // 同时存储到内存和 IndexedDB
        this.setInMemory(key, dataUrl, strategy);
        await this.setInIndexedDB(key, dataUrl, strategy);
    }

    /**
     * 删除缓存数据（内存 + IndexedDB）
     */
    async delete(key) {
        if (!key) return;
        this.memoryCache.delete(key);
        this.accessOrder.delete(key);
        await this.deleteFromIndexedDB(key);
    }

    /**
     * 检查并清理过期数据
     */
    async checkAndCleanup() {
        const now = Date.now();
        if (now - this.lastCleanup < CACHE_CONFIG.INDEXEDDB_CACHE.CLEANUP_INTERVAL) {
            return;
        }
        
        this.lastCleanup = now;
        await this.cleanupExpiredEntries();
    }

    /**
     * 清理过期条目
     */
    async cleanupExpiredEntries() {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction([CACHE_CONFIG.INDEXEDDB_CACHE.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CACHE_CONFIG.INDEXEDDB_CACHE.STORE_NAME);
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                const entries = getAllRequest.result;
                const now = Date.now();
                
                entries.forEach(entry => {
                    const strategyConfig = CACHE_CONFIG.CACHE_STRATEGIES[entry.strategy] || 
                                        CACHE_CONFIG.CACHE_STRATEGIES.DIRECT_ICON;
                    
                    if (strategyConfig.ttl !== Infinity && 
                        now - entry.timestamp > strategyConfig.ttl) {
                        store.delete(entry.domain);
                    }
                });
            };
        } catch (error) {
            console.warn('清理过期数据失败:', error);
        }
    }

    /**
     * 启动定期清理
     */
    startPeriodicCleanup() {
        setInterval(() => {
            this.checkAndCleanup();
        }, CACHE_CONFIG.INDEXEDDB_CACHE.CLEANUP_INTERVAL);
    }

    /**
     * 获取缓存统计信息
     */
    getStats() {
        return {
            memoryCacheSize: this.memoryCache.size,
            isInitialized: this.isInitialized,
            lastCleanup: this.lastCleanup,
            hasIndexedDB: !!this.db,
            pendingRequests: this.pendingRequests.size
        };
    }

    /**
     * 清空所有缓存
     */
    async clearAll() {
        // 清空内存缓存
        this.memoryCache.clear();
        this.accessOrder.clear();
        this.pendingRequests.clear();
        
        // 清空 IndexedDB
        if (this.db) {
            return new Promise((resolve) => {
                const transaction = this.db.transaction([CACHE_CONFIG.INDEXEDDB_CACHE.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(CACHE_CONFIG.INDEXEDDB_CACHE.STORE_NAME);
                const request = store.clear();
                
                request.onsuccess = () => resolve();
                request.onerror = () => resolve();
            });
        }
    }
}

// 导出单例实例
export const iconCacheManager = new IconCacheManager();
