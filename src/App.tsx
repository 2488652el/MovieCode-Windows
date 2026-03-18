import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { PlayerPage } from '@/pages/PlayerPage';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { useUIStore, usePlayerStore, useSettingsStore } from '@/stores';
import type { MediaItem } from '@/types';

type View = 'home' | 'player' | 'settings';

export const App: React.FC = () => {
  const { currentTab, setCurrentTab } = useUIStore();
  const { currentMedia, setCurrentMedia } = usePlayerStore();
  const [view, setView] = useState<View>('home');

  const handleItemSelect = (item: MediaItem) => {
    setCurrentMedia(item);
    setView('player');
  };

  const handleBack = () => {
    setCurrentMedia(null);
    setView('home');
  };

  // 同步Tab和View
  React.useEffect(() => {
    if (currentTab === 'settings' && view !== 'player') {
      setView('settings');
    } else if (currentTab === 'home' && view === 'settings') {
      setView('home');
    }
  }, [currentTab]);

  // 检查API Key
  const { settings } = useSettingsStore();
  const showApiWarning = !settings.tmdbApiKey;

  return (
    <Layout>
      {view === 'home' && (
        <HomePage onItemSelect={handleItemSelect} />
      )}
      {view === 'player' && (
        <PlayerPage onBack={handleBack} />
      )}
      {view === 'settings' && (
        <SettingsPanel />
      )}
      
      {/* API Key警告提示 */}
      {showApiWarning && view === 'home' && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 glass rounded-xl p-4 flex items-start gap-3 z-50">
          <div className="w-10 h-10 rounded-full bg-apple-yellow/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-apple-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-white font-medium mb-1">TMDB API Key 未设置</h4>
            <p className="text-apple-gray-400 text-sm mb-2">
              为了获得完整的媒体信息和海报，请设置TMDB API Key。
            </p>
            <button
              onClick={() => {
                setCurrentTab('settings');
                setView('settings');
              }}
              className="text-apple-blue text-sm hover:underline"
            >
              前往设置
            </button>
          </div>
          <button
            onClick={() => {}}
            className="text-apple-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </Layout>
  );
};

export default App;
