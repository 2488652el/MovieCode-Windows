import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MediaItem, NASConnection, ScanConfig, AppSettings, PlayerState, ParentalControlSettings, ContentRating, MediaType } from '@/types';

// 媒体库Store
interface MediaStore {
  items: MediaItem[];
  selectedItem: MediaItem | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filterType: 'all' | 'movie' | 'tv' | 'anime';
  setItems: (items: MediaItem[]) => void;
  addItem: (item: MediaItem) => void;
  updateItem: (id: string, updates: Partial<MediaItem>) => void;
  removeItem: (id: string) => void;
  setSelectedItem: (item: MediaItem | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: 'all' | 'movie' | 'tv' | 'anime') => void;
  getFilteredItems: () => MediaItem[];
}

export const useMediaStore = create<MediaStore>((set, get) => ({
  items: [],
  selectedItem: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  filterType: 'all',
  
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  updateItem: (id, updates) => set((state) => ({
    items: state.items.map((item) => item.id === id ? { ...item, ...updates } : item)
  })),
  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id)
  })),
  setSelectedItem: (item) => set({ selectedItem: item }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterType: (type) => set({ filterType: type }),
  getFilteredItems: () => {
    const { items, searchQuery, filterType } = get();
    return items.filter((item) => {
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesType;
    });
  },
}));

// NAS连接Store
interface NASStore {
  connections: NASConnection[];
  activeConnectionId: string | null;
  addConnection: (connection: NASConnection) => void;
  updateConnection: (id: string, updates: Partial<NASConnection>) => void;
  removeConnection: (id: string) => void;
  setActiveConnection: (id: string | null) => void;
  getActiveConnection: () => NASConnection | undefined;
}

export const useNASStore = create<NASStore>()(
  persist(
    (set, get) => ({
      connections: [],
      activeConnectionId: null,
      
      addConnection: (connection) => set((state) => ({
        connections: [...state.connections, connection]
      })),
      updateConnection: (id, updates) => set((state) => ({
        connections: state.connections.map((conn) =>
          conn.id === id ? { ...conn, ...updates } : conn
        )
      })),
      removeConnection: (id) => set((state) => ({
        connections: state.connections.filter((conn) => conn.id !== id),
        activeConnectionId: state.activeConnectionId === id ? null : state.activeConnectionId
      })),
      setActiveConnection: (id) => set({ activeConnectionId: id }),
      getActiveConnection: () => {
        const { connections, activeConnectionId } = get();
        return connections.find((conn) => conn.id === activeConnectionId);
      },
    }),
    { name: 'nas-store' }
  )
);

// 扫描配置Store
interface ScanStore {
  configs: ScanConfig[];
  isScanning: boolean;
  scanProgress: number;
  addConfig: (config: ScanConfig) => void;
  updateConfig: (id: string, updates: Partial<ScanConfig>) => void;
  removeConfig: (id: string) => void;
  setScanning: (scanning: boolean) => void;
  setProgress: (progress: number) => void;
}

export const useScanStore = create<ScanStore>()(
  persist(
    (set) => ({
      configs: [],
      isScanning: false,
      scanProgress: 0,
      
      addConfig: (config) => set((state) => ({ configs: [...state.configs, config] })),
      updateConfig: (id, updates) => set((state) => ({
        configs: state.configs.map((cfg) => cfg.id === id ? { ...cfg, ...updates } : cfg)
      })),
      removeConfig: (id) => set((state) => ({
        configs: state.configs.filter((cfg) => cfg.id !== id)
      })),
      setScanning: (scanning) => set({ isScanning: scanning }),
      setProgress: (progress) => set({ scanProgress: progress }),
    }),
    { name: 'scan-store' }
  )
);

// 设置Store
interface SettingsStore {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  tmdbApiKey: '',
  language: 'zh-CN',
  defaultMediaType: 'movie',
  scanOnStartup: false,
  autoPlay: true,
  defaultQuality: 'auto',
  subtitleLanguage: 'zh',
  theme: 'dark',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    { name: 'settings-store' }
  )
);

