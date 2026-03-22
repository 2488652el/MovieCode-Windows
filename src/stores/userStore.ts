/**
 * 用户增强 Store
 * 包含：多用户支持、收藏夹、播放列表、观看统计
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MediaItem } from '@/types';

// ==================== 用户管理 ====================

export interface User {
  id: string;
  name: string;
  avatar?: string;
  createdAt: number;
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  defaultMediaType?: 'all' | 'movie' | 'tv' | 'anime';
  autoPlay: boolean;
  parentalControlEnabled: boolean;
  parentalControlPin?: string;
}

interface UserStore {
  users: User[];
  currentUserId: string | null;
  
  // 操作
  addUser: (name: string, avatar?: string) => User;
  removeUser: (id: string) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  setCurrentUser: (id: string | null) => void;
  getCurrentUser: () => User | undefined;
  getUserById: (id: string) => User | undefined;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      users: [{
        id: 'default',
        name: '默认用户',
        avatar: undefined,
        createdAt: Date.now(),
        settings: {
          theme: 'dark',
          defaultMediaType: 'all',
          autoPlay: true,
          parentalControlEnabled: false,
        },
      }],
      currentUserId: 'default',

      addUser: (name, avatar) => {
        const newUser: User = {
          id: `user_${Date.now()}`,
          name,
          avatar,
          createdAt: Date.now(),
          settings: {
            theme: 'dark',
            defaultMediaType: 'all',
            autoPlay: true,
            parentalControlEnabled: false,
          },
        };
        set((state) => ({ users: [...state.users, newUser] }));
        return newUser;
      },

      removeUser: (id) => set((state) => {
        const newUsers = state.users.filter((u) => u.id !== id);
        return {
          users: newUsers,
          currentUserId: state.currentUserId === id 
            ? (newUsers[0]?.id || null) 
            : state.currentUserId,
        };
      }),

      updateUser: (id, updates) => set((state) => ({
        users: state.users.map((u) =>
          u.id === id ? { ...u, ...updates } : u
        ),
      })),

      setCurrentUser: (id) => set({ currentUserId: id }),

      getCurrentUser: () => {
        const { users, currentUserId } = get();
        return users.find((u) => u.id === currentUserId);
      },

      getUserById: (id) => {
        return get().users.find((u) => u.id === id);
      },
    }),
    { name: 'user-store' }
  )
);

// ==================== 收藏夹 ====================

export interface FavoriteItem {
  id: string;
  userId: string;
  mediaItem: MediaItem;
  addedAt: number;
  note?: string;
}

interface FavoritesStore {
  favorites: FavoriteItem[];
  
  // 操作
  addFavorite: (userId: string, mediaItem: MediaItem, note?: string) => void;
  removeFavorite: (id: string) => void;
  updateFavorite: (id: string, updates: Partial<FavoriteItem>) => void;
  getUserFavorites: (userId: string) => FavoriteItem[];
  isFavorite: (userId: string, mediaId: string) => boolean;
  getFavoriteByMediaId: (userId: string, mediaId: string) => FavoriteItem | undefined;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (userId, mediaItem, note) => {
        const existing = get().favorites.find(
          (f) => f.userId === userId && f.mediaItem.id === mediaItem.id
        );
        if (existing) return;

        const newFavorite: FavoriteItem = {
          id: `fav_${Date.now()}`,
          userId,
          mediaItem,
          addedAt: Date.now(),
          note,
        };
        set((state) => ({ favorites: [...state.favorites, newFavorite] }));
      },

      removeFavorite: (id) => set((state) => ({
        favorites: state.favorites.filter((f) => f.id !== id),
      })),

      updateFavorite: (id, updates) => set((state) => ({
        favorites: state.favorites.map((f) =>
          f.id === id ? { ...f, ...updates } : f
        ),
      })),

      getUserFavorites: (userId) => {
        return get().favorites
          .filter((f) => f.userId === userId)
          .sort((a, b) => b.addedAt - a.addedAt);
      },

      isFavorite: (userId, mediaId) => {
        return get().favorites.some(
          (f) => f.userId === userId && f.mediaItem.id === mediaId
        );
      },

      getFavoriteByMediaId: (userId, mediaId) => {
        return get().favorites.find(
          (f) => f.userId === userId && f.mediaItem.id === mediaId
        );
      },
    }),
    { name: 'favorites-store' }
  )
);

// ==================== 播放列表 ====================

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  items: MediaItem[];
  createdAt: number;
  updatedAt: number;
  coverImage?: string;
}

interface PlaylistStore {
  playlists: Playlist[];
  
  // 操作
  createPlaylist: (userId: string, name: string, description?: string) => Playlist;
  deletePlaylist: (id: string) => void;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  addToPlaylist: (playlistId: string, mediaItem: MediaItem) => void;
  removeFromPlaylist: (playlistId: string, mediaId: string) => void;
  reorderPlaylist: (playlistId: string, fromIndex: number, toIndex: number) => void;
  getUserPlaylists: (userId: string) => Playlist[];
  getPlaylistById: (id: string) => Playlist | undefined;
}

export const usePlaylistStore = create<PlaylistStore>()(
  persist(
    (set, get) => ({
      playlists: [],

      createPlaylist: (userId, name, description) => {
        const newPlaylist: Playlist = {
          id: `pl_${Date.now()}`,
          userId,
          name,
          description,
          items: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ playlists: [...state.playlists, newPlaylist] }));
        return newPlaylist;
      },

      deletePlaylist: (id) => set((state) => ({
        playlists: state.playlists.filter((p) => p.id !== id),
      })),

      updatePlaylist: (id, updates) => set((state) => ({
        playlists: state.playlists.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
        ),
      })),

      addToPlaylist: (playlistId, mediaItem) => set((state) => ({
        playlists: state.playlists.map((p) => {
          if (p.id !== playlistId) return p;
          // 避免重复添加
          if (p.items.some((i) => i.id === mediaItem.id)) return p;
          return {
            ...p,
            items: [...p.items, mediaItem],
            updatedAt: Date.now(),
          };
        }),
      })),

      removeFromPlaylist: (playlistId, mediaId) => set((state) => ({
        playlists: state.playlists.map((p) =>
          p.id === playlistId
            ? { ...p, items: p.items.filter((i) => i.id !== mediaId), updatedAt: Date.now() }
            : p
        ),
      })),

      reorderPlaylist: (playlistId, fromIndex, toIndex) => set((state) => ({
        playlists: state.playlists.map((p) => {
          if (p.id !== playlistId) return p;
          const items = [...p.items];
          const [removed] = items.splice(fromIndex, 1);
          items.splice(toIndex, 0, removed);
          return { ...p, items, updatedAt: Date.now() };
        }),
      })),

      getUserPlaylists: (userId) => {
        return get().playlists
          .filter((p) => p.userId === userId)
          .sort((a, b) => b.updatedAt - a.updatedAt);
      },

      getPlaylistById: (id) => {
        return get().playlists.find((p) => p.id === id);
      },
    }),
    { name: 'playlist-store' }
  )
);

// ==================== 观看统计 ====================

export interface WatchRecord {
  id: string;
  userId: string;
  mediaItem: MediaItem;
  progress: number; // 0-100
  duration: number; // 总时长(秒)
  watchedDuration: number; // 已观看时长(秒)
  completedAt?: number;
  startedAt: number;
  lastWatchedAt: number;
}

export interface WatchStats {
  totalWatchTime: number; // 总观看时长(秒)
  totalItems: number; // 观看过的项目数
  completedItems: number; // 看完的项目数
  dailyStats: DailyStat[];
  weeklyStats: WeeklyStat[];
  monthlyStats: MonthlyStat[];
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  watchTime: number; // 秒
  itemsCount: number;
}

export interface WeeklyStat {
  weekStart: string; // YYYY-Www
  watchTime: number;
  itemsCount: number;
}

export interface MonthlyStat {
  month: string; // YYYY-MM
  watchTime: number;
  itemsCount: number;
}

interface WatchStatsStore {
  records: WatchRecord[];
  
  // 操作
  addWatchRecord: (userId: string, mediaItem: MediaItem, progress: number, duration: number) => void;
  updateProgress: (id: string, progress: number, watchedDuration: number) => void;
  markCompleted: (id: string) => void;
  deleteRecord: (id: string) => void;
  getUserRecords: (userId: string) => WatchRecord[];
  getRecordByMediaId: (userId: string, mediaId: string) => WatchRecord | undefined;
  getWatchStats: (userId: string, days: number = 30) => WatchStats;
  getDailyStats: (userId: string, days: number) => DailyStat[];
  getWeeklyStats: (userId: string, weeks: number) => WeeklyStat[];
  getMostWatched: (userId: string, limit: number) => MediaItem[];
}

export const useWatchStatsStore = create<WatchStatsStore>()(
  persist(
    (set, get) => ({
      records: [],

      addWatchRecord: (userId, mediaItem, progress, duration) => {
        const existing = get().records.find(
          (r) => r.userId === userId && r.mediaItem.id === mediaItem.id
        );

        if (existing) {
          get().updateProgress(existing.id, progress, duration * progress / 100);
          return;
        }

        const newRecord: WatchRecord = {
          id: `rec_${Date.now()}`,
          userId,
          mediaItem,
          progress,
          duration,
          watchedDuration: duration * progress / 100,
          startedAt: Date.now(),
          lastWatchedAt: Date.now(),
        };
        set((state) => ({ records: [...state.records, newRecord] }));
      },

      updateProgress: (id, progress, watchedDuration) => set((state) => ({
        records: state.records.map((r) =>
          r.id === id
            ? { ...r, progress, watchedDuration, lastWatchedAt: Date.now() }
            : r
        ),
      })),

      markCompleted: (id) => set((state) => ({
        records: state.records.map((r) =>
          r.id === id
            ? { ...r, progress: 100, completedAt: Date.now() }
            : r
        ),
      })),

      deleteRecord: (id) => set((state) => ({
        records: state.records.filter((r) => r.id !== id),
      })),

      getUserRecords: (userId) => {
        return get().records
          .filter((r) => r.userId === userId)
          .sort((a, b) => b.lastWatchedAt - a.lastWatchedAt);
      },

      getRecordByMediaId: (userId, mediaId) => {
        return get().records.find(
          (r) => r.userId === userId && r.mediaItem.id === mediaId
        );
      },

      getWatchStats: (userId, days = 30) => {
        if (days === undefined) days = 30;
        const records = get().getUserRecords(userId);
        const now = Date.now();
        const cutoff = now - days * 24 * 60 * 60 * 1000;

        const recentRecords = records.filter((r) => r.lastWatchedAt > cutoff);

        return {
          totalWatchTime: recentRecords.reduce((sum, r) => sum + r.watchedDuration, 0),
          totalItems: recentRecords.length,
          completedItems: recentRecords.filter((r) => r.progress >= 95).length,
          dailyStats: get().getDailyStats(userId, days),
          weeklyStats: get().getWeeklyStats(userId, Math.ceil(days / 7)),
          monthlyStats: [],
        };
      },

      getDailyStats: (userId, days) => {
        const records = get().getUserRecords(userId);
        const stats: Map<string, DailyStat> = new Map();
        const now = new Date();

        // 初始化最近 days 天
        for (let i = 0; i < days; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const key = date.toISOString().split('T')[0];
          stats.set(key, { date: key, watchTime: 0, itemsCount: 0 });
        }

        // 填充数据
        records.forEach((r) => {
          const date = new Date(r.lastWatchedAt).toISOString().split('T')[0];
          const stat = stats.get(date);
          if (stat) {
            stat.watchTime += r.watchedDuration;
            stat.itemsCount += 1;
          }
        });

        return Array.from(stats.values()).sort((a, b) => a.date.localeCompare(b.date));
      },

      getWeeklyStats: (userId, weeks) => {
        const records = get().getUserRecords(userId);
        const stats: Map<string, WeeklyStat> = new Map();
        const now = new Date();

        // 初始化最近 weeks 周
        for (let i = 0; i < weeks; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i * 7);
          const week = getWeekNumber(date);
          const key = `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
          stats.set(key, { weekStart: key, watchTime: 0, itemsCount: 0 });
        }

        // 填充数据
        records.forEach((r) => {
          const date = new Date(r.lastWatchedAt);
          const week = getWeekNumber(date);
          const key = `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
          const stat = stats.get(key);
          if (stat) {
            stat.watchTime += r.watchedDuration;
            stat.itemsCount += 1;
          }
        });

        return Array.from(stats.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
      },

      getMostWatched: (userId, limit) => {
        const records = get().getUserRecords(userId);
        return records
          .sort((a, b) => b.watchedDuration - a.watchedDuration)
          .slice(0, limit)
          .map((r) => r.mediaItem);
      },
    }),
    { name: 'watch-stats-store' }
  )
);

// 辅助函数：获取周数
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// ==================== 导出组合 Hook ====================

/**
 * 获取当前用户的所有数据
 */
export const useCurrentUserData = () => {
  const { currentUserId } = useUserStore();
  const favorites = useFavoritesStore((s) => 
    currentUserId ? s.getUserFavorites(currentUserId) : []
  );
  const playlists = usePlaylistStore((s) =>
    currentUserId ? s.getUserPlaylists(currentUserId) : []
  );
  const records = useWatchStatsStore((s) =>
    currentUserId ? s.getUserRecords(currentUserId) : []
  );
  const stats = useWatchStatsStore((s) =>
    currentUserId ? s.getWatchStats(currentUserId) : {
      totalWatchTime: 0,
      totalItems: 0,
      completedItems: 0,
      dailyStats: [],
      weeklyStats: [],
      monthlyStats: [],
    }
  );

  return { favorites, playlists, records, stats };
};
