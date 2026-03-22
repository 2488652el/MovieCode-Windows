/**
 * TMDB 数据缓存服务
 * 实现7天本地缓存，减少API调用，无网络时使用缓存
 */

import { persist } from 'zustand/middleware';
import { create } from 'zustand';
import { 
  searchMovies, 
  searchTV, 
  getMovieDetails, 
  getTVDetails, 
  getMovieCredits, 
  getTVCredits,
  getImageUrl,
  getBackdropUrl
} from './tmdb';
import type { TMDBSearchResult, TMDBMovieDetails, TMDBTVDetails, TMDBMovieCredits, TMDBTVCredits } from '@/types';

// 缓存有效期：7天
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

// 缓存条目接口
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// TMDB缓存Store
interface TMDBCacheStore {
  searchCache: Record<string, CacheEntry<TMDBSearchResult[]>>;
  movieDetailsCache: Record<number, CacheEntry<TMDBMovieDetails>>;
  tvDetailsCache: Record<number, CacheEntry<TMDBTVDetails>>;
  movieCreditsCache: Record<number, CacheEntry<TMDBMovieCredits>>;
  tvCreditsCache: Record<number, CacheEntry<TMDBTVCredits>>;
  
  // 缓存操作
  getSearchCache: (key: string) => TMDBSearchResult[] | null;
  setSearchCache: (key: string, data: TMDBSearchResult[]) => void;
  getMovieDetailsCache: (tmdbId: number) => TMDBMovieDetails | null;
  setMovieDetailsCache: (tmdbId: number, data: TMDBMovieDetails) => void;
  getTVDetailsCache: (tmdbId: number) => TMDBTVDetails | null;
  setTVDetailsCache: (tmdbId: number, data: TMDBTVDetails) => void;
  getMovieCreditsCache: (tmdbId: number) => TMDBMovieCredits | null;
  setMovieCreditsCache: (tmdbId: number, data: TMDBMovieCredits) => void;
  getTVCreditsCache: (tmdbId: number) => TMDBTVCredits | null;
  setTVCreditsCache: (tmdbId: number, data: TMDBTVCredits) => void;
  
  // 工具方法
  isCacheValid: <T>(entry: CacheEntry<T>) => boolean;
  clearExpiredCache: () => void;
  clearAllCache: () => void;
}

// 检查缓存是否有效
const isCacheValid = <T>(entry: CacheEntry<T>): boolean => {
  return Date.now() - entry.timestamp < CACHE_DURATION;
};

