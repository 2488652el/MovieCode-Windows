import axios from 'axios';
import type {
  TMDBSearchResult,
  TMDBMovieDetails,
  TMDBTVDetails,
  TMDBEpisodeDetails,
  TMDBMovieCredits,
  TMDBTVCredits,
  Genre
} from '@/types';
import { useSettingsStore } from '@/stores';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const getApiKey = () => useSettingsStore.getState().settings.tmdbApiKey;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

export const getImageUrl = (path: string | null, size: 'w500' | 'original' = 'w500'): string | null => {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null, size: 'w1280' | 'original' = 'w1280'): string | null => {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

// 搜索媒体
export const searchMulti = async (query: string): Promise<TMDBSearchResult[]> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('TMDB API Key未设置');
  
  const response = await api.get('/search/multi', {
    params: { api_key: apiKey, query, language: 'zh-CN' }
  });
  
  return response.data.results.filter(
    (item: TMDBSearchResult) => item.mediaType === 'movie' || item.mediaType === 'tv'
  );
};

// 搜索电影
export const searchMovies = async (query: string): Promise<TMDBSearchResult[]> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('TMDB API Key未设置');
  
  const response = await api.get('/search/movie', {
    params: { api_key: apiKey, query, language: 'zh-CN' }
  });
  
  return response.data.results;
};

// 搜索电视剧
export const searchTV = async (query: string): Promise<TMDBSearchResult[]> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('TMDB API Key未设置');
  
  const response = await api.get('/search/tv', {
    params: { api_key: apiKey, query, language: 'zh-CN' }
  });
  
  return response.data.results;
};

// 获取电影详情
export const getMovieDetails = async (tmdbId: number): Promise<TMDBMovieDetails> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('TMDB API Key未设置');
  
  const response = await api.get(`/movie/${tmdbId}`, {
    params: { api_key: apiKey, language: 'zh-CN' }
  });
  
  return response.data;
};

// 获取电视剧详情
export const getTVDetails = async (tmdbId: number): Promise<TMDBTVDetails> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('TMDB API Key未设置');
  
  const response = await api.get(`/tv/${tmdbId}`, {
    params: { api_key: apiKey, language: 'zh-CN' }
  });
  
  return response.data;
};

// 获取剧集详情
export const getEpisodeDetails = async (tmdbId: number, seasonNumber: number, episodeNumber: number): Promise<TMDBEpisodeDetails> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('TMDB API Key未设置');
  
  const response = await api.get(`/tv/${tmdbId}/season/${seasonNumber}/episode/${episodeNumber}`, {
    params: { api_key: apiKey, language: 'zh-CN' }
  });
  
  return response.data;
};

// 获取电影演员
export const getMovieCredits = async (tmdbId: number): Promise<TMDBMovieCredits> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('TMDB API Key未设置');
  
  const response = await api.get(`/movie/${tmdbId}/credits`, {
    params: { api_key: apiKey }
  });
  
  return response.data;
};

// 获取电视剧演员
export const getTVCredits = async (tmdbId: number): Promise<TMDBTVCredits> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('TMDB API Key未设置');
  
  const response = await api.get(`/tv/${tmdbId}/credits`, {
    params: { api_key: apiKey }
  });
  
  return response.data;
};

// 获取热门电影
export const getPopularMovies = async (page = 1): Promise<TMDBSearchResult[]> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('TMDB API Key未设置');
  
  const response = await api.get('/movie/popular', {
    params: { api_key: apiKey, language: 'zh-CN', page }
  });
  
  return response.data.results;
};

// 获取热门电视剧
export const getPopularTV = async (page = 1): Promise<TMDBSearchResult[]> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('TMDB API Key未设置');
  
  const response = await api.get('/tv/popular', {
    params: { api_key: apiKey, language: 'zh-CN', page }
  });
  
  return response.data.results;
};

// 获取正在上映的电影
export const getNowPlaying = async (): Promise<TMDBSearchResult[]> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('TMDB API Key未设置');
  
  const response = await api.get('/movie/now_playing', {
    params: { api_key: apiKey, language: 'zh-CN' }
  });
  
  return response.data.results;
};

// 获取类型列表
export const getGenres = async (): Promise<{ movie: Genre[]; tv: Genre[] }> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('TMDB API Key未设置');
  
  const [movieResponse, tvResponse] = await Promise.all([
    api.get('/genre/movie/list', { params: { api_key: apiKey, language: 'zh-CN' } }),
    api.get('/genre/tv/list', { params: { api_key: apiKey, language: 'zh-CN' } })
  ]);
  
  return {
    movie: movieResponse.data.genres,
    tv: tvResponse.data.genres
  };
};

// 根据TMDB ID查找本地媒体
export const findMediaByTmdbId = async (tmdbId: number, type: 'movie' | 'tv'): Promise<TMDBSearchResult | null> => {
  try {
    const response = await api.get(`/${type}/${tmdbId}`, {
      params: { api_key: getApiKey(), language: 'zh-CN' }
    });
    return response.data;
  } catch {
    return null;
  }
};