// 播放器Store
interface PlayerStore extends PlayerState {
  currentMedia: MediaItem | null;
  currentEpisode: number;
  setCurrentMedia: (media: MediaItem | null) => void;
  setCurrentEpisode: (episode: number) => void;
  play: () => void;
  pause: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  setPlaybackRate: (rate: number) => void;
  setBuffered: (buffered: number) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentMedia: null,
  currentEpisode: 1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  isFullscreen: false,
  playbackRate: 1,
  buffered: 0,
  
  setCurrentMedia: (media) => set({ currentMedia: media, currentTime: 0, isPlaying: false }),
  setCurrentEpisode: (episode) => set({ currentEpisode: episode, currentTime: 0 }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setBuffered: (buffered) => set({ buffered }),
  reset: () => set({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentMedia: null,
    currentEpisode: 1
  }),
}));

// UI Store
interface UIStore {
  sidebarCollapsed: boolean;
  currentTab: 'home' | 'settings';
  toggleSidebar: () => void;
  setCurrentTab: (tab: 'home' | 'settings') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  currentTab: 'home',
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCurrentTab: (tab) => set({ currentTab: tab }),
}));

// ==================== 播放历史 Store ====================
const MAX_HISTORY = 50;

interface HistoryStore {
  entries: PlayHistoryEntry[];
  addEntry: (entry: PlayHistoryEntry) => void;
  removeEntry: (mediaId: string) => void;
  updateProgress: (mediaId: string, currentTime: number, duration: number) => void;
  clearHistory: () => void;
  getEntry: (mediaId: string) => PlayHistoryEntry | undefined;
  getRecentEntries: (limit?: number) => PlayHistoryEntry[];
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      entries: [],
      
      addEntry: (entry) => set((state) => {
        const existingIndex = state.entries.findIndex(e => e.mediaId === entry.mediaId);
        let newEntries = [...state.entries];
        
        if (existingIndex !== -1) {
          newEntries.splice(existingIndex, 1);
        }
        
        newEntries.unshift({ ...entry, lastWatched: Date.now() });
        
        if (newEntries.length > MAX_HISTORY) {
          newEntries = newEntries.slice(0, MAX_HISTORY);
        }
        
        return { entries: newEntries };
      }),
      
      removeEntry: (mediaId) => set((state) => ({
        entries: state.entries.filter(e => e.mediaId !== mediaId)
      })),
      
      updateProgress: (mediaId, currentTime, duration) => set((state) => ({
        entries: state.entries.map(e => 
          e.mediaId === mediaId 
            ? { ...e, currentTime, duration, progress: duration > 0 ? (currentTime / duration) * 100 : 0, lastWatched: Date.now() }
            : e
        )
      })),
      
      clearHistory: () => set({ entries: [] }),
      
      getEntry: (mediaId) => get().entries.find(e => e.mediaId === mediaId),
      
      getRecentEntries: (limit = 10) => get().entries.slice(0, limit),
    }),
    { name: 'history-store' }
  )
);

// ==================== 主题 Store ====================
const defaultThemeSettings: ThemeSettings = {
  mode: 'dark',
  autoDarkStart: '22:00',
  autoDarkEnd: '06:00',
};

interface ThemeStore {
  settings: ThemeSettings;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setAutoDarkTime: (start: string, end: string) => void;
  updateIsDark: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      settings: defaultThemeSettings,
      isDark: true,
      
      setThemeMode: (mode) => set((state) => ({
        settings: { ...state.settings, mode },
        isDark: mode === 'dark' || (mode === 'system' && get().isDark)
      })),
      
      setAutoDarkTime: (start, end) => set((state) => ({
        settings: { ...state.settings, autoDarkStart: start, autoDarkEnd: end }
      })),
      
      updateIsDark: () => {
        const { settings } = get();
        if (settings.mode === 'system') {
          const now = new Date();
          const currentTime = ${now.getHours().toString().padStart(2, '0')}:;
          const isInDarkPeriod = currentTime >= settings.autoDarkStart || currentTime < settings.autoDarkEnd;
          set({ isDark: isInDarkPeriod });
        }
      },
    }),
    { name: 'theme-store' }
  )
);

