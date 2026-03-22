import { useState, useEffect } from 'react';
import { useDownloadStore, formatFileSize, formatRemainingTime, type DownloadTask, type DownloadStatus } from '@/stores/downloadStore';

// 下载管理器组件
export default function DownloadManager() {
  const {
    tasks,
    clearCompleted,
    clearAll,
    getTotalProgress,
  } = useDownloadStore();

  const [totalProgress, setTotalProgress] = useState({ total: 0, completed: 0, speed: 0 });

  useEffect(() => {
    setTotalProgress(getTotalProgress());
  }, [tasks, getTotalProgress]);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const activeTasks = tasks.filter((t) => t.status === 'downloading');
  const pausedTasks = tasks.filter((t) => t.status === 'paused');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const failedTasks = tasks.filter((t) => t.status === 'failed' || t.status === 'cancelled');

  return (
    <div className="download-manager">
      {/* 头部 */}
      <div className="manager-header">
        <h2>下载管理</h2>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={clearCompleted}
            disabled={completedTasks.length === 0}
          >
            清空已完成
          </button>
          <button
            className="btn-danger"
            onClick={clearAll}
            disabled={tasks.length === 0}
          >
            清空全部
          </button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">正在下载</span>
          <span className="stat-value">{activeTasks.length + pendingTasks.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">已完成</span>
          <span className="stat-value success">{completedTasks.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">已暂停</span>
          <span className="stat-value warning">{pausedTasks.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">失败</span>
          <span className="stat-value error">{failedTasks.length}</span>
        </div>
      </div>

      {/* 下载列表 */}
      <div className="download-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <p>暂无下载任务</p>
          </div>
        ) : (
          tasks.map((task) => (
            <DownloadItem key={task.id} task={task} />
          ))
        )}
      </div>

      <style>{`
        .download-manager {
          padding: 24px;
          max-width: 900px;
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .manager-header h2 {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary, #fff);
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn-secondary {
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          background: var(--button-bg, rgba(255,255,255,0.1));
          color: var(--text-primary, #fff);
          transition: all 0.2s;
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--button-hover, rgba(255,255,255,0.2));
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-danger {
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          transition: all 0.2s;
        }

        .btn-danger:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.3);
        }

        .btn-danger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .stats-bar {
          display: flex;
          gap: 24px;
          padding: 16px 20px;
          background: var(--card-bg, rgba(255,255,255,0.05));
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: var(--text-secondary, #888);
        }

        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary, #fff);
        }

        .stat-value.success {
          color: #22c55e;
        }

        .stat-value.warning {
          color: #f59e0b;
        }

        .stat-value.error {
          color: #ef4444;
        }

        .download-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: var(--text-secondary, #888);
        }

        .empty-state p {
          margin-top: 16px;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}

// 单个下载项组件
function DownloadItem({ task }: { task: DownloadTask }) {
  const {
    pauseTask,
    resumeTask,
    cancelTask,
    retryTask,
    removeTask,
  } = useDownloadStore();

  const statusConfig: Record<DownloadStatus, { label: string; color: string; icon: string }> = {
    pending: { label: '等待中', color: '#888', icon: '⏳' },
    downloading: { label: '下载中', color: '#3b82f6', icon: '⬇️' },
    paused: { label: '已暂停', color: '#f59e0b', icon: '⏸️' },
    completed: { label: '已完成', color: '#22c55e', icon: '✅' },
    failed: { label: '失败', color: '#ef4444', icon: '❌' },
    cancelled: { label: '已取消', color: '#888', icon: '🚫' },
  };

  const config = statusConfig[task.status];

  return (
    <div className="download-item">
      {/* 海报 */}
      <div className="item-poster">
        {task.mediaItem.posterPath ? (
          <img src={task.mediaItem.posterPath} alt={task.mediaItem.title} />
        ) : (
          <div className="poster-placeholder">
            <span>{task.mediaItem.title.charAt(0)}</span>
          </div>
        )}
      </div>

      {/* 信息 */}
      <div className="item-info">
        <div className="item-header">
          <h3 className="item-title">{task.mediaItem.title}</h3>
          <span className="status-badge" style={{ color: config.color }}>
            {config.icon} {config.label}
          </span>
        </div>

        {task.episodeNumber && (
          <p className="item-episode">
            第{task.seasonNumber}季 第{task.episodeNumber}集
          </p>
        )}

        {/* 进度条 */}
        {(task.status === 'downloading' || task.status === 'paused') && (
          <div className="progress-section">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <div className="progress-info">
              <span>{formatFileSize(task.downloadedBytes)} / {formatFileSize(task.totalBytes)}</span>
              <span>{task.progress.toFixed(1)}%</span>
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {task.error && (
          <p className="error-message">{task.error}</p>
        )}

        {/* 完成信息 */}
        {task.status === 'completed' && task.filePath && (
          <p className="file-path">{task.filePath}</p>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="item-actions">
        {task.status === 'downloading' && (
          <button className="action-btn" onClick={() => pauseTask(task.id)} title="暂停">
            ⏸️
          </button>
        )}
        {task.status === 'paused' && (
          <button className="action-btn" onClick={() => resumeTask(task.id)} title="继续">
            ▶️
          </button>
        )}
        {(task.status === 'downloading' || task.status === 'paused' || task.status === 'pending') && (
          <button className="action-btn" onClick={() => cancelTask(task.id)} title="取消">
            ❌
          </button>
        )}
        {(task.status === 'failed' || task.status === 'cancelled') && (
          <>
            <button className="action-btn" onClick={() => retryTask(task.id)} title="重试">
              🔄
            </button>
            <button className="action-btn" onClick={() => removeTask(task.id)} title="删除">
              🗑️
            </button>
          </>
        )}
        {task.status === 'completed' && (
          <button className="action-btn" onClick={() => removeTask(task.id)} title="删除">
            🗑️
          </button>
        )}
      </div>

      <style>{`
        .download-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: var(--card-bg, rgba(255,255,255,0.05));
          border-radius: 12px;
          transition: background 0.2s;
        }

        .download-item:hover {
          background: var(--card-hover, rgba(255,255,255,0.08));
        }

        .item-poster {
          width: 80px;
          height: 120px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .item-poster img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .poster-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: bold;
          color: white;
        }

        .item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .item-title {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary, #fff);
          margin: 0;
          flex: 1;
        }

        .status-badge {
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
        }

        .item-episode {
          font-size: 13px;
          color: var(--text-secondary, #888);
          margin: 0;
        }

        .progress-section {
          margin-top: 8px;
        }

        .progress-bar {
          height: 6px;
          background: var(--card-hover, rgba(255,255,255,0.1));
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          font-size: 12px;
          color: var(--text-secondary, #888);
        }

        .error-message {
          font-size: 13px;
          color: #ef4444;
          margin: 4px 0 0 0;
        }

        .file-path {
          font-size: 12px;
          color: var(--text-secondary, #888);
          margin: 4px 0 0 0;
          word-break: break-all;
        }

        .item-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }

        .action-btn {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 8px;
          background: var(--card-hover, rgba(255,255,255,0.1));
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn:hover {
          background: var(--button-hover, rgba(255,255,255,0.2));
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
