import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PosterRow, PosterRowSkeleton } from '@/components/home/PosterWall';
import { useMediaStore, useParentalControlsStore } from '@/stores';
import type { MediaItem } from '@/types';
import { getBackdropUrl } from '@/services/api/tmdb';

// 濯掍綋鍒嗙被绫诲瀷
type MediaCategory = 'all' | 'movie' | 'tv' | 'anime';

// 鍒嗙被閰嶇疆
const categoryConfig: Record<MediaCategory, { label: string; icon: string; gradient: string }> = {
  all: {
    label: '鎺ㄨ崘',
    icon: '馃彔',
    gradient: 'gradient-all'
  },
  movie: {
    label: '鐢靛奖',
    icon: '馃幀',
    gradient: 'gradient-movies'
  },
  tv: {
    label: '鐢佃鍓?,
    icon: '馃摵',
    gradient: 'gradient-tv'
  },
  anime: {
    label: '鍔ㄦ极',
    icon: '猸?,
    gradient: 'gradient-anime'
  }
};

interface HomePageProps {
  onItemSelect: (item: MediaItem) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onItemSelect }) => {
  const { items, isLoading, searchQuery, setSearchQuery, getFilteredItems } = useMediaStore();`n  const { isContentAllowed } = useParentalControlsStore();
  const [currentCategory, setCurrentCategory] = useState<MediaCategory>('all');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 鍒濆鍖栨紨绀烘暟鎹?
  useEffect(() => {
    if (items.length === 0) {
      const demoItems: MediaItem[] = [
        {
          id: '1',
          title: '鑲栫敵鍏嬬殑鏁戣祹',
          originalTitle: 'The Shawshank Redemption',
          type: 'movie',
          year: 1994,
          posterPath: '/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
          backdropPath: '/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
          overview: '涓€鍦鸿皨鏉€妗堜娇閾惰瀹跺畨杩挋鍐ゅ叆鐙憋紝琚垽缁堣韩鐩戠銆傚湪闀胯揪20骞寸殑鍥氱涓紝瀹夎开濮嬬粓娌℃湁鏀惧純瀵硅嚜鐢辩殑娓存湜锛屽鏅烘収鐨勮拷姹傘€?,
          voteAverage: 8.7,
          tmdbId: 278,
          genres: [{ id: 18, name: '鍓ф儏' }, { id: 80, name: '鐘姜' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: '鏁欑埗',
          originalTitle: 'The Godfather',
          type: 'movie',
          year: 1972,
          posterPath: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
          backdropPath: '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
          overview: '缁存墭路鍞惵锋煰閲屾槀鏄粦鎵嬪厷鏌噷鏄傚鏃忕殑棣栭锛屽甫棰嗗鏃忎粠浜嬮潪娉曠殑鍕惧綋锛屼絾浠栧唴蹇冨杽鑹€?,
          voteAverage: 8.7,
          tmdbId: 238,
          genres: [{ id: 18, name: '鍓ф儏' }, { id: 80, name: '鐘姜' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: '鎸囩幆鐜嬶細鐜嬭€呮棤鏁?,
          originalTitle: 'The Lord of the Rings',
          type: 'movie',
          year: 2003,
          posterPath: '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg',
          backdropPath: '/2u7zbn8EudG6kLlBzUYqP8RyFU4.jpg',
          overview: '榄旀垝涓夐儴鏇茬殑鏈€缁堢珷銆傜敇閬撳か鍜岄樋鎷夎础甯﹂杩滃緛鍐涘墠寰€鍒氶搸锛屼笌绱鸡鐨勫啗闃熻繘琛屾渶缁堝喅鎴樸€?,
          voteAverage: 8.5,
          tmdbId: 122,
          genres: [{ id: 12, name: '鍐掗櫓' }, { id: 14, name: '濂囧够' }, { id: 28, name: '鍔ㄤ綔' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '4',
          title: '鐩楁ⅵ绌洪棿',
          originalTitle: 'Inception',
          type: 'movie',
          year: 2010,
          posterPath: '/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
          backdropPath: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
          overview: '閬撳路鏌竷鏄竴浣嶇粡楠岃€侀亾鐨勭獌璐硷紝涓撻棬浠庝粬浜哄唴蹇冪洍鍙栫弽璐电殑绉樺瘑銆?,
          voteAverage: 8.4,
          tmdbId: 27205,
          genres: [{ id: 28, name: '鍔ㄤ綔' }, { id: 878, name: '绉戝够' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '5',
          title: '杩涘嚮鐨勫法浜?,
          originalTitle: 'Attack on Titan',
          type: 'anime',
          year: 2013,
          posterPath: '/arN0O8MNXtL4ZqQBwfXmHp7RrM8.jpg',
          backdropPath: '/x2RS3uTcsJJ9IfjNPcgDmukoEcQ.jpg',
          overview: '鍦ㄩ仴杩滅殑杩囧幓锛屼汉绫绘浘涓€搴﹀洜琚法浜烘崟椋熻€屽穿婧冦€傚垢瀛樹笅鏉ョ殑浜轰滑寤洪€犱簡涓夐噸宸ㄥぇ鐨勫煄澧欐潵闃插尽宸ㄤ汉鐨勫叆渚点€?,
          voteAverage: 9.0,
          tmdbId: 1429,
          genres: [{ id: 16, name: '鍔ㄧ敾' }, { id: 10765, name: '濂囧够' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '6',
          title: '缁濆懡姣掑笀',
          originalTitle: 'Breaking Bad',
          type: 'tv',
          year: 2008,
          posterPath: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
          backdropPath: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
          overview: '鍖栧鑰佸笀娌冨皵鐗孤锋€€鐗瑰洜韬偅鐧岀棁锛屽啀鍔犱笂鐢熸椿鎵€杩紝璧颁笂浜嗗埗姣掕穿姣掔殑閬撹矾銆?,
          voteAverage: 9.3,
          tmdbId: 1396,
          genres: [{ id: 18, name: '鍓ф儏' }, { id: 80, name: '鐘姜' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      useMediaStore.getState().setItems(demoItems);
    }
  }, []);

  // 鏍规嵁鍒嗙被绛涢€夎疆鎾暟鎹?
  const getCarouselItems = useCallback(() => {
    const filtered = getFilteredItems();
    const categoryItems = currentCategory === 'all'
      ? filtered
      : filtered.filter(item => item.type === (currentCategory === 'anime' ? 'anime' : currentCategory));

    // 鏈€澶氭樉绀?涓疆鎾」
    return categoryItems.slice(0, 4);
  }, [items, currentCategory, searchQuery]);

  const carouselItems = getCarouselItems();

  // 鑷姩杞挱
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

  // 杞挱瀵艰埅
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

  // 鏍规嵁鍒嗙被绛涢€夊唴瀹?
  const filteredItems = getFilteredItems();`n  `n  // 应用家长控制过滤`n  const parentalFilteredItems = filteredItems.filter(item => isContentAllowed(item));
  const getCategoryItems = (category: MediaCategory, items: MediaItem[]) => {
    if (category === 'all') return items;
    return items.filter(item => item.type === category);
  };
    return filteredItems.filter(item => item.type === category);
  };

  const categoryItems = getCategoryItems(currentCategory, parentalFilteredItems);
  const movies = parentalFilteredItems.filter(item => item.type === 'movie');
  const tvs = parentalFilteredItems.filter(item => item.type === 'tv');
  const recentlyAdded = [...parentalFilteredItems].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 10);

  // 褰撳墠杞挱椤?
  const currentHero = carouselItems[carouselIndex];

  return (
    <div className="h-full overflow-hidden flex flex-col bg-apple-gray-900">
      {/* Hero 杞挱鍖哄煙 */}
      {currentHero && (
        <div
          className="hero-carousel flex-shrink-0"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* 杞挱鍥剧墖 */}
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

              {/* 澶氬眰娓愬彉鍙犲姞 */}
              <div className="absolute inset-0 gradient-hero-overlay" />
              <div className="absolute inset-0 gradient-hero-bottom" />
              <div className="absolute inset-0 gradient-hero-left" />

              {/* 鍐呭 */}
              <div className="hero-content">
                <div className="max-w-4xl">
                  {/* 濯掍綋绫诲瀷鏍囩 */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`media-tag ${item.type}`}>
                      {item.type === 'movie' ? '馃幀 鐢靛奖' : item.type === 'tv' ? '馃摵 鍓ч泦' : '猸?鍔ㄦ极'}
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

                  {/* 鏍囬 */}
                  <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
                    {item.title}
                  </h1>

                  {/* 绠€浠?*/}
                  {item.overview && (
                    <p className="text-apple-gray-200 text-base leading-relaxed mb-6 max-w-2xl line-clamp-2">
                      {item.overview}
                    </p>
                  )}

                  {/* 鎿嶄綔鎸夐挳 */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => onItemSelect(item)}
                      className="btn-primary animate-float"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      绔嬪嵆鎾斁
                    </button>
                    <button className="btn-secondary">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      璇︽儏
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 杞挱瀵艰埅鎸夐挳 */}
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

          {/* 杞挱鎸囩ず鍣?*/}
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

      {/* 鍒嗙被绛涢€?+ 鍐呭鍖哄煙 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* 鍒嗙被Tab鏍?*/}
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            {/* 宸︿晶鍒嗙被Tab */}
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

            {/* 鍙充晶鎼滅储鏍?*/}
            <div className="flex items-center gap-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="鎼滅储鐢靛奖銆佺數瑙嗗墽..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 鍐呭婊氬姩鍖哄煙 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <>
              <PosterRowSkeleton />
              <PosterRowSkeleton />
              <PosterRowSkeleton />
            </>
          ) : (
            <>
              {/* 鍒嗙被Header */}
              <div className={`mb-6 p-6 rounded-2xl ${categoryConfig[currentCategory].gradient}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{categoryConfig[currentCategory].icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {currentCategory === 'all' ? '绮鹃€夋帹鑽? :
                       currentCategory === 'movie' ? '绮惧僵鐢靛奖' :
                       currentCategory === 'tv' ? '鐑棬鍓ч泦' : '鐑棬鍔ㄦ极'}
                    </h2>
                    <p className="text-apple-gray-400 text-sm mt-1">
                      {categoryItems.length} 閮ㄥ奖鐗囩瓑浣犲彂鐜?
                    </p>
                  </div>
                </div>
              </div>

              {/* 娴锋姤琛?*/}
              {categoryItems.length > 0 ? (
                <PosterRow
                  title={currentCategory === 'all' ? '鏈€杩戞洿鏂? :
                         currentCategory === 'movie' ? '鐢靛奖鍒楄〃' :
                         currentCategory === 'tv' ? '鍓ч泦鍒楄〃' : '鍔ㄦ极鍒楄〃'}
                  items={categoryItems}
                  onItemClick={onItemSelect}
                />
              ) : (
                <div className="text-center py-20">
                  <svg className="w-20 h-20 mx-auto text-apple-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                  <h3 className="text-xl text-white mb-2">鏆傛棤濯掍綋</h3>
                  <p className="text-apple-gray-400">璇峰湪璁剧疆涓坊鍔燦AS杩炴帴骞舵壂鎻忓獟浣撳簱</p>
                </div>
              )}

              {/* 鍒嗙被鏃舵樉绀哄叾浠栧垎绫荤殑鎺ㄨ崘 */}
              {currentCategory !== 'all' && recentlyAdded.length > 0 && (
                <div className="mt-8">
                  <div className="divider mb-6" />
                  <PosterRow title="浣犲彲鑳借繕鍠滄" items={recentlyAdded.slice(0, 6)} onItemClick={onItemSelect} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};





