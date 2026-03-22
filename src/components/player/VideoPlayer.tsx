import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePlayerStore } from '@/stores';
import { invoke } from '@tauri-apps/api/core';

// 倍速播放档位 (8档)
const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

// 字幕信息接口
interface SubtitleInfo {
  path: string;
  name: string;
  language?: string;
  type: 'embedded' | 'external' | 'none';
}

// 播放进度记录
interface PlaybackProgress {
  mediaId: string;
  filePath: string;
  currentTime: number;
  duration: number;
  lastWatched: string;
}

// 续播提示弹窗组件
interface ResumeDialogProps {
  progress: PlaybackProgress;
  onResume: () => void;
  onStartOver: () => void;
  visible: boolean;
}

const ResumeDialog: React.FC<ResumeDialogProps> = ({ progress, onResume, onStartOver, visible }) => {
  if (!visible) return null;
  
  const percent = Math.round((progress.currentTime / progress.duration) * 100);
  
  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-apple-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-white text-xl font-semibold mb-2">是否继续播放？</h3>
        <p className="text-apple-gray-300 mb-6">
          您上次看到 {percent}%，是否从上次位置继续？
        </p>
        <div className="flex gap-4">
          <button
            onClick={onStartOver}
            className="flex-1 px-6 py-3 bg-apple-gray-700 text-white rounded-xl hover:bg-apple-gray-600 transition-colors"
          >
            从头开始
          </button>
          <button
            onClick={onResume}
            className="flex-1 px-6 py-3 bg-apple-blue text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            继续播放
          </button>
        </div>
      </div>
    </div>
  );
};

// 字幕选择菜单组件
interface SubtitleMenuProps {
  subtitles: SubtitleInfo[];
  currentSubtitle: SubtitleInfo | null;
  onSelect: (subtitle: SubtitleInfo) => void;
  onClose: () => void;
  onLoadExternal: () => void;
  offset: number;
  onOffsetChange: (offset: number) => void;
}

const SubtitleMenu: React.FC<SubtitleMenuProps> = ({
  subtitles,
  currentSubtitle,
  onSelect,
  onClose,
  onLoadExternal,
  offset,
  onOffsetChange
}) => {
  return (
    <div className="absolute bottom-20 right-4 bg-apple-gray-900/95 backdrop-blur-lg rounded-xl p-4 min-w-64 shadow-2xl border border-white/10">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-white font-medium">字幕</h4>
        <button onClick={onClose} className="text-apple-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      {/* 字幕选项列表 */}
      <div className="space-y-1 mb-4">
        <button
          onClick={() => onSelect({ path: '', name: '关闭字幕', type: 'none' })}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            currentSubtitle?.type === 'none' 
              ? 'bg-apple-blue text-white' 
              : 'text-apple-gray-300 hover:bg-white/10'
          }`}
        >
          关闭字幕
        </button>
        {subtitles.map((sub, index) => (
          <button
            key={index}
            onClick={() => onSelect(sub)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
              currentSubtitle?.path === sub.path 
                ? 'bg-apple-blue text-white' 
                : 'text-apple-gray-300 hover:bg-white/10'
            }`}
          >
            <span>{sub.name}</span>
            {sub.type === 'embedded' && (
              <span className="text-xs text-apple-gray-500">内嵌</span>
            )}
          </button>
        ))}
      </div>
      
      {/* 加载外部字幕按钮 */}
      <button
        onClick={onLoadExternal}
        className="w-full px-3 py-2 bg-apple-gray-700 text-white text-sm rounded-lg hover:bg-apple-gray-600 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        加载外部字幕文件
      </button>
      
      {/* 字幕偏移调节 */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-apple-gray-400 text-xs">字幕同步偏移</span>
          <span className="text-apple-blue text-xs">{offset > 0 ? `+${offset}s` : `${offset}s`}</span>
        </div>
        <input
          type="range"
          min="-5"
          max="5"
          step="0.5"
          value={offset}
          onChange={(e) => onOffsetChange(parseFloat(e.target.value))}
          className="w-full h-1 bg-apple-gray-700 rounded-lg appearance-none cursor-pointer accent-apple-blue"
        />
        <div className="flex justify-between text-xs text-apple-gray-500 mt-1">
          <span>-5s</span>
          <span>+5s</span>
        </div>
      </div>
    </div>
  );
};

