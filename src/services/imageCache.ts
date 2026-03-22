/**
 * 图片缓存服务
 * 使用 IndexedDB 存储图片缓存，支持内存缓存和磁盘缓存
 */

interface CacheEntry {
  url: string;
  blob: Blob;
  timestamp: number;
  size: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
}

class ImageCacheService {
  private memoryCache: Map<string, string> = new Map(); // url -> blobUrl
  private dbName = 'MovieCodeImageCache';
  private dbVersion = 1;
  private storeName = 'images';
  private maxMemoryCacheSize = 50; // 内存缓存最多50张
  private maxDiskCacheSize = 500 * 1024 * 1024; // 500MB
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, entries: 0 };
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initDB();
  }

  /**
   * 初始化 IndexedDB
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open image cache database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.loadStats();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }

  /**
   * 确保数据库初始化完成
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (this.initPromise) {
      await this.initPromise;
    }
    return this.db!;
  }

  /**
   * 加载缓存统计
   */
  private async loadStats(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(this.storeName, 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve) => {
      const request = store.openCursor();
      let totalSize = 0;
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          totalSize += cursor.value.size;
          count++;
          cursor.continue();
        } else {
          this.stats.size = totalSize;
          this.stats.entries = count;
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * 获取缓存的图片 URL
   */
  async getImageUrl(originalUrl: string): Promise<string | null> {
    // 先检查内存缓存
    if (this.memoryCache.has(originalUrl)) {
      this.stats.hits++;
      return this.memoryCache.get(originalUrl)!;
    }

    // 检查 IndexedDB 缓存
    const db = await this.ensureDB();
    
    return new Promise((resolve) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(originalUrl);

      request.onsuccess = () => {
        const entry: CacheEntry | undefined = request.result;
        
        if (entry) {
          // 创建 Blob URL
          const blobUrl = URL.createObjectURL(entry.blob);
          
          // 更新内存缓存
          this.addToMemoryCache(originalUrl, blobUrl);
          
          this.stats.hits++;
          resolve(blobUrl);
        } else {
          this.stats.misses++;
          resolve(null);
        }
      };

      request.onerror = () => {
        this.stats.misses++;
        resolve(null);
      };
    });
  }

  /**
   * 缓存图片
   */
  async cacheImage(url: string, blob: Blob): Promise<void> {
    // 添加到内存缓存
    const blobUrl = URL.createObjectURL(blob);
    this.addToMemoryCache(url, blobUrl);

    // 添加到 IndexedDB
    const db = await this.ensureDB();
    const entry: CacheEntry = {
      url,
      blob,
      timestamp: Date.now(),
      size: blob.size,
    };

    return new Promise((resolve) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(entry);

      request.onsuccess = () => {
        this.stats.size += blob.size;
        this.stats.entries++;
        this.cleanupIfNeeded();
        resolve();
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * 从 URL 下载并缓存图片
   */
  async fetchAndCache(url: string): Promise<string | null> {
    // 先检查缓存
    const cached = await this.getImageUrl(url);
    if (cached) return cached;

    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const blob = await response.blob();
      await this.cacheImage(url, blob);
      
      return this.memoryCache.get(url) || null;
    } catch (error) {
      console.error('Failed to fetch and cache image:', error);
      return null;
    }
  }

  /**
   * 添加到内存缓存，必要时清理
   */
  private addToMemoryCache(url: string, blobUrl: string): void {
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      // 删除最早的缓存
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        const oldUrl = this.memoryCache.get(firstKey);
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        this.memoryCache.delete(firstKey);
      }
    }
    this.memoryCache.set(url, blobUrl);
  }

  /**
   * 清理过大的缓存
   */
  private async cleanupIfNeeded(): Promise<void> {
    if (this.stats.size <= this.maxDiskCacheSize) return;

    const db = await this.ensureDB();
    const transaction = db.transaction(this.storeName, 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const index = store.index('timestamp');

    // 按时间排序，删除最旧的
    const targetSize = this.maxDiskCacheSize * 0.8; // 清理到 80%
    let currentSize = this.stats.size;

    return new Promise((resolve) => {
      const request = index.openCursor();
      const keysToDelete: string[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor && currentSize > targetSize) {
          currentSize -= cursor.value.size;
          keysToDelete.push(cursor.value.url);
          cursor.continue();
        } else {
          // 删除旧条目
          keysToDelete.forEach((key) => {
            store.delete(key);
          });
          this.stats.size = currentSize;
          this.stats.entries -= keysToDelete.length;
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 清除所有缓存
   */
  async clearCache(): Promise<void> {
    // 清除内存缓存
    this.memoryCache.forEach((blobUrl) => URL.revokeObjectURL(blobUrl));
    this.memoryCache.clear();

    // 清除 IndexedDB
    const db = await this.ensureDB();
    const transaction = db.transaction(this.storeName, 'readwrite');
    const store = transaction.objectStore(this.storeName);
    store.clear();

    this.stats = { hits: 0, misses: 0, size: 0, entries: 0 };
  }

  /**
   * 预加载图片
   */
  async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map((url) => this.fetchAndCache(url));
    await Promise.allSettled(promises);
  }
}

// 单例
export const imageCache = new ImageCacheService();

// 懒加载图片组件
import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // 检查浏览器是否支持 IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      // 不支持则直接加载
      loadImage(src);
      return;
    }

    // 创建观察器
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage(src);
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px', // 提前 100px 开始加载
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src]);

  const loadImage = async (url: string) => {
    try {
      // 尝试从缓存获取
      const cachedUrl = await imageCache.getImageUrl(url);
      setCurrentSrc(cachedUrl || url);
    } catch {
      setCurrentSrc(url);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    onError?.();
  };

  return (
    <div ref={imgRef} className={`lazy-image-container ${className}`}>
      {!isLoaded && !error && (
        <div className="lazy-image-placeholder">
          {placeholder || (
            <div className="animate-pulse bg-apple-gray-700 rounded" />
          )}
        </div>
      )}
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : ''} ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  );
};

// 虚拟滚动列表组件
interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 3,
  className = '',
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // 计算可见范围
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // 获取可见项
  const visibleItems = items.slice(startIndex, endIndex + 1);

  // 总高度
  const totalHeight = items.length * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`virtual-list-container ${className}`}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item, i) => (
          <div
            key={startIndex + i}
            style={{
              position: 'absolute',
              top: (startIndex + i) * itemHeight,
              height: itemHeight,
              width: '100%',
            }}
          >
            {renderItem(item, startIndex + i)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default imageCache;
