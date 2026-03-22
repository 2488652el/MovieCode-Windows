import React, { useState, useMemo } from 'react';
import { useHistoryStore } from '@/stores';
import type { PlayHistoryEntry, MediaType } from '@/types';
import { getImageUrl } from '@/services/api/tmdb';

type FilterType = 'all' | 'movie' | 'tv' | 'anime';
type SortType = 'recent' | 'progress';

export const HistoryPage: React.FC = () => {
  const { entries, removeEntry, clearHistory } = useHistoryStore();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // 筛选
    if (filterType !== 'all') {
      result = result.filter(e => e.type === filterType);
    }

    // 搜索
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => e.title.toLowerCase().includes(query));
    }

    // 排序
    if (sortType === 'recent') {
      result.sort((a, b) => b.lastWatched - a.lastWatched);
    } else {
      result.sort((a, b) => b.progress - a.progress);
    }

    return result;
  }, [entries, filterType, sortType, searchQuery]);

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatLastWatched = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 95) return 'bg-green-500';
    if (progress >= 50) return 'bg-apple-blue';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-apple-gray-500';
  };

  const handlePlay = (entry: PlayHistoryEntry) => {
    console.log('Play:', entry.mediaId);
    // TODO: 跳转到播放页面
  };

  const handleRemove = (mediaId: string) => {
    removeEntry(mediaId);
  };

  return (
    <div className="h-full bg-apple-gray-900 p-6 overflow-auto">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">播放历史</h1>
          <p className="text-apple-gray-400 text-sm">共 {entries.length} 部</p>
        </div>
        {entries.length > 0 && (
          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
          >
            清除全部
          </button>
        )}
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* 搜索框 */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <input
            type="text"
            placeholder="搜索历史记录..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-apple-gray-800 border border-apple-gray-700 rounded-lg text-white placeholder-apple-gray-500 focus:outline-none focus:border-apple-blue"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* 排序 */}
        <select
          value={sortType}
          onChange={(e) => setSortType(e.target.value as SortType)}
          className="px-4 py-2 bg-apple-gray-800 border border-apple-gray-700 rounded-lg text-white focus:outline-none focus:border-apple-blue"
        >
          <option value="recent">最近观看</option>
          <option value="progress">播放进度</option>
        </select>

        {/* 筛选标签 */}
        <div className="flex gap-2">
          {(['all', 'movie', 'tv', 'anime'] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filterType === type
                  ? 'bg-apple-blue text-white'
                  : 'bg-apple-gray-800 text-apple-gray-400 hover:bg-apple-gray-700'
              }`}
            >
              {type === 'all' ? '全部' : type === 'movie' ? '电影' : type === 'tv' ? '剧集' : '动漫'}
            </button>
          ))}
        </div>
      </div>

      {/* 历史列表 */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <svg className="w-16 h-16 text-apple-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-apple-gray-400 text-lg mb-2">暂无播放历史</p>
          <p className="text-apple-gray-600 text-sm">开始观看一些影片吧</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.mediaId}
              className="bg-apple-gray-800 rounded-xl overflow-hidden group hover:bg-apple-gray-750 transition-colors"
            >
              {/* 海报 */}
              <div className="relative aspect-[2/3]">
                {entry.posterPath ? (
                  <img
                    src={getImageUrl(entry.posterPath, 'w500')}
                    alt={entry.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-apple-gray-700 flex items-center justify-center">
                    <span className="text-apple-gray-500 text-sm">{entry.title}</span>
                  </div>
                )}

                {/* 进度条 */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                  <div
                    className={`h-full ${getProgressColor(entry.progress)} transition-all`}
                    style={{ width: `${Math.min(entry.progress, 100)}%` }}
                  />
                </div>

                {/* 类型标签 */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    entry.type === 'movie' ? 'bg-apple-blue/80 text-white' :
                    entry.type === 'tv' ? 'bg-apple-purple/80 text-white' :
                    'bg-apple-pink/80 text-white'
                  }`}>
                    {entry.type === 'movie' ? '电影' : entry.type === 'tv' ? '剧集' : '动漫'}
                  </span>
                </div>

                {/* 已看完标签 */}
                {entry.progress >= 95 && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/80 text-white">
                      已看完
                    </span>
                  </div>
                )}

                {/* 删除按钮 */}
                <button
                  onClick={() => handleRemove(entry.mediaId)}
                  className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-black/50 hover:bg-red-500 rounded-full"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* 悬停播放按钮 */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handlePlay(entry)}
                    className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 信息 */}
              <div className="p-3">
                <h3 className="text-white font-medium text-sm line-clamp-1 mb-1">{entry.title}</h3>
                <div className="flex items-center justify-between text-xs text-apple-gray-400">
                  <span>看到 {Math.round(entry.progress)}%</span>
                  <span>{formatDuration(entry.currentTime)} / {formatDuration(entry.duration)}</span>
                </div>
                {entry.episodeNumber && entry.seasonNumber && (
                  <p className="text-xs text-apple-gray-500 mt-1">
                    第 {entry.seasonNumber} 季 第 {entry.episodeNumber} 集
                  </p>
                )}
                <p className="text-xs text-apple-gray-600 mt-1">{formatLastWatched(entry.lastWatched)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
