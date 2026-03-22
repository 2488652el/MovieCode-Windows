/**
 * 本地媒体与TMDB匹配服务
 * 允许用户手动搜索TMDB并匹配本地媒体
 */

import { persist } from 'zustand/middleware';
import { create } from 'zustand';
import type { MediaItem } from '@/types';
import { searchMoviesWithCache, searchTVWithCache, getMovieDetailsWithCache, getTVDetailsWithCache } from './api/tmdbCache';

// 媒体匹配记录
interface MediaMatch {
  localMediaId: string;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string | null;
  voteAverage: number;
  year: number | null;
  genres: { id: number; name: string }[];
  matchedAt: number;
}

// 匹配Store
interface MediaMatcherStore {
  matches: Record<string, MediaMatch>; // key: localMediaId
  unmatchedMedia: MediaItem[]; // 未匹配的本地媒体
  
  // 操作
  addMatch: (mediaId: string, match: MediaMatch) => void;
  removeMatch: (mediaId: string) => void;
  getMatch: (mediaId: string) => MediaMatch | undefined;
  setUnmatchedMedia: (items: MediaItem[]) => void;
  updateMediaFromMatch: (media: MediaItem, match: MediaMatch) => MediaItem;
  clearAll: () => void;
}

export const useMediaMatcherStore = create<MediaMatcherStore>()(
  persist(
    (set, get) => ({
      matches: {},
      unmatchedMedia: [],
      
      addMatch: (mediaId: string, match: MediaMatch) => {
        set((state) => ({
          matches: {
            ...state.matches,
            [mediaId]: match
          },
          // 从未匹配中移除
          unmatchedMedia: state.unmatchedMedia.filter(item => item.id !== mediaId)
        }));
      },
      
      removeMatch: (mediaId: string) => {
        set((state) => ({
          matches: Object.fromEntries(
            Object.entries(state.matches).filter(([key]) => key !== mediaId)
          )
        }));
      },
      
      getMatch: (mediaId: string) => {
        return get().matches[mediaId];
      },
      
      setUnmatchedMedia: (items: MediaItem[]) => {
        // 过滤掉已匹配的媒体
        const matchedIds = Object.keys(get().matches);
        set({
          unmatchedMedia: items.filter(item => !matchedIds.includes(item.id))
        });
      },
      
      // 根据匹配更新媒体信息
      updateMediaFromMatch: (media: MediaItem, match: MediaMatch): MediaItem => {
        return {
          ...media,
          title: match.title,
          originalTitle: media.title,
          posterPath: match.posterPath,
          backdropPath: match.backdropPath,
          overview: match.overview,
          voteAverage: match.voteAverage,
          year: match.year,
          genres: match.genres,
          tmdbId: match.tmdbId,
        };
      },
      
      clearAll: () => {
        set({ matches: {}, unmatchedMedia: [] });
      },
    }),
    { name: 'media-matcher-store' }
  )
);

// 匹配服务类
class MediaMatcherService {
  
  /**
   * 搜索可能的TMDB匹配
   * 返回前10个匹配结果
   */
  async searchMatches(
    localTitle: string,
    mediaType: 'movie' | 'tv',
    year?: number
  ): Promise<Array<{
    tmdbId: number;
    title: string;
    originalTitle?: string;
    posterPath: string | null;
    backdropPath: string | null;
    overview: string | null;
    voteAverage: number;
    releaseDate: string;
    genres: { id: number; name: string }[];
  }>> {
    try {
      // 清理本地标题
      const cleanTitle = this.cleanTitle(localTitle);
      
      if (mediaType === 'movie') {
        const results = await searchMoviesWithCache(cleanTitle);
        return results
          .filter(r => r.posterPath || r.backdropPath) // 只返回有图片的
          .slice(0, 10)
          .map(r => ({
            tmdbId: r.id,
            title: r.title || r.originalTitle || '',
            originalTitle: r.originalTitle,
            posterPath: r.posterPath,
            backdropPath: r.backdropPath,
            overview: r.overview,
            voteAverage: 0,
            releaseDate: r.releaseDate || '',
            genres: [],
          }));
      } else {
        const results = await searchTVWithCache(cleanTitle);
        return results
          .filter(r => r.posterPath || r.backdropPath)
          .slice(0, 10)
          .map(r => ({
            tmdbId: r.id,
            title: r.name || r.originalName || '',
            originalTitle: r.originalName,
            posterPath: r.posterPath,
            backdropPath: r.backdropPath,
            overview: r.overview,
            voteAverage: 0,
            releaseDate: r.firstAirDate || '',
            genres: [],
          }));
      }
    } catch (error) {
      console.error('[MediaMatcher] 搜索失败:', error);
      return [];
    }
  }
  
