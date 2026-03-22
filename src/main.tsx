import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// 启动性能监控
const startupStart = performance.now();

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-apple-black">
        <div className="text-white text-xl">加载中...</div>
      </div>
    }>
      <App />
    </Suspense>
  </React.StrictMode>
);

// 执行预加载
preloadCriticalResources();

// 记录启动时间
const startupTime = performance.now() - startupStart;
console.log(`[MovieCode] 启动耗时: ${startupTime.toFixed(2)}ms`);