// 速度提示组件
const SpeedToast: React.FC<{ speed: number; visible: boolean }> = ({ speed, visible }) => {
  if (!visible) return null;
  
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-xl text-lg font-medium">
      {speed === 1 ? '正常速度' : `${speed}x`}
    </div>
  );
};

export const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressSaveIntervalRef = useRef<number | null>(null);
  const subtitleTrackRef = useRef<HTMLTrackElement | null>(null);
  
  // 字幕状态
  const [subtitles, setSubtitles] = useState<SubtitleInfo[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleInfo | null>(null);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showSpeedToast, setShowSpeedToast] = useState(false);
  const [subtitleOffset, setSubtitleOffset] = useState(0); // 字幕偏移 (秒)
  
  // 续播状态
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedProgress, setSavedProgress] = useState<PlaybackProgress | null>(null);
  
  // 外部字幕 track 元素引用
  const [externalTrackSrc, setExternalTrackSrc] = useState<string | null>(null);
  
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

  // 搜索字幕文件
  const searchSubtitleFiles = useCallback(async (videoPath: string) => {
    try {
      const foundSubtitles = await invoke<{ path: string; name: string }[]>('search_subtitle_files', {
        videoPath
      });
      
      const subtitleInfos: SubtitleInfo[] = foundSubtitles.map(sub => ({
        ...sub,
        type: 'external' as const
      }));
      
      setSubtitles(subtitleInfos);
      
      // 自动选择第一个字幕（如果有）
      if (subtitleInfos.length > 0 && !currentSubtitle) {
        setCurrentSubtitle(subtitleInfos[0]);
      }
    } catch (error) {
      console.log('搜索字幕文件失败:', error);
    }
  }, [currentSubtitle]);

  // 加载外部字幕文件
  const handleLoadExternalSubtitle = useCallback(async () => {
    try {
      const selected = await invoke<string | null>('open_subtitle_file_dialog');
      if (selected) {
        const fileName = selected.split(/[/\\]/).pop() || selected;
        const newSubtitle: SubtitleInfo = {
          path: selected,
          name: fileName,
          type: 'external'
        };
        setSubtitles(prev => [...prev, newSubtitle]);
        setCurrentSubtitle(newSubtitle);
        setExternalTrackSrc(`file:///${selected.replace(/\\/g, '/')}`);
        setShowSubtitleMenu(false);
      }
    } catch (error) {
      console.log('加载字幕失败:', error);
    }
  }, []);

  // 加载进度
  const loadProgress = useCallback(async (mediaId: string, filePath: string) => {
    try {
      const progress = await invoke<PlaybackProgress | null>('get_playback_progress', {
        mediaId,
        filePath
      });
      
      if (progress && progress.currentTime > 0) {
        const percent = (progress.currentTime / progress.duration) * 100;
        // 只在 5% - 95% 之间提示续播
        if (percent > 5 && percent < 95) {
          setSavedProgress(progress);
          setShowResumeDialog(true);
        }
      }
    } catch (error) {
      console.log('加载进度失败:', error);
    }
  }, []);

  // 保存进度
  const saveProgress = useCallback(async () => {
    if (!currentMedia || !videoRef.current || duration === 0) return;
    
    const currentPercent = (currentTime / duration) * 100;
    // 只保存 5% - 95% 之间的进度
    if (currentPercent > 5 && currentPercent < 95) {
      try {
        await invoke('save_playback_progress', {
          mediaId: currentMedia.id,
          filePath: currentMedia.filePath || '',
          currentTime: currentTime,
          duration: duration
        });
      } catch (error) {
        console.log('保存进度失败:', error);
      }
    }
  }, [currentMedia, currentTime, duration]);

  // 初始化播放
  useEffect(() => {
    if (currentMedia?.filePath) {
      searchSubtitleFiles(currentMedia.filePath);
      loadProgress(currentMedia.id, currentMedia.filePath);
      
      // 每30秒自动保存进度
      progressSaveIntervalRef.current = window.setInterval(saveProgress, 30000);
    }
    
    return () => {
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
      }
      // 离开时保存进度
      saveProgress();
    };
  }, [currentMedia?.filePath, currentMedia?.id]);

  // 处理续播
  const handleResume = useCallback(() => {
    if (savedProgress && videoRef.current) {
      videoRef.current.currentTime = savedProgress.currentTime;
      usePlayerStore.getState().setCurrentTime(savedProgress.currentTime);
    }
    setShowResumeDialog(false);
    usePlayerStore.getState().play();
  }, [savedProgress]);

  const handleStartOver = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      usePlayerStore.getState().setCurrentTime(0);
    }
    setShowResumeDialog(false);
    usePlayerStore.getState().play();
  }, []);

  // 选择字幕
  const handleSelectSubtitle = useCallback((subtitle: SubtitleInfo) => {
    setCurrentSubtitle(subtitle);
    
    if (subtitle.type === 'none') {
      // 关闭字幕
      setExternalTrackSrc(null);
      if (videoRef.current) {
        const tracks = videoRef.current.textTracks;
        for (let i = 0; i < tracks.length; i++) {
          tracks[i].mode = 'hidden';
        }
      }
    } else if (subtitle.type === 'external') {
      // 加载外部字幕
      setExternalTrackSrc(`file:///${subtitle.path.replace(/\\/g, '/')}`);
    }
    
    setShowSubtitleMenu(false);
  }, []);

  // 应用字幕偏移
  useEffect(() => {
    if (videoRef.current && subtitleOffset !== 0) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        // 注意：HTML5 video 不支持直接设置字幕偏移
        // 这里只是记录值，实际偏移需要在解析字幕时处理
      }
    }
  }, [subtitleOffset]);

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

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          break;
        case 'ArrowRight':
          videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
          break;
        case 'ArrowUp':
          usePlayerStore.getState().setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          usePlayerStore.getState().setVolume(Math.max(0, volume - 0.1));
          break;
        case ' ':
          e.preventDefault();
          isPlaying ? usePlayerStore.getState().pause() : usePlayerStore.getState().play();
          break;
        case 'f':
          handleFullscreen();
          break;
        case 'm':
          usePlayerStore.getState().toggleMute();
          break;
        case 's':
          setShowSubtitleMenu(prev => !prev);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, duration]);

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
      >
        {/* 外部字幕轨道 */}
        {externalTrackSrc && (
          <track
            ref={subtitleTrackRef}
            kind="subtitles"
            src={externalTrackSrc}
            default
            srcLang="zh"
            label="外部字幕"
          />
        )}
      </video>

      {/* 续播提示弹窗 */}
      <ResumeDialog
        progress={savedProgress!}
        onResume={handleResume}
        onStartOver={handleStartOver}
        visible={showResumeDialog}
      />

      {/* 字幕选择菜单 */}
      {showSubtitleMenu && (
        <SubtitleMenu
          subtitles={subtitles}
          currentSubtitle={currentSubtitle}
          onSelect={handleSelectSubtitle}
          onClose={() => setShowSubtitleMenu(false)}
          onLoadExternal={handleLoadExternalSubtitle}
          offset={subtitleOffset}
          onOffsetChange={setSubtitleOffset}
        />
      )}

      {/* 速度提示 */}
      <SpeedToast speed={playbackRate} visible={showSpeedToast} />

      <div className={`absolute bottom-0left-0 right-0 player-controls p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div
          className="progress-bar mb-4 cursor-pointer"
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
            {/* 倍速选择器 - 扩展到8档 */}
            <select
              value={playbackRate}
              onChange={(e) => {
                const newRate = parseFloat(e.target.value);
                usePlayerStore.getState().setPlaybackRate(newRate);
                setShowSpeedToast(true);
                setTimeout(() => setShowSpeedToast(false), 2000);
              }}
              className="bg-transparent text-white text-sm border border-white/30 rounded px-2 py-1 cursor-pointer hover:bg-white/10"
            >
              {PLAYBACK_SPEEDS.map((speed) => (
                <option key={speed} value={speed} className="bg-apple-gray-800">
                  {speed === 1 ? '1x (正常)' : `${speed}x`}
                </option>
              ))}
            </select>
            
            {/* 字幕选择按钮 */}
            <button
              onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
              className={`p-2 hover:bg-white/20 rounded-full transition-colors ${currentSubtitle?.type !== 'none' && currentSubtitle ? 'text-apple-blue' : 'text-white'}`}
              title="字幕 (S)"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z"/>
              </svg>
            </button>

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
