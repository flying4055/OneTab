import { CACHE_CONFIG } from '../core/constants.js';
import { iconCacheManager } from './cacheManager.js';
import { isAllowedIconUrl } from './favicon.js';

/**
 * 图标获取器
 * 实现智能获取、请求去重、并发控制等功能
 */
class IconFetcher {
    constructor() {
        this.pendingRequests = new Map();  // 正在进行的请求
        this.activeRequests = 0;  // 当前活跃请求数
        this.requestQueue = [];   // 请求队列
        this.negativeCache = new Map(); // 失败负缓存（避免重复请求无效地址）
        this.negativeCacheTtl = 6 * 60 * 60 * 1000; // 6小时
    }

    /**
     * 获取图标的缓存策略
     */
    getCacheStrategy(url) {
        if (url.startsWith('data:')) {
            return 'DATA_URL';
        }
        
        if (url.includes('google.com/s2/favicons')) {
            return 'GOOGLE_FAVICON';
        }
        
        return 'DIRECT_ICON';
    }

    isAbortError(error) {
        return error?.name === 'AbortError';
    }

    isNegativeCacheHit(cacheKey) {
        const expiresAt = this.negativeCache.get(cacheKey);
        if (!expiresAt) return false;
        if (Date.now() >= expiresAt) {
            this.negativeCache.delete(cacheKey);
            return false;
        }
        return true;
    }

    setNegativeCache(cacheKey, ttl = this.negativeCacheTtl) {
        if (!cacheKey) return;
        this.negativeCache.set(cacheKey, Date.now() + ttl);
    }

    clearNegativeCache(cacheKey) {
        if (!cacheKey) return;
        this.negativeCache.delete(cacheKey);
    }

    wrapWithAbortSignal(promise, signal) {
        if (!signal) return promise;
        if (signal.aborted) return Promise.resolve(null);

        return new Promise((resolve, reject) => {
            const onAbort = () => {
                cleanup();
                resolve(null);
            };

            const cleanup = () => {
                signal.removeEventListener('abort', onAbort);
            };

            signal.addEventListener('abort', onAbort, { once: true });
            promise.then((result) => {
                cleanup();
                resolve(result);
            }).catch((error) => {
                cleanup();
                reject(error);
            });
        });
    }

