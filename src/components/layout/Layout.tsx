import React, { useState } from 'react';
import { useUIStore } from '@/stores';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentTab, setCurrentTab } = useUIStore();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div className="h-full w-full flex flex-col bg-apple-gray-900">
      {/* 顶部导航栏 - 玻璃态效果 */}
      <header className="h-16 flex items-center justify-between px-6 glass-strong border-b border-white/5 relative z-50">
        {/* Logo区域 */}
        <div className="flex items-center gap-3">
          {/* Logo图标 */}
          <div className="relative group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:shadow-blue-glow">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            {/* Logo光晕效果 */}
            <div className="absolute inset-0 rounded-xl gradient-primary opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-300" />
          </div>

          {/* Logo文字 */}
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gradient leading-none">MovieCode</span>
            <span className="text-[10px] text-apple-gray-500 tracking-wider">MEDIA CENTER</span>
          </div>
        </div>

        {/* 导航Tab - 玻璃态按钮组 */}
        <nav className="flex items-center gap-1 bg-apple-gray-800/50 backdrop-blur-sm rounded-2xl p-1.5">
          <button
            onClick={() => setCurrentTab('home')}
            className={`nav-tab ${currentTab === 'home' ? 'active' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>媒体库</span>
          </button>
          <button
            onClick={() => setCurrentTab('settings')}
            className={`nav-tab ${currentTab === 'settings' ? 'active' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>设置</span>
          </button>
        </nav>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-3">
          {/* 快捷键提示 */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-apple-gray-800/50 rounded-lg">
            <kbd className="px-1.5 py-0.5 bg-apple-gray-700 rounded text-xs text-apple-gray-400">⌘</kbd>
            <kbd className="px-1.5 py-0.5 bg-apple-gray-700 rounded text-xs text-apple-gray-400">K</kbd>
            <span className="text-xs text-apple-gray-500 ml-1">搜索</span>
          </div>

          {/* 通知按钮 */}
          <button className="relative p-2.5 rounded-xl hover:bg-apple-gray-800/50 transition-colors group">
            <svg className="w-5 h-5 text-apple-gray-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {/* 通知红点 */}
            <span className="absolute top-2 right-2 w-2 h-2 bg-apple-red rounded-full" />
          </button>

          {/* 用户头像 */}
          <button className="relative group">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white font-semibold text-sm shadow-lg transition-transform duration-300 group-hover:scale-105">
              U
            </div>
            {/* 用户光晕 */}
            <div className="absolute inset-0 rounded-xl gradient-primary opacity-0 group-hover:opacity-50 blur-lg transition-opacity duration-300 -z-10" />
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* 全局样式注入 - 导航Tab样式 */}
      <style>{`
        .nav-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #8e8e93;
          background: transparent;
          border: none;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .nav-tab:hover {
          color: #f5f5f7;
          background: rgba(255, 255, 255, 0.05);
        }

        .nav-tab.active {
          color: #ffffff;
          background: linear-gradient(135deg, rgba(10, 132, 255, 0.4) 0%, rgba(94, 92, 230, 0.4) 100%);
          box-shadow:
            0 4px 12px rgba(10, 132, 255, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .shadow-blue-glow {
          box-shadow: 0 4px 20px rgba(10, 132, 255, 0.4);
        }
      `}</style>
    </div>
  );
};
