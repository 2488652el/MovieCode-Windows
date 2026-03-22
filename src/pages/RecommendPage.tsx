import React, { useState, useEffect, useMemo } from 'react';
import { recommendationService, RecommendationItem } from '@/services/recommendationService';
import { useMediaStore, useHistoryStore } from '@/stores';
import { getImageUrl } from '@/services/api/tmdb';
import type { MediaItem } from '@/types';

type RecommendTab = 'for-you' | 'similar' | 'new-releases';

export const RecommendPage: React.FC = () => {
  const { items } = useMediaStore();
  const { entries } = useHistoryStore();
  const [activeTab, setActiveTab] = useState<RecommendTab>('for-you');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // 获取推荐列表
  const recommendations = useMemo(() => {
    switch (activeTab) {
      case 'for-you':
        return recommendationService.getRecommendations(items, 20);
      case 'similar':
        return selectedItem 
          ? recommendationService.getSimilarItems(selectedItem, items, 12)
          : [];
      case 'new-releases':
        return recommendationService.getNewReleases(items, 20);
      default:
        return [];
    }
  }, [items, activeTab, selectedItem]);

  // 最近观看的用于"相似推荐"
  const recentWatched = useMemo(() => {
    return entries.slice(0, 5).map(entry => {
      const item = items.find(i => i.id === entry.mediaId);
      return item || null;
    }).filter(Boolean) as MediaItem[];
  }, [entries, items]);

  // 自动选择最近观看的第一项用于相似推荐
  useEffect(() => {
    if (activeTab === 'similar' && !selectedItem && recentWatched.length > 0) {
      setSelectedItem(recentWatched[0]);
    }
  }, [activeTab, selectedItem, recentWatched]);

  const tabs: { key: RecommendTab; label: string; icon: JSX.Element }[] = [
    {
      key: 'for-you',
      label: '为你推荐',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      key: 'similar',
      label: '相似内容',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      key: 'new-releases',
      label: '最新上线',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const handleItemClick = (item: MediaItem) => {
    setSelectedItem(item);
    setActiveTab('similar');
  };

  return (
    <div className="h-full bg-apple-gray-900 overflow-auto">
      {/* 头部 */}
      <div className="sticky top-0 z-10 bg-apple-gray-900/95 backdrop-blur-sm border-b border-apple-gray-800">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-white mb-4">发现</h1>
          
          {/* 标签栏 */}
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.key
                    ? 'bg-apple-blue text-white'
                    : 'bg-apple-gray-800 text-apple-gray-400 hover:bg-apple-gray-700 hover:text-white'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* 相似推荐：选择最近观看 */}
        {activeTab === 'similar' && (
          <div className="mb-6">
            <p className="text-apple-gray-400 text-sm mb-3">选择一部影片，获取相似推荐：</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recentWatched.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                    selectedItem?.id === item.id
                      ? 'ring-2 ring-apple-blue scale-105'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={getImageUrl(item.posterPath, 'w200')}
                    alt={item.title}
                    className="w-24 h-36 object-cover"
                  />
                </button>
              ))}
              {recentWatched.length === 0 && (
                <p className="text-apple-gray-500">暂无观看记录</p>
              )}
            </div>
          </div>
        )}

        {/* 推荐理由 */}
        {activeTab === 'for-you' && entries.length > 0 && (
          <div className="mb-6 bg-apple-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-apple-blue to-apple-purple flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">个性化推荐</p>
                <p className="text-apple-gray-400 text-sm">
                  基于您的 {entries.length} 部观看记录生成
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 推荐列表 */}
        {recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <svg className="w-16 h-16 text-apple-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-apple-gray-400 text-lg mb-2">
              {activeTab === 'similar' ? '请选择一部影片' : '暂无推荐'}
            </p>
            <p className="text-apple-gray-600 text-sm">
              {activeTab === 'for-you' ? '开始观看一些影片吧' : '查看其他推荐'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {recommendations.map((item) => (
              <RecommendCard
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface RecommendCardProps {
  item: RecommendationItem;
  onClick: () => void;
}

const RecommendCard: React.FC<RecommendCardProps> = ({ item, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getTypeColor = () => {
    switch (item.type) {
      case 'movie':
        return 'from-apple-blue/20 to-transparent';
      case 'tv':
        return 'from-apple-purple/20 to-transparent';
      case 'anime':
        return 'from-apple-pink/20 to-transparent';
      default:
        return 'from-white/10 to-transparent';
    }
  };

  return (
    <div
      className="group relative rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-105"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 海报 */}
      <div className="relative aspect-[2/3]">
        {item.posterPath ? (
          <img
            src={getImageUrl(item.posterPath, 'w500')}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-apple-gray-800 flex items-center justify-center">
            <span className="text-apple-gray-500 text-sm">{item.title}</span>
          </div>
        )}

        {/* 渐变遮罩 */}
        <div className={`absolute inset-0 bg-gradient-to-t ${getTypeColor()} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />

        {/* 推荐理由标签 */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 bg-apple-blue/80 backdrop-blur-sm rounded text-xs text-white font-medium">
            {item.reason}
          </span>
        </div>

        {/* 类型标签 */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            item.type === 'movie' ? 'bg-apple-blue/80 text-white' :
            item.type === 'tv' ? 'bg-apple-purple/80 text-white' :
            'bg-apple-pink/80 text-white'
          }`}>
            {item.type === 'movie' ? '电影' : item.type === 'tv' ? '剧集' : '动漫'}
          </span>
        </div>

        {/* 悬停信息 */}
        <div className={`absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-apple-gray-300">
            {item.voteAverage && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {item.voteAverage.toFixed(1)}
              </span>
            )}
            {item.year && <span>{item.year}</span>}
          </div>
          <button className="mt-2 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-medium transition-colors">
            查看详情
          </button>
        </div>
      </div>
    </div>
  );
};
