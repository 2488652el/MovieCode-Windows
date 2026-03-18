import React from 'react';
import { useNASStore, useScanStore, useSettingsStore } from '@/stores';
import type { NASConnection, ScanConfig } from '@/types';

export const SettingsPanel: React.FC = () => {
  const { connections, addConnection, removeConnection, setActiveConnection } = useNASStore();
  const { configs, addConfig, removeConfig } = useScanStore();
  const { settings, updateSettings } = useSettingsStore();

  const [activeSection, setActiveSection] = React.useState<'nas' | 'scan' | 'api' | 'about'>('nas');
  const [showAddNAS, setShowAddNAS] = React.useState(false);
  const [newNAS, setNewNAS] = React.useState<Partial<NASConnection>>({
    name: '',
    type: 'smb',
    host: '',
    port: 445,
    share: '',
    username: '',
    password: '',
  });

  const handleAddNAS = () => {
    if (!newNAS.name || !newNAS.host) return;
    
    const nas: NASConnection = {
      id: crypto.randomUUID(),
      name: newNAS.name!,
      type: newNAS.type as NASConnection['type'],
      host: newNAS.host,
      port: newNAS.port,
      share: newNAS.share,
      username: newNAS.username,
      password: newNAS.password,
      isConnected: false,
    };
    
    addConnection(nas);
    setShowAddNAS(false);
    setNewNAS({ name: '', type: 'smb', host: '', port: 445, share: '', username: '', password: '' });
  };

  const sections = [
    { id: 'nas', label: 'NAS连接', icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6' },
    { id: 'scan', label: '媒体扫描', icon: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12' },
    { id: 'api', label: 'API设置', icon: 'M15 7h2a5 5 0 015 5 5 5 0 01-5 5h-2 M9 17H7a5 5 0 01-5-5 5 5 0 015-5h2 M15 7a7 7 0 00-7 7 7 7 0 007 7 7 7 0 007-7 7 7 0 00-7-7z' },
    { id: 'about', label: '关于', icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 16v-4 M12 8h.01' },
  ];

  return (
    <div className="h-full flex">
      {/* 侧边栏 */}
      <div className="w-56 glass border-r border-white/10 p-4">
        <h2 className="text-lg font-semibold text-white mb-6 px-2">设置</h2>
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as typeof activeSection)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeSection === section.id
                  ? 'bg-apple-blue/20 text-apple-blue'
                  : 'text-apple-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={section.icon} />
              </svg>
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 内容区 */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeSection === 'nas' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">NAS 连接管理</h3>
              <button
                onClick={() => setShowAddNAS(true)}
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加NAS
              </button>
            </div>

            {connections.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-apple-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" />
                </svg>
                <p className="text-apple-gray-400 mb-4">还没有添加任何NAS连接</p>
                <button onClick={() => setShowAddNAS(true)} className="btn-secondary">
                  添加第一个NAS
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {connections.map((nas) => (
                  <div key={nas.id} className="glass rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${nas.isConnected ? 'bg-apple-green' : 'bg-apple-gray-500'}`} />
                      <div>
                        <h4 className="text-white font-medium">{nas.name}</h4>
                        <p className="text-apple-gray-400 text-sm">
                          {nas.type.toUpperCase()} • {nas.host}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveConnection(nas.id)}
                        className="px-4 py-2 bg-apple-blue/20 text-apple-blue rounded-lg text-sm hover:bg-apple-blue/30"
                      >
                        连接
                      </button>
                      <button
                        onClick={() => removeConnection(nas.id)}
                        className="p-2 text-apple-red hover:bg-white/10 rounded-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 添加NAS弹窗 */}
            {showAddNAS && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="glass rounded-2xl p-6 w-full max-w-md">
                  <h4 className="text-lg font-semibold text-white mb-6">添加 NAS 连接</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-apple-gray-300 mb-2">名称</label>
                      <input
                        type="text"
                        value={newNAS.name}
                        onChange={(e) => setNewNAS({ ...newNAS, name: e.target.value })}
                        placeholder="我的NAS"
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-apple-gray-300 mb-2">类型</label>
                      <select
                        value={newNAS.type}
                        onChange={(e) => setNewNAS({ ...newNAS, type: e.target.value as NASConnection['type'] })}
                        className="input-field"
                      >
                        <option value="smb">SMB/CIFS</option>
                        <option value="nfs">NFS</option>
                        <option value="webdav">WebDAV</option>
                        <option value="local">本地目录</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-apple-gray-300 mb-2">主机地址</label>
                        <input
                          type="text"
                          value={newNAS.host}
                          onChange={(e) => setNewNAS({ ...newNAS, host: e.target.value })}
                          placeholder="192.168.1.100"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-apple-gray-300 mb-2">端口</label>
                        <input
                          type="number"
                          value={newNAS.port}
                          onChange={(e) => setNewNAS({ ...newNAS, port: parseInt(e.target.value) })}
                          className="input-field"
                        />
                      </div>
                    </div>

                    {newNAS.type !== 'local' && (
                      <>
                        <div>
                          <label className="block text-sm text-apple-gray-300 mb-2">共享文件夹</label>
                          <input
                            type="text"
                            value={newNAS.share}
                            onChange={(e) => setNewNAS({ ...newNAS, share: e.target.value })}
                            placeholder="/movies"
                            className="input-field"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-apple-gray-300 mb-2">用户名</label>
                            <input
                              type="text"
                              value={newNAS.username}
                              onChange={(e) => setNewNAS({ ...newNAS, username: e.target.value })}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-apple-gray-300 mb-2">密码</label>
                            <input
                              type="password"
                              value={newNAS.password}
                              onChange={(e) => setNewNAS({ ...newNAS, password: e.target.value })}
                              className="input-field"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setShowAddNAS(false)} className="btn-secondary">
                      取消
                    </button>
                    <button onClick={handleAddNAS} className="btn-primary">
                      添加
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'api' && (
          <div>
            <h3 className="text-xl font-semibold text-white mb-6">API 设置</h3>
            <div className="glass rounded-xl p-6 max-w-lg">
              <div className="mb-6">
                <label className="block text-sm text-apple-gray-300 mb-2">TMDB API Key</label>
                <input
                  type="text"
                  value={settings.tmdbApiKey}
                  onChange={(e) => updateSettings({ tmdbApiKey: e.target.value })}
                  placeholder="请输入TMDB API密钥"
                  className="input-field"
                />
                <p className="text-apple-gray-500 text-xs mt-2">
                  请从 <a href="https://www.themoviedb.org/settings/api" target="_blank" className="text-apple-blue hover:underline">TMDB官网</a> 获取API密钥
                </p>
              </div>
              
              <div>
                <label className="block text-sm text-apple-gray-300 mb-2">界面语言</label>
                <select
                  value={settings.language}
                  onChange={(e) => updateSettings({ language: e.target.value })}
                  className="input-field"
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="zh-TW">繁体中文</option>
                  <option value="en-US">English</option>
                  <option value="ja-JP">日本語</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'scan' && (
          <div>
            <h3 className="text-xl font-semibold text-white mb-6">媒体扫描设置</h3>
            <div className="glass rounded-xl p-6 max-w-lg">
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.scanOnStartup}
                    onChange={(e) => updateSettings({ scanOnStartup: e.target.checked })}
                    className="w-5 h-5 rounded accent-apple-blue"
                  />
                  <span className="text-white">启动时自动扫描</span>
                </label>
                
                <div>
                  <label className="block text-sm text-apple-gray-300 mb-2">默认媒体类型</label>
                  <select
                    value={settings.defaultMediaType}
                    onChange={(e) => updateSettings({ defaultMediaType: e.target.value as 'movie' | 'tv' | 'anime' })}
                    className="input-field"
                  >
                    <option value="movie">电影</option>
                    <option value="tv">电视剧</option>
                    <option value="anime">动漫</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'about' && (
          <div>
            <h3 className="text-xl font-semibold text-white mb-6">关于 MovieCode</h3>
            <div className="glass rounded-xl p-8 text-center max-w-lg">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-apple-blue to-apple-purple flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <h4 className="text-2xl font-bold text-white mb-2">MovieCode</h4>
              <p className="text-apple-gray-400 mb-4">版本 1.0.0</p>
              <p className="text-apple-gray-300 text-sm leading-relaxed">
                MovieCode 是一款专为Windows设计的本地媒体中心应用，
                支持连接NAS、扫描本地媒体、TMDB元数据增强，
                以及流畅的Apple TV风格海报墙体验。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
