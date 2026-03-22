import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MediaItem, NASConnection, ScanConfig, AppSettings, PlayerState } from '@/types';

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

// 播放进度数据类型
export interface PlaybackProgress {
  mediaId: string;
  title: string;
  currentTime: number;
  duration: number;
  lastPlayedAt: number;
  playbackSpeed: number;
  subtitleTrackIndex: number | null;
  audioTrackIndex: number | null;
}

// 字幕设置类型
export interface SubtitleSettings {
  enabled: boolean;
  delay: number;
  size: number;
  color: string;
  position: 'top' | 'middle' | 'bottom';
}

// 播放进度Store
interface PlaybackProgressStore {
  progress: Record<string, PlaybackProgress>;
  lastPlaybackSpeed: number;
  subtitleSettings: SubtitleSettings;
  saveProgress: (mediaId: string, progress: Omit<PlaybackProgress, 'lastPlayedAt'>) => void;
  getProgress: (mediaId: string) => PlaybackProgress | null;
  hasProgress: (mediaId: string) => boolean;
  getProgressPercent: (mediaId: string) => number | null;
  deleteProgress: (mediaId: string) => void;
  clearAllProgress: () => void;
  setLastPlaybackSpeed: (speed: number) => void;
  updateSubtitleSettings: (settings: Partial<SubtitleSettings>) => void;
  resetSubtitleSettings: () => void;
}

const defaultSubtitleSettings: SubtitleSettings = {
  enabled: false,
  delay: 0,
  size: 1,
  color: '#FFFFFF',
  position: 'bottom',
};

export const usePlaybackProgressStore = create<PlaybackProgressStore>()(
  persist(
    (set, get) => ({
      progress: {},
      lastPlaybackSpeed: 1,
      subtitleSettings: defaultSubtitleSettings,
      
      saveProgress: (mediaId, progressData) => {
        const { progress } = get();
        const duration = progressData.duration;
        // Only save if progress is between 5% and 95%
        if (duration > 0) {
          const progressPercent = (progressData.currentTime / duration) * 100;
          if (progressPercent <= 5 || progressPercent >= 95) {
            return; // Don't save if at beginning or end
          }
        }
        set({
          progress: {
            ...progress,
            [mediaId]: {
              ...progressData,
              lastPlayedAt: Date.now(),
            },
          },
        });
      },
      
      getProgress: (mediaId) => {
        const { progress } = get();
        return progress[mediaId] || null;
      },
      
      hasProgress: (mediaId) => {
        const prog = get().progress[mediaId];
        if (!prog) return false;
        const percent = (prog.currentTime / prog.duration) * 100;
        return percent > 5 && percent < 95;
      },
      
      getProgressPercent: (mediaId) => {
        const prog = get().progress[mediaId];
        if (!prog || prog.duration <= 0) return null;
        return (prog.currentTime / prog.duration) * 100;
      },
      
      deleteProgress: (mediaId) => {
        const { progress } = get();
        const newProgress = { ...progress };
        delete newProgress[mediaId];
        set({ progress: newProgress });
      },
      
      clearAllProgress: () => set({ progress: {} }),
      setLastPlaybackSpeed: (speed) => set({ lastPlaybackSpeed: speed }),
      updateSubtitleSettings: (settings) =>
        set((state) => ({
          subtitleSettings: { ...state.subtitleSettings, ...settings },
        })),
      resetSubtitleSettings: () => set({ subtitleSettings: defaultSubtitleSettings }),
    }),
    {
      name: 'playback-progress-store',
    }
  )
);

// 播放器Store
interface PlayerStore extends PlayerState {
  currentMedia: MediaItem | null;
  currentEpisode: number;
  // Subtitle state
  subtitleTracks: { index: number; label: string; language: string; src: string }[];
  selectedSubtitleIndex: number;
  // Audio track state
  audioTracks: { index: number; label: string; language: string; channels: number; codec: string }[];
  selectedAudioIndex: number;
  // UI state
  showSpeedSelector: boolean;
  showSubtitleSelector: boolean;
  showAudioSelector: boolean;
  showSubtitleSettings: boolean;
  showResumeDialog: boolean;
  resumePosition: number;
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
  // Subtitle methods
  setSubtitleTracks: (tracks: { index: number; label: string; language: string; src: string }[]) => void;
  setSelectedSubtitleIndex: (index: number) => void;
  // Audio methods
  setAudioTracks: (tracks: { index: number; label: string; channels: number; codec: string; language: string }[]) => void;
  setSelectedAudioIndex: (index: number) => void;
  // UI methods
  setShowSpeedSelector: (show: boolean) => void;
  setShowSubtitleSelector: (show: boolean) => void;
  setShowAudioSelector: (show: boolean) => void;
  setShowSubtitleSettings: (show: boolean) => void;
  setShowResumeDialog: (show: boolean) => void;
  setResumePosition: (position: number) => void;
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
  // New state
  subtitleTracks: [],
  selectedSubtitleIndex: -1,
  audioTracks: [],
  selectedAudioIndex: 0,
  showSpeedSelector: false,
  showSubtitleSelector: false,
  showAudioSelector: false,
  showSubtitleSettings: false,
  showResumeDialog: false,
  resumePosition: 0,
  
  setCurrentMedia: (media) => set({
    currentMedia: media,
    currentTime: 0,
    isPlaying: false,
    subtitleTracks: [],
    selectedSubtitleIndex: -1,
    audioTracks: [],
  }),
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
  // Subtitle
  setSubtitleTracks: (tracks) => set({ subtitleTracks: tracks }),
  setSelectedSubtitleIndex: (index) => set({ selectedSubtitleIndex: index }),
  // Audio
  setAudioTracks: (tracks) => set({ audioTracks: tracks }),
  setSelectedAudioIndex: (index) => set({ selectedAudioIndex: index }),
  // UI
  setShowSpeedSelector: (show) => set({ showSpeedSelector: show }),
  setShowSubtitleSelector: (show) => set({ showSubtitleSelector: show }),
  setShowAudioSelector: (show) => set({ showAudioSelector: show }),
  setShowSubtitleSettings: (show) => set({ showSubtitleSettings: show }),
  setShowResumeDialog: (show) => set({ showResumeDialog: show }),
  setResumePosition: (position) => set({ resumePosition: position }),
  reset: () => set({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentMedia: null,
    currentEpisode: 1,
    subtitleTracks: [],
    selectedSubtitleIndex: -1,
    audioTracks: [],
    showSpeedSelector: false,
    showSubtitleSelector: false,
    showAudioSelector: false,
    showSubtitleSettings: false,
    showResumeDialog: false,
    resumePosition: 0,
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
