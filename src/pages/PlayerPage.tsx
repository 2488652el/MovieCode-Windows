import React, { useEffect } from 'react';
import { VideoPlayer, EpisodeList, DetailsCard } from '@/components/player/VideoPlayer';
import { usePlayerStore } from '@/stores';
import { getImageUrl, getMovieCredits, getTVCredits } from '@/services/api/tmdb';

interface PlayerPageProps {
  onBack: () => void;
}

export const PlayerPage: React.FC<PlayerPageProps> = ({ onBack }) => {
  const { currentMedia, setCurrentEpisode } = usePlayerStore();

  const handleSelectEpisode = (season: number, episode: number) => {
    setCurrentEpisode(episode);
  };

  if (!currentMedia) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-white text-xl mb-4">未选择媒体</p>
          <button onClick={onBack} className="btn-primary">返回首页</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-apple-gray-900">
      <div className="flex-1 flex flex-col">
        <div className="h-14 flex items-center gap-4 px-4 glass border-b border-white/10">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-white font-medium">{currentMedia.title}</h2>
        </div>
        <div className="flex-1">
          <VideoPlayer />
        </div>
      </div>

      <div className="w-96 bg-apple-gray-900/50 overflow-y-auto p-4 space-y-4">
        {currentMedia.type === 'tv' && currentMedia.seasons && (
          <EpisodeList
            seasons={currentMedia.seasons.map((s) => ({
              seasonNumber: s.seasonNumber,
              name: s.name,
              episodeCount: s.episodeCount
            }))}
            onSelectEpisode={handleSelectEpisode}
          />
        )}

        <DetailsCard
          title={currentMedia.title}
          overview={currentMedia.overview}
          genres={currentMedia.genres}
          voteAverage={currentMedia.voteAverage}
          year={currentMedia.year}
        />

        {currentMedia.tmdbId && (
          <CastSection tmdbId={currentMedia.tmdbId} type={currentMedia.type} />
        )}
      </div>
    </div>
  );
};

const CastSection: React.FC<{ tmdbId: number; type: 'movie' | 'tv' | 'anime' }> = ({ tmdbId, type }) => {
  const [cast, setCast] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const credits = type === 'movie' 
          ? await getMovieCredits(tmdbId)
          : await getTVCredits(tmdbId);
        setCast(credits.cast?.slice(0, 10) || []);
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCredits();
  }, [tmdbId, type]);

  if (loading) {
    return (
      <div className="glass rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-4">演员</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full skeleton" />
              <div className="flex-1">
                <div className="h-4 w-24 skeleton rounded mb-1" />
                <div className="h-3 w-16 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (cast.length === 0) return null;

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="text-lg font-semibold text-white mb-4">演员</h3>
      <div className="space-y-3">
        {cast.map((person) => (
          <div key={person.id} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-apple-gray-700 flex-shrink-0">
              {person.profilePath ? (
                <img
                  src={getImageUrl(person.profilePath, 'w500') || ''}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-apple-gray-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{person.name}</p>
              <p className="text-apple-gray-400 text-xs truncate">{person.character}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
