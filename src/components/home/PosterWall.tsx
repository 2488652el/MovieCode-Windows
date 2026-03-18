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

  return (
    <div
      className={`poster-card ${sizeClasses[size]} flex-shrink-0 group`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-apple-gray-800">
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

        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4">
          <h3 className="text-white font-medium text-sm line-clamp-2">{item.title}</h3>
          <div className="flex items-center gap-2 mt-2">
            {item.voteAverage && (
              <span className="flex items-center gap-1 text-apple-yellow text-xs">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {item.voteAverage.toFixed(1)}
              </span>
            )}
            {item.year && <span className="text-apple-gray-300 text-xs">{item.year}</span>}
          </div>
        </div>

        <div className="absolute top-2 right-2">
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
            item.type === 'movie' ? 'bg-apple-blue/80 text-white' :
            item.type === 'tv' ? 'bg-apple-purple/80 text-white' :
            'bg-apple-pink/80 text-white'
          }`}>
            {item.type === 'movie' ? '电影' : item.type === 'tv' ? '剧集' : '动漫'}
          </span>
        </div>
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

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = 400;
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
    <div className="relative group">
      <h2 className="text-xl font-semibold text-white mb-4 px-6">{title}</h2>
      
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-24 bg-black/60 backdrop-blur-sm rounded-r-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-24 bg-black/60 backdrop-blur-sm rounded-l-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div
        ref={rowRef}
        onScroll={handleScroll}
        className="flex gap-4 px-6 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => (
          <PosterCard
            key={item.id}
            item={item}
            onClick={() => onItemClick(item)}
          />
        ))}
      </div>
    </div>
  );
};

export const PosterSkeleton: React.FC = () => (
  <div className="w-44 h-66 rounded-lg skeleton flex-shrink-0" />
);

export const PosterRowSkeleton: React.FC = () => (
  <div className="mb-6">
    <div className="h-6 w-32 skeleton rounded mb-4 mx-6" />
    <div className="flex gap-4 px-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <PosterSkeleton key={i} />
      ))}
    </div>
  </div>
);
