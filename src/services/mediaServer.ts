/**
 * Plex/Emby 连接器服务
 * 支持连接现有的 Plex/Emby 媒体服务器
 */

import axios, { AxiosInstance } from 'axios';
import type { MediaItem, MediaType } from '@/types';

// 服务器类型
export type MediaServerType = 'plex' | 'emby' | 'jellyfin';

// 服务器配置
export interface MediaServerConfig {
  type: MediaServerType;
  name: string;
  url: string;
  apiKey: string;
  userId?: string;
  libraryId?: string;
}

// 媒体库项
export interface MediaServerItem {
  key: string;
  title: string;
  type: 'movie' | 'show' | 'episode' | 'artist' | 'album' | 'track';
  year?: number;
  thumb?: string;
  poster?: string;
  background?: string;
  summary?: string;
  rating?: number;
  duration?: number;
  addedAt?: number;
  mediaType?: MediaType;
}

// 媒体服务器 API 响应
export interface MediaServerResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Plex/Emby 连接器类
export class MediaServerConnector {
  private client: AxiosInstance;
  private config: MediaServerConfig;
  private serverType: MediaServerType;

  constructor(config: MediaServerConfig) {
    this.config = config;
    this.serverType = config.type;
    
    this.client = axios.create({
      baseURL: config.url,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    // 设置认证头
    if (config.type === 'plex') {
      this.client.defaults.headers['X-Plex-Token'] = config.apiKey;
    } else {
      // Emby/Jellyfin 使用 API Key
      this.client.defaults.headers['X-Emby-Token'] = config.apiKey;
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<MediaServerResponse<{ name: string; version: string }>> {
    try {
      let data: any;
      
      if (this.serverType === 'plex') {
        const res = await this.client.get('/api/v2/resources?includeHttps=1');
        data = { name: 'Plex Server', version: res.data.MediaContainer?.version || 'Unknown' };
      } else {
        // Emby/Jellyfin
        const res = await this.client.get('/System/Info');
        data = { name: res.data.ServerName, version: res.data.Version };
      }
      
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Connection failed' };
    }
  }

  /**
   * 获取所有媒体库
   */
  async getLibraries(): Promise<MediaServerResponse<MediaServerItem[]>> {
    try {
      let items: MediaServerItem[] = [];
      
      if (this.serverType === 'plex') {
        const res = await this.client.get('/api/v2/sections');
        const sections = res.data.MediaContainer?.Directory || [];
        items = sections.map((s: any) => ({
          key: s.key,
          title: s.title,
          type: s.type as 'movie' | 'show',
          thumb: s.thumb ? `${this.config.url}${s.thumb}?X-Plex-Token=${this.config.apiKey}` : undefined,
        }));
      } else {
        // Emby/Jellyfin
        const res = await this.client.get('/Library/MediaFolders');
        items = (res.data.Items || []).map((item: any) => ({
          key: item.Id,
          title: item.Name,
          type: item.CollectionType as 'movie' | 'show',
          thumb: item.PrimaryImageTag ? 
            `${this.config.url}/Items/${item.Id}/Images/Primary?X-Emby-Token=${this.config.apiKey}` : undefined,
        }));
      }
      
      return { success: true, data: items };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取媒体库内容
   */
  async getLibraryContent(libraryKey: string, options?: {
    type?: 'movie' | 'show';
    limit?: number;
    offset?: number;
  }): Promise<MediaServerResponse<MediaServerItem[]>> {
    try {
      let items: MediaServerItem[] = [];
      
      if (this.serverType === 'plex') {
        const params: any = { type: options?.type === 'movie' ? 1 : 2 };
        if (options?.limit) params.limit = options.limit;
        if (options?.offset) params.offset = options.offset;
        
        const res = await this.client.get(`/api/v2/sections/${libraryKey}/all`, { params });
        const videos = res.data.MediaContainer?.Metadata || [];
        items = videos.map((v: any) => this.mapPlexItem(v));
      } else {
        // Emby/Jellyfin
        const res = await this.client.get(`/Items?ParentId=${libraryKey}&IncludeItemTypes=${options?.type === 'movie' ? 'Movie' : 'Series'}&limit=${options?.limit || 50}&Fields=PrimaryImageAspectRatio,MediaSources`, {});
        items = (res.data.Items || []).map((item: any) => this.mapEmbyItem(item));
      }
      
      return { success: true, data: items };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 搜索媒体
   */
  async searchMedia(query: string): Promise<MediaServerResponse<MediaServerItem[]>> {
    try {
      let items: MediaServerItem[] = [];
      
      if (this.serverType === 'plex') {
        const res = await this.client.get(`/api/v2/search`, { params: { query } });
        const results = res.data.MediaContainer?.Metadata || [];
        items = results.map((r: any) => this.mapPlexItem(r));
      } else {
        // Emby/Jellyfin
        const res = await this.client.get(`/Items`, {
          params: {
            searchTerm: query,
            limit: 20,
            Fields: 'PrimaryImageAspectRatio,MediaSources'
          }
        });
        items = (res.data.Items || []).map((item: any) => this.mapEmbyItem(item));
      }
      
      return { success: true, data: items };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取直链播放地址
   */
  async getPlaybackUrl(itemKey: string): Promise<MediaServerResponse<string>> {
    try {
      let url: string;
      
      if (this.serverType === 'plex') {
        // Plex 直接播放地址
        url = `${this.config.url}/library/parts/${itemKey}?X-Plex-Token=${this.config.apiKey}`;
      } else {
        // Emby/Jellyfin 流地址
        const res = await this.client.get(`/Items/${itemKey}/PlaybackInfo`, {
          params: { MediaSourceId: itemKey }
        });
        const mediaSource = res.data.MediaSources?.[0];
        url = `${this.config.url}/Videos/${itemKey}/${mediaSource?.Id}/stream?X-Emby-Token=${this.config.apiKey}`;
      }
      
      return { success: true, data: url };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 转换 Plex 媒体项
   */
  private mapPlexItem(item: any): MediaServerItem {
    const typeMap: Record<string, 'movie' | 'show' | 'episode'> = {
      'movie': 'movie',
      'show': 'show',
      'episode': 'episode',
    };

    return {
      key: item.key,
      title: item.title || item grandparentTitle + ' - ' + item.index,
      type: typeMap[item.type] || 'movie',
      year: item.year ? parseInt(item.year) : undefined,
      thumb: item.thumb ? `${this.config.url}${item.thumb}?X-Plex-Token=${this.config.apiKey}` : undefined,
      poster: item.poster ? `${this.config.url}${item.poster}?X-Plex-Token=${this.config.apiKey}` : undefined,
      summary: item.summary,
      rating: item.rating ? parseFloat(item.rating) : undefined,
      duration: item.duration ? parseInt(item.duration) : undefined,
      addedAt: item.addedAt ? parseInt(item.addedAt) * 1000 : undefined,
    };
  }

  /**
   * 转换 Emby/Jellyfin 媒体项
   */
  private mapEmbyItem(item: any): MediaServerItem {
    return {
      key: item.Id,
      title: item.Name,
      type: item.Type === 'Series' ? 'show' : item.Type === 'Episode' ? 'episode' : 'movie',
      year: item.ProductionYear || item.PremiereDate?.split('-')?.[0],
      thumb: item.ImageTags?.Primary ? 
        `${this.config.url}/Items/${item.Id}/Images/Primary?X-Emby-Token=${this.config.apiKey}` : undefined,
      poster: item.ImageTags?.Thumb ? 
        `${this.config.url}/Items/${item.Id}/Images/Thumb?X-Emby-Token=${this.config.apiKey}` : undefined,
      background: item.BackdropImageTags?.[0] ? 
        `${this.config.url}/Items/${item.Id}/Images/Backdrop/0?X-Emby-Token=${this.config.apiKey}` : undefined,
      summary: item.Overview,
      rating: item.CriticRating,
      duration: item.RunTimeTicks ? item.RunTimeTicks / 10000 : undefined,
      addedAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
    };
  }
}

// 服务器管理器
class MediaServerManager {
  private servers: Map<string, MediaServerConnector> = new Map();

  /**
   * 添加服务器
   */
  addServer(config: MediaServerConfig): MediaServerConnector {
    const connector = new MediaServerConnector(config);
    this.servers.set(config.name, connector);
    return connector;
  }

  /**
   * 获取服务器
   */
  getServer(name: string): MediaServerConnector | undefined {
    return this.servers.get(name);
  }

  /**
   * 移除服务器
   */
  removeServer(name: string): void {
    this.servers.delete(name);
  }

  /**
   * 列出所有服务器
   */
  listServers(): string[] {
    return Array.from(this.servers.keys());
  }
}

// 导出单例
export const mediaServerManager = new MediaServerManager();
export default mediaServerManager;
