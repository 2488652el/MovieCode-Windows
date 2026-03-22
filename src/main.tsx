import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// 启动性能监控
const startupStart = performance.now();

// 代码分割 - 懒加载非首屏组件
const HomePage = lazy(() => import('./pages/HomePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// 预加载关键资源
const preloadCriticalResources = () => {
  // 预连接关键域名
  const domains = [
    'https://image.tmdb.org',
  ];
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// 初始化应用
const initApp = () => {
  // 预加载资源
  preloadCriticalResources();
  
  // 记录启动时间
  console.log(`[Startup] App initialized in ${performance.now() - startupStart}ms`);
};

// 在 DOMContentLoaded 后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// 加载状态组件
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-apple-gray-900">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-apple-blue border-t-transparent rounded-full animate-spin" />
      <span className="text-apple-gray-400 text-sm">加载中...</span>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <App />
    </Suspense>
  </React.StrictMode>
);

// 记录完整渲染时间
window.addEventListener('load', () => {
  console.log(`[Startup] Full app loaded in ${performance.now() - startupStart}ms`);
});
