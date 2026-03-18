import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePlayerStore } from '@/stores';

export const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({
    currentMedia: usePlayerStore.getState().currentMedia,
    isPlaying: usePlayerStore.getState().isPlaying,
    currentTime: usePlayerStore.getState().currentTime,
    duration: usePlayerStore.getState().duration,
    volume: usePlayerStore.getState().volume,
    isMuted: usePlayerStore.getState().isMuted,
    playbackRate: usePlayerStore.getState().playbackRate,
  });

  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe((newState) => {
      setState({
        currentMedia: newState.currentMedia,
        isPlaying: newState.isPlaying,
        currentTime: newState.currentTime,
        duration: newState.duration,
        volume: newState.volume,
        isMuted: newState.isMuted,
        playbackRate: newState.playbackRate,
      });
    });
    return () => unsubscribe();
  }, []);

  const {
    currentMedia,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
  } = state;

  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const controlsTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleTimeUpdate = () => {
    if (videoRef.current && !isDragging) {
      usePlayerStore.getState().setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      usePlayerStore.getState().setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const store = usePlayerStore.getState();
    if (videoRef.current && store.duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * store.duration;
      videoRef.current.currentTime = newTime;
      store.setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={currentMedia?.filePath}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={() => isPlaying ? usePlayerStore.getState().pause() : usePlayerStore.getState().play()}
        onDoubleClick={handleFullscreen}
      />

      <div className={`absolute bottom-0 left-0 right-0 player-controls p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div
          className="progress-bar mb-4"
          onClick={handleSeek}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
        >
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => isPlaying ? usePlayerStore.getState().pause() : usePlayerStore.getState().play()}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {isPlaying ? (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <span className="text-white text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => usePlayerStore.getState().toggleMute()} className="p-2 hover:bg-white/20 rounded-full">
                {isMuted || volume === 0 ? (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => usePlayerStore.getState().setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 accent-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={playbackRate}
              onChange={(e) => usePlayerStore.getState().setPlaybackRate(parseFloat(e.target.value))}
              className="bg-transparent text-white text-sm border border-white/30 rounded px-2 py-1"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
            <button onClick={handleFullscreen} className="p-2 hover:bg-white/20 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface EpisodeListProps {
  seasons: { seasonNumber: number; name: string; episodeCount: number }[];
  onSelectEpisode: (season: number, episode: number) => void;
}

export const EpisodeList: React.FC<EpisodeListProps> = ({ seasons, onSelectEpisode }) => {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]?.seasonNumber || 1);
  const [currentEpisode, setCurrentEpisode] = useState(1);

  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe((state) => {
      setCurrentEpisode(state.currentEpisode);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4 glass rounded-xl">
      <h3 className="text-lg font-semibold text-white mb-4">选集</h3>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {seasons.map((season) => (
          <button
            key={season.seasonNumber}
            onClick={() => setSelectedSeason(season.seasonNumber)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedSeason === season.seasonNumber
                ? 'bg-apple-blue text-white'
                : 'bg-apple-gray-700 text-apple-gray-300 hover:bg-apple-gray-600'
            }`}
          >
            第{season.seasonNumber}季
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
        {Array.from({ length: seasons.find(s => s.seasonNumber === selectedSeason)?.episodeCount || 0 }).map((_, i) => {
          const episodeNum = i + 1;
          return (
            <button
              key={episodeNum}
              onClick={() => onSelectEpisode(selectedSeason, episodeNum)}
              className={`p-3 rounded-lg text-sm text-center transition-colors ${
                currentEpisode === episodeNum
                  ? 'bg-apple-blue text-white'
                  : 'bg-apple-gray-800 text-apple-gray-300 hover:bg-apple-gray-700'
              }`}
            >
              {episodeNum}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface DetailsCardProps {
  title: string;
  overview?: string;
  genres?: { id: number; name: string }[];
  voteAverage?: number;
  year?: number;
}

export const DetailsCard: React.FC<DetailsCardProps> = ({
  title,
  overview,
  genres,
  voteAverage,
  year
}) => (
  <div className="glass rounded-xl p-6">
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <div className="flex items-center gap-4 mb-4">
      {voteAverage && (
        <span className="flex items-center gap-1 text-apple-yellow">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {voteAverage.toFixed(1)}
        </span>
      )}
      {year && <span className="text-apple-gray-300 text-sm">{year}</span>}
    </div>
    {genres && genres.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-4">
        {genres.map((genre) => (
          <span key={genre.id} className="px-3 py-1 bg-apple-gray-700 rounded-full text-xs text-apple-gray-300">
            {genre.name}
          </span>
        ))}
      </div>
    )}
    {overview && (
      <p className="text-apple-gray-300 text-sm leading-relaxed line-clamp-4">{overview}</p>
    )}
  </div>
);
