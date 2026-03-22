import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PosterRow, PosterRowSkeleton } from '@/components/home/PosterWall';
import { useMediaStore } from '@/stores';
import type { MediaItem } from '@/types';
import { getBackdropUrl } from '@/services/api/tmdb';

// 媒体分类类型
type MediaCategory = 'all' | 'movie' | 'tv' | 'anime';

// 分类配置
const categoryConfig: Record<MediaCategory, { label: string; icon: string; gradient: string }> = {
  all: {
    label: '推荐',
    icon: '🏠',
    gradient: 'gradient-all'
  },
  movie: {
    label: '电影',
    icon: '🎬',
    gradient: 'gradient-movies'
  },
  tv: {
    label: '电视剧',
    icon: '📺',
    gradient: 'gradient-tv'
  },
  anime: {
    label: '动漫',
    icon: '⭐',
    gradient: 'gradient-anime'
  }
};

interface HomePageProps {
  onItemSelect: (item: MediaItem) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onItemSelect }) => {
  const { items, isLoading, searchQuery, setSearchQuery, getFilteredItems } = useMediaStore();
  const [currentCategory, setCurrentCategory] = useState<MediaCategory>('all');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 初始化演示数据
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
          overview: '一场谋杀案使银行家安迪蒙冤入狱，被判终身监禁。在长达20年的囚禁中，安迪始终没有放弃对自由的渴望，对智慧的追求。',
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
        {
          id: '5',
          title: '进击的巨人',
          originalTitle: 'Attack on Titan',
          type: 'anime',
          year: 2013,
          posterPath: '/arN0O8MNXtL4ZqQBwfXmHp7RrM8.jpg',
          backdropPath: '/x2RS3uTcsJJ9IfjNPcgDmukoEcQ.jpg',
          overview: '在遥远的过去，人类曾一度因被巨人捕食而崩溃。幸存下来的人们建造了三重巨大的城墙来防御巨人的入侵。',
          voteAverage: 9.0,
          tmdbId: 1429,
          genres: [{ id: 16, name: '动画' }, { id: 10765, name: '奇幻' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '6',
          title: '绝命毒师',
          originalTitle: 'Breaking Bad',
          type: 'tv',
          year: 2008,
          posterPath: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
          backdropPath: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
          overview: '化学老师沃尔特·怀特因身患癌症，再加上生活所迫，走上了制毒贩毒的道路。',
          voteAverage: 9.3,
          tmdbId: 1396,
          genres: [{ id: 18, name: '剧情' }, { id: 80, name: '犯罪' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      useMediaStore.getState().setItems(demoItems);
    }
  }, []);

  // 根据分类筛选轮播数据
  const getCarouselItems = useCallback(() => {
    const filtered = getFilteredItems();
    const categoryItems = currentCategory === 'all'
      ? filtered
      : filtered.filter(item => item.type === (currentCategory === 'anime' ? 'anime' : currentCategory));

    // 最多显示4个轮播项
    return categoryItems.slice(0, 4);
  }, [items, currentCategory, searchQuery]);

  const carouselItems = getCarouselItems();

  // 自动轮播
  useEffect(() => {
    if (isAutoPlaying && carouselItems.length > 1) {
      carouselRef.current = setInterval(() => {
        setCarouselIndex(prev => (prev + 1) % carouselItems.length);
      }, 6000);
    }

    return () => {
      if (carouselRef.current) {
        clearInterval(carouselRef.current);
      }
    };
  }, [isAutoPlaying, carouselItems.length]);

  // 轮播导航
  const goToSlide = (index: number) => {
    setCarouselIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCarouselIndex(prev => (prev + 1) % carouselItems.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCarouselIndex(prev => (prev - 1 + carouselItems.length) % carouselItems.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // 根据分类筛选内容
  const filteredItems = getFilteredItems();
  const getCategoryItems = (category: MediaCategory) => {
    if (category === 'all') return filteredItems;
    return filteredItems.filter(item => item.type === category);
  };

  const categoryItems = getCategoryItems(currentCategory);
  const movies = filteredItems.filter(item => item.type === 'movie');
  const tvs = filteredItems.filter(item => item.type === 'tv');
  const recentlyAdded = [...filteredItems].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 10);

  // 当前轮播项
  const currentHero = carouselItems[carouselIndex];

  return (
    <div className="h-full overflow-hidden flex flex-col bg-apple-gray-900">
      {/* Hero 轮播区域 */}
      {currentHero && (
        <div
          className="hero-carousel flex-shrink-0"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* 轮播图片 */}
          {carouselItems.map((item, index) => (
            <div
              key={item.id}
              className={`hero-slide ${index === carouselIndex ? 'active' : ''}`}
            >
              {item.backdropPath ? (
                <img
                  src={getBackdropUrl(item.backdropPath) || ''}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-apple-gray-800 to-apple-gray-900" />
              )}

              {/* 多层渐变叠加 */}
              <div className="absolute inset-0 gradient-hero-overlay" />
              <div className="absolute inset-0 gradient-hero-bottom" />
              <div className="absolute inset-0 gradient-hero-left" />

              {/* 内容 */}
              <div className="hero-content">
                <div className="max-w-4xl">
                  {/* 媒体类型标签 */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`media-tag ${item.type}`}>
                      {item.type === 'movie' ? '🎬 电影' : item.type === 'tv' ? '📺 剧集' : '⭐ 动漫'}
                    </span>
                    {item.voteAverage && (
                      <span className="rating-badge">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {item.voteAverage.toFixed(1)}
                      </span>
                    )}
                    {item.year && (
                      <span className="text-apple-gray-300 text-sm">{item.year}</span>
                    )}
                  </div>

                  {/* 标题 */}
                  <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
                    {item.title}
                  </h1>

                  {/* 简介 */}
                  {item.overview && (
                    <p className="text-apple-gray-200 text-base leading-relaxed mb-6 max-w-2xl line-clamp-2">
                      {item.overview}
                    </p>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => onItemSelect(item)}
                      className="btn-primary animate-float"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      立即播放
                    </button>
                    <button className="btn-secondary">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      详情
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 轮播导航按钮 */}
          {carouselItems.length > 1 && (
            <>
              <button onClick={prevSlide} className="carousel-nav prev">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={nextSlide} className="carousel-nav next">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* 轮播指示器 */}
          {carouselItems.length > 1 && (
            <div className="carousel-indicators absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {carouselItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`carousel-indicator ${index === carouselIndex ? 'active' : ''}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 分类筛选 + 内容区域 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* 分类Tab栏 */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            {/* 左侧分类Tab */}
            <div className="flex items-center gap-2">
              {(Object.keys(categoryConfig) as MediaCategory[]).map((category) => (
                <button
                  key={category}
                  onClick={() => setCurrentCategory(category)}
                  className={`category-tab ${currentCategory === category ? 'active' : ''}`}
                >
                  <span className="category-icon">{categoryConfig[category].icon}</span>
                  <span className="ml-2">{categoryConfig[category].label}</span>
                </button>
              ))}
            </div>

            {/* 右侧搜索栏 */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="搜索电影、电视剧..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 内容滚动区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <>
              <PosterRowSkeleton />
              <PosterRowSkeleton />
              <PosterRowSkeleton />
            </>
          ) : (
            <>
              {/* 分类Header */}
              <div className={`mb-6 p-6 rounded-2xl ${categoryConfig[currentCategory].gradient}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{categoryConfig[currentCategory].icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {currentCategory === 'all' ? '精选推荐' :
                       currentCategory === 'movie' ? '精彩电影' :
                       currentCategory === 'tv' ? '热门剧集' : '热门动漫'}
                    </h2>
                    <p className="text-apple-gray-400 text-sm mt-1">
                      {categoryItems.length} 部影片等你发现
                    </p>
                  </div>
                </div>
              </div>

              {/* 海报行 */}
              {categoryItems.length > 0 ? (
                <PosterRow
                  title={currentCategory === 'all' ? '最近更新' :
                         currentCategory === 'movie' ? '电影列表' :
                         currentCategory === 'tv' ? '剧集列表' : '动漫列表'}
                  items={categoryItems}
                  onItemClick={onItemSelect}
                />
              ) : (
                <div className="text-center py-20">
                  <svg className="w-20 h-20 mx-auto text-apple-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                  <h3 className="text-xl text-white mb-2">暂无媒体</h3>
                  <p className="text-apple-gray-400">请在设置中添加NAS连接并扫描媒体库</p>
                </div>
              )}

              {/* 分类时显示其他分类的推荐 */}
              {currentCategory !== 'all' && recentlyAdded.length > 0 && (
                <div className="mt-8">
                  <div className="divider mb-6" />
                  <PosterRow title="你可能还喜欢" items={recentlyAdded.slice(0, 6)} onItemClick={onItemSelect} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