export const useTMDBCacheStore = create<TMDBCacheStore>()(
  persist(
    (set, get) => ({
      searchCache: {},
      movieDetailsCache: {},
      tvDetailsCache: {},
      movieCreditsCache: {},
      tvCreditsCache: {},
      
      // 搜索缓存
      getSearchCache: (key: string) => {
        const entry = get().searchCache[key];
        if (entry && isCacheValid(entry)) {
          return entry.data;
        }
        return null;
      },
      setSearchCache: (key: string, data: TMDBSearchResult[]) => {
        set((state) => ({
          searchCache: {
            ...state.searchCache,
            [key]: { data, timestamp: Date.now() }
          }
        }));
      },
      
      // 电影详情缓存
      getMovieDetailsCache: (tmdbId: number) => {
        const entry = get().movieDetailsCache[tmdbId];
        if (entry && isCacheValid(entry)) {
          return entry.data;
        }
        return null;
      },
      setMovieDetailsCache: (tmdbId: number, data: TMDBMovieDetails) => {
        set((state) => ({
          movieDetailsCache: {
            ...state.movieDetailsCache,
            [tmdbId]: { data, timestamp: Date.now() }
          }
        }));
      },
      
      // 电视剧详情缓存
      getTVDetailsCache: (tmdbId: number) => {
        const entry = get().tvDetailsCache[tmdbId];
        if (entry && isCacheValid(entry)) {
          return entry.data;
        }
        return null;
      },
      setTVDetailsCache: (tmdbId: number, data: TMDBTVDetails) => {
        set((state) => ({
          tvDetailsCache: {
            ...state.tvDetailsCache,
            [tmdbId]: { data, timestamp: Date.now() }
          }
        }));
      },
      
      // 电影演员缓存
      getMovieCreditsCache: (tmdbId: number) => {
        const entry = get().movieCreditsCache[tmdbId];
        if (entry && isCacheValid(entry)) {
          return entry.data;
        }
        return null;
      },
      setMovieCreditsCache: (tmdbId: number, data: TMDBMovieCredits) => {
        set((state) => ({
          movieCreditsCache: {
            ...state.movieCreditsCache,
            [tmdbId]: { data, timestamp: Date.now() }
          }
        }));
      },
      
      // 电视剧演员缓存
      getTVCreditsCache: (tmdbId: number) => {
        const entry = get().tvCreditsCache[tmdbId];
        if (entry && isCacheValid(entry)) {
          return entry.data;
        }
        return null;
      },
      setTVCreditsCache: (tmdbId: number, data: TMDBTVCredits) => {
        set((state) => ({
          tvCreditsCache: {
            ...state.tvCreditsCache,
            [tmdbId]: { data, timestamp: Date.now() }
          }
        }));
      },
      
      isCacheValid,
      
      // 清除过期缓存
      clearExpiredCache: () => {
        set((state) => ({
          searchCache: Object.fromEntries(
            Object.entries(state.searchCache).filter(([_, entry]) => isCacheValid(entry))
          ),
          movieDetailsCache: Object.fromEntries(
            Object.entries(state.movieDetailsCache).filter(([_, entry]) => isCacheValid(entry))
          ),
          tvDetailsCache: Object.fromEntries(
            Object.entries(state.tvDetailsCache).filter(([_, entry]) => isCacheValid(entry))
          ),
          movieCreditsCache: Object.fromEntries(
            Object.entries(state.movieCreditsCache).filter(([_, entry]) => isCacheValid(entry))
          ),
          tvCreditsCache: Object.fromEntries(
            Object.entries(state.tvCreditsCache).filter(([_, entry]) => isCacheValid(entry))
          ),
        }));
      },
      
      clearAllCache: () => {
        set({
          searchCache: {},
          movieDetailsCache: {},
          tvDetailsCache: {},
          movieCreditsCache: {},
          tvCreditsCache: {},
        });
      },
    }),
    { name: 'tmdb-cache-store' }
  )
);

// 带缓存的API调用函数

/**
 * 带缓存的搜索电影
 */
export async function searchMoviesWithCache(query: string): Promise<TMDBSearchResult[]> {
  const cache = useTMDBCacheStore.getState();
  const cacheKey = `movie:${query}`;
  
  // 先检查缓存
  const cached = cache.getSearchCache(cacheKey);
  if (cached) {
    console.log(`[TMDB Cache] 使用缓存: searchMovies(${query})`);
    return cached;
  }
  
  try {
    const results = await searchMovies(query);
    cache.setSearchCache(cacheKey, results);
    console.log(`[TMDB Cache] API调用: searchMovies(${query})`);
    return results;
  } catch (error) {
    // 网络失败时返回缓存（即使过期）
    const expiredCache = cache.searchCache[cacheKey];
    if (expiredCache) {
      console.log(`[TMDB Cache] 网络失败，使用过期缓存: searchMovies(${query})`);
      return expiredCache.data;
    }
    throw error;
  }
}

/**
 * 带缓存的搜索电视剧
 */
export async function searchTVWithCache(query: string): Promise<TMDBSearchResult[]> {
  const cache = useTMDBCacheStore.getState();
  const cacheKey = `tv:${query}`;
  
  const cached = cache.getSearchCache(cacheKey);
  if (cached) {
    console.log(`[TMDB Cache] 使用缓存: searchTV(${query})`);
    return cached;
  }
  
  try {
    const results = await searchTV(query);
    cache.setSearchCache(cacheKey, results);
    console.log(`[TMDB Cache] API调用: searchTV(${query})`);
    return results;
  } catch (error) {
    const expiredCache = cache.searchCache[cacheKey];
    if (expiredCache) {
      console.log(`[TMDB Cache] 网络失败，使用过期缓存: searchTV(${query})`);
      return expiredCache.data;
    }
    throw error;
  }
}

