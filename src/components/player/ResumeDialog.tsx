import React from 'react';

interface ResumeDialogProps {
  title: string;
  progress: number;
  currentTime: number;
  duration: number;
  onResume: () => void;
  onStartOver: () => void;
  onClose: () => void;
}

export const ResumeDialog: React.FC<ResumeDialogProps> = ({
  title,
  progress,
  currentTime,
  duration,
  onResume,
  onStartOver,
  onClose,
}) => {
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-apple-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-apple-gray-700">
        {/* 标题 */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-apple-blue/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-apple-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">继续播放</h2>
          <p className="text-apple-gray-400 text-sm line-clamp-2">{title}</p>
        </div>

        {/* 进度信息 */}
        <div className="bg-apple-gray-900 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-apple-gray-400 text-sm">播放进度</span>
            <span className="text-apple-blue font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-apple-gray-700 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-gradient-to-r from-apple-blue to-apple-purple rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-apple-gray-500">
            <span>已观看: {formatTime(currentTime)}</span>
            <span>总时长: {formatTime(duration)}</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={onStartOver}
            className="flex-1 py-3 px-4 bg-apple-gray-700 hover:bg-apple-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            从头开始
          </button>
          <button
            onClick={onResume}
            className="flex-1 py-3 px-4 bg-apple-blue hover:bg-apple-blue/80 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            继续播放
          </button>
        </div>

        {/* 取消按钮 */}
        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-apple-gray-500 hover:text-apple-gray-300 text-sm transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
};