    /**
     * 带去重的图标获取
     */
    async fetchWithDedupe(url, options = {}) {
        if (!url) return null;
        const strategy = this.getCacheStrategy(url);
        const cacheKey = iconCacheManager.getCacheKey(url, strategy);
        const { signal } = options;

        if (this.isNegativeCacheHit(cacheKey)) {
            return null;
        }
        
        // 检查是否有正在进行的相同请求
        if (this.pendingRequests.has(cacheKey)) {
            return this.wrapWithAbortSignal(this.pendingRequests.get(cacheKey), signal);
        }
        
        // 检查缓存
        const cached = await iconCacheManager.get(cacheKey);
        if (cached) {
            // 自愈：清理历史错误缓存（例如 data:text/html）
            if (typeof cached === 'string' && cached.startsWith('data:') && !cached.startsWith('data:image/')) {
                await iconCacheManager.delete(cacheKey);
            } else {
                this.clearNegativeCache(cacheKey);
                return cached;
            }
        }

        // 经过缓存自愈后，若存在负缓存命中则直接返回
        if (this.isNegativeCacheHit(cacheKey)) {
            return null;
        }
        
        // 创建新请求
        const fetchPromise = this.fetchIcon(url, cacheKey, strategy, { signal });
        this.pendingRequests.set(cacheKey, fetchPromise);
        
        try {
            const result = await this.wrapWithAbortSignal(fetchPromise, signal);
            if (result) {
                this.clearNegativeCache(cacheKey);
            }
            return result;
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }

    /**
     * 获取图标（核心方法）
     */
    async fetchIcon(url, cacheKey = null, strategy = null, options = {}) {
        const resolvedStrategy = strategy || this.getCacheStrategy(url);
        if (!cacheKey) {
            cacheKey = iconCacheManager.getCacheKey(url, resolvedStrategy);
        }
        
        try {
            // 控制并发请求数
            await this.waitForSlot();
            
            let dataUrl;
            
            if (url.startsWith('data:')) {
                // DataURL 直接使用
                dataUrl = url;
            } else {
                // 网络请求获取图标
                dataUrl = await this.fetchFromNetwork(url, {
                    signal: options.signal,
                    cacheKey
                });
            }
            
            if (dataUrl) {
                // 存储到缓存
                await iconCacheManager.set(cacheKey, dataUrl, resolvedStrategy);
                this.clearNegativeCache(cacheKey);
            }
            
            return dataUrl;
        } catch (error) {
            if (this.isAbortError(error)) {
                return null;
            }
            if (error?.noRetry) {
                this.setNegativeCache(cacheKey);
                return null;
            }
            console.warn(`获取图标失败 (${url}):`, error);
            return null;
        } finally {
            this.releaseSlot();
        }
    }

    /**
     * 从网络获取图标
     */
    async fetchFromNetwork(url, options = {}) {
        const { TIMEOUT, RETRY_ATTEMPTS } = CACHE_CONFIG.HTTP;
        const { signal, cacheKey } = options;
        
        for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
            if (signal?.aborted) {
                const abortError = new Error('Aborted');
                abortError.name = 'AbortError';
                abortError.noRetry = true;
                throw abortError;
            }

            const controller = new AbortController();
            let timeoutId = null;
            let abortHandler = null;

            try {
                timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

                if (signal) {
                    abortHandler = () => controller.abort();
                    signal.addEventListener('abort', abortHandler, { once: true });
                }
                
                const response = await fetch(url, {
                    signal: controller.signal,
                    mode: 'cors',
                    credentials: 'omit',
                    cache: 'force-cache'
                });
                
                if (!response.ok) {
                    const httpError = new Error(`HTTP ${response.status}`);
                    httpError.status = response.status;
                    httpError.noRetry = response.status >= 400 && response.status < 500 && response.status !== 429;
                    if (httpError.noRetry) {
                        this.setNegativeCache(cacheKey);
                    }
                    throw httpError;
                }

                const contentType = String(response.headers.get('content-type') || '').toLowerCase();
                const isImageResponse = contentType.startsWith('image/');
                const isBinaryStream = contentType.includes('application/octet-stream') || contentType.includes('binary/octet-stream');
                if (contentType && !isImageResponse && !isBinaryStream) {
                    const typeError = new Error(`INVALID_CONTENT_TYPE: ${contentType}`);
                    typeError.noRetry = true;
                    this.setNegativeCache(cacheKey);
                    throw typeError;
                }
                
                const blob = await response.blob();
                return await this.blobToDataUrl(blob);
                
            } catch (error) {
                if (this.isAbortError(error)) {
                    error.noRetry = true;
                }
                // CORS/网络类失败通常无法通过重试修复，避免预检/重试风暴
                if (error instanceof TypeError && !this.isAbortError(error)) {
                    error.noRetry = true;
                    this.setNegativeCache(cacheKey, 30 * 60 * 1000);
                }
                const isLastAttempt = attempt === RETRY_ATTEMPTS - 1;
                const shouldRetry = !isLastAttempt && !error?.noRetry;
                if (!shouldRetry) {
                    throw error;
                }
                // 等待一段时间后重试
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            } finally {
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                }
                if (signal && abortHandler) {
                    signal.removeEventListener('abort', abortHandler);
                }
            }
        }
    }

    /**
     * Blob 转换为 DataURL
     */
    blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * 等待可用的请求槽位
     */
    waitForSlot() {
        return new Promise((resolve) => {
            if (this.activeRequests < CACHE_CONFIG.HTTP.CONCURRENT_LIMIT) {
                this.activeRequests++;
                resolve();
            } else {
                // 加入队列等待
                this.requestQueue.push(resolve);
            }
        });
    }

    /**
     * 释放请求槽位
     */
    releaseSlot() {
        this.activeRequests--;
        
        // 处理队列中的下一个请求
        if (this.requestQueue.length > 0 && this.activeRequests < CACHE_CONFIG.HTTP.CONCURRENT_LIMIT) {
            const nextResolve = this.requestQueue.shift();
            this.activeRequests++;
            nextResolve();
        }
    }

    /**
     * 预加载图标
     */
    async preloadIcons(sites) {
        const preloadPromises = [];
        
        for (const site of sites) {
            if (site.src && isAllowedIconUrl(site.src)) {
                // 预加载直接链接的图标
                preloadPromises.push(this.fetchWithDedupe(site.src).catch(() => null));
            }
            
            // 预加载 Google favicon（如果需要）
            if (!site.src) {
                const faviconUrl = this.getFaviconUrl(site.url);
                preloadPromises.push(this.fetchWithDedupe(faviconUrl).catch(() => null));
            }
            
            // 限制并发预加载数量
            if (preloadPromises.length >= 10) {
                await Promise.all(preloadPromises.splice(0, 10));
            }
        }
        
        // 处理剩余的预加载请求
        if (preloadPromises.length > 0) {
            await Promise.all(preloadPromises);
        }
    }

    /**
     * 获取 Google favicon URL
     */
    getFaviconUrl(siteUrl) {
        try {
            const domain = new URL(siteUrl).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        } catch {
            return '';
        }
    }

    /**
     * 批量获取图标
     */
    async batchFetch(sites) {
        const results = new Map();
        const fetchPromises = [];
        
        for (const site of sites) {
            const promise = this.fetchWithDedupe(site.src || this.getFaviconUrl(site.url))
                .then(result => {
                    results.set(site.id || site.url, result);
                    return result;
                })
                .catch(() => {
                    results.set(site.id || site.url, null);
                    return null;
                });
            
            fetchPromises.push(promise);
        }
        
        await Promise.all(fetchPromises);
        return results;
    }

    /**
     * 获取获取器状态
     */
    getStatus() {
        return {
            pendingRequests: this.pendingRequests.size,
            activeRequests: this.activeRequests,
            queuedRequests: this.requestQueue.length,
            negativeCacheSize: this.negativeCache.size
        };
    }
}

// 导出单例实例
export const iconFetcher = new IconFetcher();