/**
 * 带缓存的电影详情
 */
export async function getMovieDetailsWithCache(tmdbId: number): Promise<TMDBMovieDetails> {
  const cache = useTMDBCacheStore.getState();
  
  const cached = cache.getMovieDetailsCache(tmdbId);
  if (cached) {
    console.log(`[TMDB Cache] 使用缓存: getMovieDetails(${tmdbId})`);
    return cached;
  }
  
  try {
    const details = await getMovieDetails(tmdbId);
    cache.setMovieDetailsCache(tmdbId, details);
    console.log(`[TMDB Cache] API调用: getMovieDetails(${tmdbId})`);
    return details;
  } catch (error) {
    const expiredCache = cache.movieDetailsCache[tmdbId];
    if (expiredCache) {
      console.log(`[TMDB Cache] 网络失败，使用过期缓存: getMovieDetails(${tmdbId})`);
      return expiredCache.data;
    }
    throw error;
  }
}

/**
 * 带缓存的电视剧详情
 */
export async function getTVDetailsWithCache(tmdbId: number): Promise<TMDBTVDetails> {
  const cache = useTMDBCacheStore.getState();
  
  const cached = cache.getTVDetailsCache(tmdbId);
  if (cached) {
    console.log(`[TMDB Cache] 使用缓存: getTVDetails(${tmdbId})`);
    return cached;
  }
  
  try {
    const details = await getTVDetails(tmdbId);
    cache.setTVDetailsCache(tmdbId, details);
    console.log(`[TMDB Cache] API调用: getTVDetails(${tmdbId})`);
    return details;
  } catch (error) {
    const expiredCache = cache.tvDetailsCache[tmdbId];
    if (expiredCache) {
      console.log(`[TMDB Cache] 网络失败，使用过期缓存: getTVDetails(${tmdbId})`);
      return expiredCache.data;
    }
    throw error;
  }
}

/**
 * 带缓存的电影演员
 */
export async function getMovieCreditsWithCache(tmdbId: number): Promise<TMDBMovieCredits> {
  const cache = useTMDBCacheStore.getState();
  
  const cached = cache.getMovieCreditsCache(tmdbId);
  if (cached) {
    console.log(`[TMDB Cache] 使用缓存: getMovieCredits(${tmdbId})`);
    return cached;
  }
  
  try {
    const credits = await getMovieCredits(tmdbId);
    cache.setMovieCreditsCache(tmdbId, credits);
    console.log(`[TMDB Cache] API调用: getMovieCredits(${tmdbId})`);
    return credits;
  } catch (error) {
    const expiredCache = cache.movieCreditsCache[tmdbId];
    if (expiredCache) {
      console.log(`[TMDB Cache] 网络失败，使用过期缓存: getMovieCredits(${tmdbId})`);
      return expiredCache.data;
    }
    throw error;
  }
}

/**
 * 带缓存的电视剧演员
 */
export async function getTVCreditsWithCache(tmdbId: number): Promise<TMDBTVCredits> {
  const cache = useTMDBCacheStore.getState();
  
  const cached = cache.getTVCreditsCache(tmdbId);
  if (cached) {
    console.log(`[TMDB Cache] 使用缓存: getTVCredits(${tmdbId})`);
    return cached;
  }
  
  try {
    const credits = await getTVCredits(tmdbId);
    cache.setTVCreditsCache(tmdbId, credits);
    console.log(`[TMDB Cache] API调用: getTVCredits(${tmdbId})`);
    return credits;
  } catch (error) {
    const expiredCache = cache.tvCreditsCache[tmdbId];
    if (expiredCache) {
      console.log(`[TMDB Cache] 网络失败，使用过期缓存: getTVCredits(${tmdbId})`);
      return expiredCache.data;
    }
    throw error;
  }
}

// 辅助函数

/**
 * 获取演员头像URL
 */
export function getProfileUrl(path: string | null, size: 'w45' | 'w185' | 'h632' | 'original' = 'w185'): string | null {
  return getImageUrl(path, size as 'w500' | 'original');
}

/**
 * 获取剧集缩略图URL
 */
export function getStillUrl(path: string | null): string | null {
  return getImageUrl(path, 'w500');
}