// ==================== 家长控制 Store ====================
const defaultParentalSettings: ParentalControlSettings = {
  isEnabled: false,
  pin: '0000',
  contentRating: 'R',
  blockGenres: [],
  allowedMediaTypes: ['movie', 'tv', 'anime'],
  dailyWatchLimit: 0,
  blockedMediaIds: [],
};

interface ParentalControlsStore {
  settings: ParentalControlSettings;
  isUnlocked: boolean;
  unlockUntil: number | null;
  setEnabled: (enabled: boolean) => void;
  setPin: (pin: string) => boolean;
  verifyPin: (pin: string) => boolean;
  setContentRating: (rating: ContentRating) => void;
  blockGenre: (genreId: string) => void;
  unblockGenre: (genreId: string) => void;
  setAllowedMediaTypes: (types: MediaType[]) => void;
  setDailyWatchLimit: (minutes: number) => void;
  blockMedia: (mediaId: string) => void;
  unblockMedia: (mediaId: string) => void;
  isContentAllowed: (item: { genres?: { id: number }[]; type?: MediaType; mediaId?: string }) => boolean;
  isParentalUnlocked: () => boolean;
  unlockTemporarily: (durationMs: number) => void;
  lock: () => void;
}

export const useParentalControlsStore = create<ParentalControlsStore>()(
  persist(
    (set, get) => ({
      settings: defaultParentalSettings,
      isUnlocked: false,
      unlockUntil: null,
      
      setEnabled: (enabled) => set((state) => ({
        settings: { ...state.settings, isEnabled: enabled }
      })),
      
      setPin: (pin) => {
        if (!/^\d{4}$/.test(pin)) {
          return false;
        }
        set((state) => ({
          settings: { ...state.settings, pin }
        }));
        return true;
      },
      
      verifyPin: (pin) => get().settings.pin === pin,
      
      setContentRating: (rating) => set((state) => ({
        settings: { ...state.settings, contentRating: rating }
      })),
      
      blockGenre: (genreId) => set((state) => ({
        settings: {
          ...state.settings,
          blockGenres: [...new Set([...state.settings.blockGenres, genreId])]
        }
      })),
      
      unblockGenre: (genreId) => set((state) => ({
        settings: {
          ...state.settings,
          blockGenres: state.settings.blockGenres.filter(id => id !== genreId)
        }
      })),
      
      setAllowedMediaTypes: (types) => set((state) => ({
        settings: { ...state.settings, allowedMediaTypes: types }
      })),
      
      setDailyWatchLimit: (minutes) => set((state) => ({
        settings: { ...state.settings, dailyWatchLimit: minutes }
      })),
      
      blockMedia: (mediaId) => set((state) => ({
        settings: {
          ...state.settings,
          blockedMediaIds: [...new Set([...state.settings.blockedMediaIds, mediaId])]
        }
      })),
      
      unblockMedia: (mediaId) => set((state) => ({
        settings: {
          ...state.settings,
          blockedMediaIds: state.settings.blockedMediaIds.filter(id => id !== mediaId)
        }
      })),
      
      isContentAllowed: (item) => {
        const { settings } = get();
        
        // 如果家长控制未启用，允许所有内容
        if (!settings.isEnabled) {
          return true;
        }
        
        // 检查手动屏蔽的媒体
        if (item.mediaId && settings.blockedMediaIds.includes(item.mediaId)) {
          return false;
        }
        
        // 检查媒体类型
        if (item.type && !settings.allowedMediaTypes.includes(item.type)) {
          return false;
        }
        
        // 检查题材屏蔽
        if (item.genres) {
          const genreIds = item.genres.map(g => g.id.toString());
          if (settings.blockGenres.some(id => genreIds.includes(id))) {
            return false;
          }
        }
        
        return true;
      },
      
      isParentalUnlocked: () => {
        const { isUnlocked, unlockUntil } = get();
        if (!isUnlocked) return false;
        if (unlockUntil && Date.now() > unlockUntil) {
          set({ isUnlocked: false, unlockUntil: null });
          return false;
        }
        return true;
      },
      
      unlockTemporarily: (durationMs) => set({
        isUnlocked: true,
        unlockUntil: Date.now() + durationMs
      }),
      
      lock: () => set({ isUnlocked: false, unlockUntil: null }),
    }),
    { name: 'parental-controls-store' }
  )
);