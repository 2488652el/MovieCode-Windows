// 媒体类型
export type MediaType = 'movie' | 'tv' | 'anime';

// 媒体项目接口
export interface MediaItem {
  id: string;
  title: string;
  originalTitle?: string;
  type: MediaType;
  year?: number;
  posterPath?: string;
  backdropPath?: string;
  overview?: string;
  voteAverage?: number;
  voteCount?: number;
  genres?: Genre[];
  tmdbId?: number;
  imdbId?: string;
  filePath?: string;
  runtime?: number;
  status?: string;
  seasons?: Season[];
  episodes?: Episode[];
  createdAt: string;
  updatedAt: string;
}

// Genre类型
export interface Genre {
  id: number;
  name: string;
}

// 季
export interface Season {
  seasonNumber: number;
  name: string;
  overview?: string;
  posterPath?: string;
  episodeCount: number;
  airDate?: string;
}

// 剧集
export interface Episode {
  id: string;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  overview?: string;
  stillPath?: string;
  airDate?: string;
  runtime?: number;
  voteAverage?: number;
  filePath?: string;
}

// NAS连接配置
export interface NASConnection {
  id: string;
  name: string;
  type: 'smb' | 'nfs' | 'webdav' | 'local';
  host?: string;
  port?: number;
  share?: string;
  username?: string;
  password?: string;
  basePath?: string;
  isConnected: boolean;
  lastConnected?: string;
}

// 扫描配置
export interface ScanConfig {
  id: string;
  name: string;
  connectionId: string;
  paths: string[];
  mediaTypes: MediaType[];
  excludePatterns: string[];
  isEnabled: boolean;
}

// TMDB搜索结果
export interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  originalTitle?: string;
  originalName?: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  firstAirDate?: string;
  genreIds?: number[];
  mediaType: 'movie' | 'tv';
}

// TMDB详情
export interface TMDBMovieDetails {
  id: number;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  runtime: number;
  voteAverage: number;
  voteCount: number;
  genres: Genre[];
  productionCompanies: { id: number; name: string; logoPath: string }[];
  budget: number;
  revenue: number;
  status: string;
  tagline: string;
  imdbId: string;
}

export interface TMDBTVDetails {
  id: number;
  name: string;
  originalName: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  firstAirDate: string;
  lastAirDate: string;
  episodeRunTime: number[];
  voteAverage: number;
  voteCount: number;
  genres: Genre[];
  seasons: {
    id: number;
    name: string;
    seasonNumber: number;
    overview: string;
    posterPath: string | null;
    episodeCount: number;
    airDate: string;
  }[];
  numberOfSeasons: number;
  numberOfEpisodes: number;
  status: string;
  type: string;
  createdBy: { id: number; name: string; gender: number }[];
}

export interface TMDBEpisodeDetails {
  id: number;
  name: string;
  overview: string;
  stillPath: string | null;
  episodeNumber: number;
  seasonNumber: number;
  airDate: string;
  runtime: number;
  voteAverage: number;
  voteCount: number;
  crew: {
    id: number;
    name: string;
    job: string;
    profilePath: string | null;
  }[];
  guestStars: {
    id: number;
    name: string;
    character: string;
    profilePath: string | null;
  }[];
}

export interface TMDBMovieCredits {
  id: number;
  cast: {
    id: number;
    name: string;
    character: string;
    profilePath: string | null;
    order: number;
  }[];
  crew: {
    id: number;
    name: string;
    job: string;
    department: string;
    profilePath: string | null;
  }[];
}

export interface TMDBTVCredits {
  id: number;
  cast: {
    id: number;
    name: string;
    character: string;
    profilePath: string | null;
    order: number;
  }[];
  crew: {
    id: number;
    name: string;
    job: string;
    department: string;
    profilePath: string | null;
  }[];
}

// 应用设置
export interface AppSettings {
  tmdbApiKey: string;
  language: string;
  defaultMediaType: MediaType;
  scanOnStartup: boolean;
  autoPlay: boolean;
  defaultQuality: 'auto' | '1080p' | '720p' | '480p';
  subtitleLanguage: string;
  theme: 'dark' | 'light';
}

// 播放器状态
export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackRate: number;
  buffered: number;
}

// 播放历史记录
export interface PlayHistoryEntry {
  mediaId: string;
  title: string;
  type: MediaType;
  posterPath?: string;
  backdropPath?: string;
  currentTime: number;
  duration: number;
  progress: number;
  lastWatched: number;
  episodeNumber?: number;
  seasonNumber?: number;
}

// 主题模式
export type ThemeMode = 'dark' | 'light' | 'system';

// 主题设置
export interface ThemeSettings {
  mode: ThemeMode;
  autoDarkStart: string;
  autoDarkEnd: string;
}