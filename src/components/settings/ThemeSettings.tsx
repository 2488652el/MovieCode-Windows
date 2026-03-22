import React, { useEffect } from 'react';
import { useThemeStore } from '@/stores';
import type { ThemeMode } from '@/types';

export const ThemeSettings: React.FC = () => {
  const { settings, isDark, setThemeMode, setAutoDarkTime, updateIsDark } = useThemeStore();

  // 启动时检查是否需要切换主题
  useEffect(() => {
    if (settings.mode === 'system') {
      updateIsDark();
    }
  }, []);

  const themeModes: { value: ThemeMode; label: string; icon: JSX.Element }[] = [
    {
      value: 'dark',
      label: '深色',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
    },
    {
      value: 'light',
      label: '浅色',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      value: 'system',
      label: '跟随系统',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setAutoDarkTime(value, settings.autoDarkEnd);
    } else {
      setAutoDarkTime(settings.autoDarkStart, value);
    }
  };

  return (
    <div className="space-y-6">
      {/* 主题模式选择 */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">主题模式</h3>
        <div className="grid grid-cols-3 gap-3">
          {themeModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setThemeMode(mode.value)}
              className={`p-4 rounded-xl border-2 transition-all ${
                settings.mode === mode.value
                  ? 'border-apple-blue bg-apple-blue/10'
                  : 'border-apple-gray-700 bg-apple-gray-800 hover:border-apple-gray-600'
              }`}
            >
              <div className={`mx-auto mb-2 ${
                settings.mode === mode.value ? 'text-apple-blue' : 'text-apple-gray-400'
              }`}>
                {mode.icon}
              </div>
              <p className={`text-sm font-medium ${
                settings.mode === mode.value ? 'text-white' : 'text-apple-gray-300'
              }`}>
                {mode.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 自动暗黑模式时间设置 */}
      {settings.mode === 'system' && (
        <div>
          <h3 className="text-lg font-medium text-white mb-4">自动暗黑时间</h3>
          <p className="text-apple-gray-400 text-sm mb-4">
            在指定时间段内自动切换到深色模式
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm text-apple-gray-400 mb-2">开始时间</label>
              <input
                type="time"
                value={settings.autoDarkStart}
                onChange={(e) => handleTimeChange('start', e.target.value)}
                className="w-full px-4 py-2 bg-apple-gray-800 border border-apple-gray-700 rounded-lg text-white focus:outline-none focus:border-apple-blue"
              />
            </div>
            <div className="text-apple-gray-500 mt-6">—</div>
            <div className="flex-1">
              <label className="block text-sm text-apple-gray-400 mb-2">结束时间</label>
              <input
                type="time"
                value={settings.autoDarkEnd}
                onChange={(e) => handleTimeChange('end', e.target.value)}
                className="w-full px-4 py-2 bg-apple-gray-800 border border-apple-gray-700 rounded-lg text-white focus:outline-none focus:border-apple-blue"
              />
            </div>
          </div>
          <p className="text-apple-gray-500 text-xs mt-2">
            示例: 22:00 - 06:00 表示晚上10点到次日早上6点使用深色模式
          </p>
        </div>
      )}

      {/* 预览 */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">预览</h3>
        <div className={`p-6 rounded-xl border ${
          isDark 
            ? 'bg-apple-gray-900 border-apple-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${
                isDark ? 'bg-apple-blue' : 'bg-blue-500'
              }`} />
              <span>主题预览</span>
            </div>
            <p className={isDark ? 'text-apple-gray-400' : 'text-gray-500'}>
              当前主题: {isDark ? '深色模式' : '浅色模式'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
