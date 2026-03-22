import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MediaItem } from '@/types';

// 下载状态
export type DownloadStatus = 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled';

// 下载任务
export interface DownloadTask {
  id: string;
  mediaItem: MediaItem;
  episodeNumber?: number;
  seasonNumber?: number;
  url: string;
  fileName: string;
  filePath: string;
  totalBytes: number;
  downloadedBytes: number;
  status: DownloadStatus;
  progress: number;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  createdAt: number;
  retryCount: number;
}

// 下载管理 Store
interface DownloadStore {
  tasks: DownloadTask[];
  maxConcurrent: number;
  downloadPath: string;
  
  // 添加下载任务
  addTask: (task: Omit<DownloadTask, 'id' | 'status' | 'progress' | 'downloadedBytes' | 'createdAt' | 'retryCount'>) => string;
  
  // 移除任务
  removeTask: (id: string) => void;
  
  // 更新任务进度
  updateProgress: (id: string, downloadedBytes: number, totalBytes?: number) => void;
  
  // 更新任务状态
  updateStatus: (id: string, status: DownloadStatus, error?: string) => void;
  
  // 暂停任务
  pauseTask: (id: string) => void;
  
  // 恢复任务
  resumeTask: (id: string) => void;
  
  // 取消任务
  cancelTask: (id: string) => void;
  
  // 重试任务
  retryTask: (id: string) => void;
  
  // 清空已完成任务
  clearCompleted: () => void;
  
  // 清空所有任务
  clearAll: () => void;
  
  // 获取任务
  getTask: (id: string) => DownloadTask | undefined;
  
  // 获取任务列表
  getTasksByStatus: (status: DownloadStatus) => DownloadTask[];
  
  // 获取正在下载的任务
  getActiveTasks: () => DownloadTask[];
  
  // 设置最大并发数
  setMaxConcurrent: (max: number) => void;
  
  // 设置下载路径
  setDownloadPath: (path: string) => void;
  
  // 计算总进度
  getTotalProgress: () => { total: number; completed: number; speed: number };
}

export const useDownloadStore = create<DownloadStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      maxConcurrent: 2,
      downloadPath: '',
      
      addTask: (taskData) => {
        const id = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const task: DownloadTask = {
          ...taskData,
          id,
          status: 'pending',
          progress: 0,
          downloadedBytes: 0,
          createdAt: Date.now(),
          retryCount: 0,
        };
        set((state) => ({
          tasks: [...state.tasks, task],
        }));
        return id;
      },
      
      removeTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      })),
      
      updateProgress: (id, downloadedBytes, totalBytes) => set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id !== id) return t;
          const newTotal = totalBytes ?? t.totalBytes;
          const progress = newTotal > 0 ? (downloadedBytes / newTotal) * 100 : 0;
          return {
            ...t,
            downloadedBytes,
            totalBytes: newTotal,
            progress: Math.min(progress, 100),
            startedAt: t.startedAt ?? Date.now(),
          };
        }),
      })),
      
      updateStatus: (id, status, error) => set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id !== id) return t;
          return {
            ...t,
            status,
            error,
            startedAt: status === 'downloading' ? (t.startedAt ?? Date.now()) : t.startedAt,
            completedAt: status === 'completed' ? Date.now() : t.completedAt,
            retryCount: status === 'failed' ? t.retryCount + 1 : t.retryCount,
          };
        }),
      })),
      
      pauseTask: (id) => set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id && t.status === 'downloading' ? { ...t, status: 'paused' as DownloadStatus } : t
        ),
      })),
      
      resumeTask: (id) => set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id && t.status === 'paused' ? { ...t, status: 'pending' as DownloadStatus } : t
        ),
      })),
      
      cancelTask: (id) => set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id && (t.status === 'downloading' || t.status === 'paused' || t.status === 'pending')
            ? { ...t, status: 'cancelled' as DownloadStatus }
            : t
        ),
      })),
      
      retryTask: (id) => set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id
            ? { ...t, status: 'pending' as DownloadStatus, error: undefined, retryCount: 0 }
            : t
        ),
      })),
      
      clearCompleted: () => set((state) => ({
        tasks: state.tasks.filter((t) => t.status !== 'completed'),
      })),
      
      clearAll: () => set({ tasks: [] }),
      
      getTask: (id) => get().tasks.find((t) => t.id === id),
      
      getTasksByStatus: (status) => get().tasks.filter((t) => t.status === status),
      
      getActiveTasks: () => get().tasks.filter((t) =>
        t.status === 'downloading' || t.status === 'pending'
      ),
      
      setMaxConcurrent: (max) => set({ maxConcurrent: max }),
      
      setDownloadPath: (path) => set({ downloadPath: path }),
      
      getTotalProgress: () => {
        const tasks = get().tasks;
        const activeTasks = tasks.filter((t) =>
          t.status === 'downloading' || t.status === 'completed'
        );
        if (activeTasks.length === 0) {
          return { total: 0, completed: 0, speed: 0 };
        }
        const total = activeTasks.reduce((sum, t) => sum + t.totalBytes, 0);
        const downloaded = activeTasks.reduce((sum, t) => sum + t.downloadedBytes, 0);
        const completed = tasks.filter((t) => t.status === 'completed').length;
        return { total, completed, speed: 0 };
      },
    }),
    { name: 'download-store' }
  )
);

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// 格式化下载速度
export function formatSpeed(bytesPerSecond: number): string {
  return `${formatFileSize(bytesPerSecond)}/s`;
}

// 格式化剩余时间
export function formatRemainingTime(remainingBytes: number, speed: number): string {
  if (speed <= 0) return '--';
  const seconds = Math.ceil(remainingBytes / speed);
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分`;
  return `${Math.floor(seconds / 3600)}时${Math.floor((seconds % 3600) / 60)}分`;
}
