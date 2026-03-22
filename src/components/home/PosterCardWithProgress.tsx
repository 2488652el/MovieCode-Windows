import React, { useEffect, useRef, useState } from 'react';
import { getImageUrl } from '@/services/api/tmdb';
import { imageCache } from '@/services/imageCache';
import type { MediaItem } from '@/types';
import { usePlayerStore, useHistoryStore } from '@/stores';

/**
 * 懒加载海报图片组件
 */
const LazyPosterImage: React.FC<{ posterPath: string; title: string }> = ({ posterPath, title }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px', threshold: 0.01 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && posterPath) {
      const originalUrl = getImageUrl(posterPath, 'w500') || '';
      imageCache.getImageUrl(originalUrl).then((cachedUrl) => {
        setCurrentSrc(cachedUrl || originalUrl);
      }).catch(() => {
        setCurrentSrc(originalUrl);
      });
    }
  }, [isVisible, posterPath]);

  return (
    <div ref={containerRef} className="w-full h-full">
      {!isLoaded && (
        <div className="w-full h-full skeleton animate-pulse" />
      )}
      {currentSrc && (
        <img
          src={currentSrc}
          alt={title}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
};

interface PosterCardProps {
  item: MediaItem;
  onClick: () => void;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
}

export const PosterCardWithProgress: React.FC<PosterCardProps> = ({ 
  item, 
  onClick, 
  size = 'medium',
  showProgress = true 
}) => {

  const { setCurrentMedia } = usePlayerStore();
  const { getEntry } = useHistoryStore();

  const historyEntry = showProgress ? getEntry(item.id) : undefined;
  const progress = historyEntry?.progress || 0;

  const sizeClasses = {
    small: 'w-32 h-48',
    medium: 'w-44 h-66',
    large: 'w-56 h-84',
  };

  const handleClick = () => {
    setCurrentMedia(item);
    onClick();
  };

  // 获取进度颜色
  const getProgressColor = () => {
    if (progress >= 95) return 'bg-green-500';
    if (progress >= 50) return 'bg-apple-blue';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-apple-gray-500';
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
      {/* 海报图片 - 使用懒加载 */}
      <div className="relative w-full h-full rounded-xl overflow-hidden bg-apple-gray-800">
        {item.posterPath ? (
          <LazyPosterImage posterPath={item.posterPath} title={item.title} />
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

          {/* 进度标签 */}
          {showProgress && progress > 0 && (
            <div className="absolute top-3 left-3">
              <span className={`px-2 py-0.5 rounded text-xs font-medium backdrop-blur-sm ${
                progress >= 95 
                  ? 'bg-green-500/80 text-white' 
                  : 'bg-black/60 text-white'
              }`}>
                看到 {Math.round(progress)}%
              </span>
            </div>
          )}

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
              {progress > 5 && progress < 95 ? '继续' : '播放'}
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

        {/* 进度条 - 底部 */}
        {showProgress && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 z-20">
            <div 
              className={`h-full ${getProgressColor()} transition-all duration-300`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* 底部渐变边框 */}
      <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-apple-blue/30 transition-colors duration-300" />
      </div>
    </div>
  );
};
