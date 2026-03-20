import React from 'react';
import { getImageUrl } from '@/services/api/tmdb';
import type { MediaItem } from '@/types';
import { usePlayerStore } from '@/stores';

interface PosterCardProps {
  item: MediaItem;
  onClick: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const PosterCard: React.FC<PosterCardProps> = ({ item, onClick, size = 'medium' }) => {
  const { setCurrentMedia } = usePlayerStore();

  const sizeClasses = {
    small: 'w-32 h-48',
    medium: 'w-44 h-66',
    large: 'w-56 h-84',
  };

  const handleClick = () => {
    setCurrentMedia(item);
    onClick();
  };

  // 根据类型获取渐变色
  const getTypeGradient = () => {
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
      className={`poster-card ${sizeClasses[size]} flex-shrink-0 group relative`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* 海报图片 */}
      <div className="relative w-full h-full rounded-xl overflow-hidden bg-apple-gray-800">
        {item.posterPath ? (
          <img
            src={getImageUrl(item.posterPath, 'w500') || ''}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-apple-gray-700 to-apple-gray-800">
            <svg className="w-12 h-12 text-apple-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <span className="text-sm text-apple-gray-400 text-center px-2">{item.title}</span>
          </div>
        )}

        {/* 悬停时显示的渐变遮罩 */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t ${getTypeGradient()} to-transparent flex flex-col justify-end p-4 z-10`} />

        {/* 悬停时显示的信息 */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4 z-20 translate-y-2 group-hover:translate-y-0">
          {/* 类型标签 */}
          <div className="absolute top-3 right-3">
            <span className={`media-tag ${item.type}`}>
              {item.type === 'movie' ? '🎬' : item.type === 'tv' ? '📺' : '⭐'}
            </span>
          </div>

          {/* 标题 */}
          <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2 drop-shadow-lg">
            {item.title}
          </h3>

          {/* 元信息 */}
          <div className="flex items-center gap-2 flex-wrap">
            {item.voteAverage && (
              <span className="rating-badge">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {item.voteAverage.toFixed(1)}
              </span>
            )}
            {item.year && (
              <span className="px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded text-xs text-apple-gray-200">
                {item.year}
              </span>
            )}
          </div>

          {/* 播放按钮 */}
          <div className="mt-3 flex items-center gap-2">
            <button className="flex-1 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white text-xs font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              播放
            </button>
            <button className="w-7 h-7 bg-black/50 backdrop-blur-sm rounded-lg text-white text-xs hover:bg-black/70 transition-colors flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>

        {/* 播放指示器 - 悬停时显示 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 底部渐变边框 */}
      <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-apple-blue/30 transition-colors duration-300" />
      </div>
    </div>
  );
};

interface PosterRowProps {
  title: string;
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
}

export const PosterRow: React.FC<PosterRowProps> = ({ title, items, onItemClick }) => {
  const rowRef = React.useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(true);
  const [isHovered, setIsHovered] = React.useState(false);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = 450;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  if (items.length === 0) return null;

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-4 px-2">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-apple-gray-600/50 to-transparent" />
        <span className="text-apple-gray-500 text-sm">{items.length} 部</span>
      </div>

      {/* 左右导航按钮 */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-14 h-28 bg-black/70 backdrop-blur-md rounded-r-xl flex items-center justify-center transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
          } hover:bg-apple-blue/80 hover:scale-105`}
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-14 h-28 bg-black/70 backdrop-blur-md rounded-l-xl flex items-center justify-center transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
          } hover:bg-apple-blue/80 hover:scale-105`}
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* 海报滚动区域 */}
      <div
        ref={rowRef}
        onScroll={handleScroll}
        className="flex gap-5 px-2 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* 左侧padding */}
        {showLeftArrow && <div className="w-2 flex-shrink-0" />}

        {items.map((item, index) => (
          <div
            key={item.id}
            className="transition-all duration-300"
            style={{
              transitionDelay: `${index * 50}ms`
            }}
          >
            <PosterCard
              item={item}
              onClick={() => onItemClick(item)}
            />
          </div>
        ))}

        {/* 右侧padding */}
        {showRightArrow && <div className="w-2 flex-shrink-0" />}
      </div>

      {/* 底部渐变遮罩 - 提示可滚动 */}
      <div className={`absolute right-0 top-0 bottom-6 w-16 bg-gradient-to-l from-apple-gray-900 to-transparent pointer-events-none transition-opacity duration-300 ${isHovered && showRightArrow ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};

export const PosterSkeleton: React.FC = () => (
  <div className="w-44 h-66 rounded-xl skeleton flex-shrink-0" />
);

export const PosterRowSkeleton: React.FC = () => (
  <div className="mb-8">
    <div className="h-6 w-40 skeleton rounded mb-4 mx-2" />
    <div className="flex gap-5 px-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <PosterSkeleton key={i} />
      ))}
    </div>
  </div>
);
