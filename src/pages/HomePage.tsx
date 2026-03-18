import React, { useState, useEffect } from 'react';
import { PosterRow, PosterRowSkeleton } from '@/components/home/PosterWall';
import { useMediaStore } from '@/stores';
import type { MediaItem } from '@/types';
import { getBackdropUrl } from '@/services/api/tmdb';

interface HomePageProps {
  onItemSelect: (item: MediaItem) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onItemSelect }) => {
  const { items, isLoading, searchQuery, setSearchQuery, getFilteredItems } = useMediaStore();
  const [heroItem, setHeroItem] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      const demoItems: MediaItem[] = [
        {
          id: '1',
          title: '肖申克的救赎',
          originalTitle: 'The Shawshank Redemption',
          type: 'movie',
          year: 1994,
          posterPath: '/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
          backdropPath: '/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
          overview: '一场谋杀案使银行家安迪蒙冤入狱，被判终身监禁。在长达20年的囚禁中，安迪始终没有放弃对自由的渴望，对智慧的追求。他用自己的智慧和坚持，终于获得了救赎，重获自由。',
          voteAverage: 8.7,
          tmdbId: 278,
          genres: [{ id: 18, name: '剧情' }, { id: 80, name: '犯罪' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: '教父',
          originalTitle: 'The Godfather',
          type: 'movie',
          year: 1972,
          posterPath: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
          backdropPath: '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
          overview: '维托·唐·柯里昂是黑手党柯里昂家族的首领，带领家族从事非法的勾当，但他内心善良。',
          voteAverage: 8.7,
          tmdbId: 238,
          genres: [{ id: 18, name: '剧情' }, { id: 80, name: '犯罪' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: '指环王：王者无敌',
          originalTitle: 'The Lord of the Rings',
          type: 'movie',
          year: 2003,
          posterPath: '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg',
          backdropPath: '/2u7zbn8EudG6kLlBzUYqP8RyFU4.jpg',
          overview: '魔戒三部曲的最终章。甘道夫和阿拉贡带领远征军前往刚铎，与索伦的军队进行最终决战。',
          voteAverage: 8.5,
          tmdbId: 122,
          genres: [{ id: 12, name: '冒险' }, { id: 14, name: '奇幻' }, { id: 28, name: '动作' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '4',
          title: '盗梦空间',
          originalTitle: 'Inception',
          type: 'movie',
          year: 2010,
          posterPath: '/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
          backdropPath: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
          overview: '道姆·柯布是一位经验老道的窃贼，专门从他人内心盗取珍贵的秘密。',
          voteAverage: 8.4,
          tmdbId: 27205,
          genres: [{ id: 28, name: '动作' }, { id: 878, name: '科幻' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      useMediaStore.getState().setItems(demoItems);
      setHeroItem(demoItems[0]);
    } else {
      setHeroItem(items[0]);
    }
  }, []);

  const filteredItems = getFilteredItems();
  const movies = filteredItems.filter(item => item.type === 'movie');
  const tvs = filteredItems.filter(item => item.type === 'tv');
  const recentlyAdded = [...filteredItems].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 10);

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero Banner - 占据顶部全宽 */}
      {heroItem && (
        <div className="relative h-80">
          <div className="absolute inset-0">
            {heroItem.backdropPath ? (
              <img
                src={getBackdropUrl(heroItem.backdropPath) || ''}
                alt={heroItem.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-apple-gray-800 to-apple-gray-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-apple-gray-900 via-apple-gray-900/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-apple-gray-900 via-apple-gray-900/50 to-transparent" />
          </div>
          
          <div className="relative h-full max-w-7xl mx-auto px-8 flex flex-col justify-between pt-6 pb-8">
            {/* 顶部：Logo和搜索 */}
            <div className="flex items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-white">{heroItem.title}</h1>
                <div className="flex items-center gap-3 mt-2">
                  {heroItem.voteAverage && (
                    <span className="flex items-center gap-1 text-apple-yellow">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {heroItem.voteAverage.toFixed(1)}
                    </span>
                  )}
                  {heroItem.year && <span className="text-apple-gray-300 text-sm">{heroItem.year}</span>}
                  {heroItem.genres?.slice(0, 2).map((genre) => (
                    <span key={genre.id} className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white">
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* 搜索栏 */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="搜索电影、电视剧..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-apple-gray-800/80 border border-apple-gray-700 rounded-full text-sm text-white placeholder-apple-gray-400 focus:border-apple-blue focus:bg-apple-gray-800 transition-all"
                  />
                </div>
              </div>
            </div>
            
            {/* 底部：简介和播放按钮 */}
            <div className="flex items-end justify-between gap-6">
              <div className="flex-1 max-w-xl">
                {heroItem.overview && (
                  <p className="text-apple-gray-300 text-sm line-clamp-2">{heroItem.overview}</p>
                )}
              </div>
              <button
                onClick={() => onItemSelect(heroItem)}
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                立即播放
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {isLoading ? (
          <>
            <PosterRowSkeleton />
            <PosterRowSkeleton />
            <PosterRowSkeleton />
          </>
        ) : (
          <>
            {recentlyAdded.length > 0 && (
              <PosterRow title="最近添加" items={recentlyAdded} onItemClick={onItemSelect} />
            )}
            {movies.length > 0 && (
              <PosterRow title="电影" items={movies} onItemClick={onItemSelect} />
            )}
            {tvs.length > 0 && (
              <PosterRow title="电视剧" items={tvs} onItemClick={onItemSelect} />
            )}
            {filteredItems.length === 0 && (
              <div className="text-center py-20">
                <svg className="w-20 h-20 mx-auto text-apple-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                <h3 className="text-xl text-white mb-2">暂无媒体</h3>
                <p className="text-apple-gray-400">请在设置中添加NAS连接并扫描媒体库</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