  /**
   * 获取TMDB详细信息
   */
  async getMatchDetails(
    tmdbId: number,
    mediaType: 'movie' | 'tv'
  ): Promise<MediaMatch | null> {
    try {
      if (mediaType === 'movie') {
        const details = await getMovieDetailsWithCache(tmdbId);
        return {
          localMediaId: '',
          tmdbId: details.id,
          mediaType: 'movie',
          title: details.title,
          posterPath: details.posterPath,
          backdropPath: details.backdropPath,
          overview: details.overview,
          voteAverage: details.voteAverage,
          year: details.releaseDate ? parseInt(details.releaseDate.split('-')[0]) : null,
          genres: details.genres || [],
          matchedAt: Date.now(),
        };
      } else {
        const details = await getTVDetailsWithCache(tmdbId);
        return {
          localMediaId: '',
          tmdbId: details.id,
          mediaType: 'tv',
          title: details.name,
          posterPath: details.posterPath,
          backdropPath: details.backdropPath,
          overview: details.overview,
          voteAverage: details.voteAverage,
          year: details.firstAirDate ? parseInt(details.firstAirDate.split('-')[0]) : null,
          genres: details.genres || [],
          matchedAt: Date.now(),
        };
      }
    } catch (error) {
      console.error('[MediaMatcher] 获取详情失败:', error);
      return null;
    }
  }
  
  /**
   * 清理标题（移除分辨率、编码等标签）
   */
  private cleanTitle(title: string): string {
    // 移除常见的视频标签
    const patterns = [
      /\b(2160p|1080p|720p|480p|360p|240p)\b/gi,
      /\b(bluray|blu-ray|bdrip|dvdrip|webrip|web-dl|hdtv|cam|ts|tc|screener)\b/gi,
      /\b(x264|x265|hevc|h264|avc|vp9|vp10)\b/gi,
      /\b(aac|ac3|dts|mp3|flac)\b/gi,
      /\b(chs|cht|cn|en|eng|jpn|jp)\b/gi,
      /\b(ass|srt|sub)\b/gi,
      /[\[\(【].*?[\]\)】]/g, // 移除[]()【】中的内容
      /\s*-\s*$/g, // 移除末尾的破折号
    ];
    
    let cleaned = title;
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    // 移除多余空格
    return cleaned.trim().replace(/\s+/g, ' ');
  }
  
  /**
   * 自动匹配本地媒体
   * 遍历未匹配的媒体，尝试自动匹配
   */
  async autoMatchMedia(
    localMedia: MediaItem[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, MediaMatch>> {
    const results = new Map<string, MediaMatch>();
    const matcher = useMediaMatcherStore.getState();
    
    for (let i = 0; i < localMedia.length; i++) {
      const media = localMedia[i];
      
      // 跳过已匹配的
      if (matcher.getMatch(media.id)) {
        continue;
      }
      
      onProgress?.(i + 1, localMedia.length);
      
      try {
        // 搜索匹配
        const matches = await this.searchMatches(
          media.title,
          media.type === 'tv' ? 'tv' : 'movie',
          media.year || undefined
        );
        
        // 如果只有一个精确匹配，自动选择
        if (matches.length === 1) {
          const details = await this.getMatchDetails(
            matches[0].tmdbId,
            media.type === 'tv' ? 'tv' : 'movie'
          );
          
          if (details) {
            results.set(media.id, { ...details, localMediaId: media.id });
          }
        }
        
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`[MediaMatcher] 自动匹配失败: ${media.title}`, error);
      }
    }
    
    return results;
  }
}

// 导出单例
export const mediaMatcherService = new MediaMatcherService();

// 导出hooks
export function useMediaMatch(mediaId: string) {
  return useMediaMatcherStore((state) => state.matches[mediaId]);
}

export function useUnmatchedMedia() {
  return useMediaMatcherStore((state) => state.unmatchedMedia);
}
