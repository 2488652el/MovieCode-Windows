# MovieCode - Windows 媒体中心应用

<div align="center">
  <img src="public/logo.png" alt="MovieCode Logo" width="180" />

  **一款专为 Windows 设计的本地媒体中心，支持 NAS 连接、海报墙浏览和 TMDB 元数据增强。**

  [English](./README.md) | 简体中文

  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Tauri](https://img.shields.io/badge/Tauri-2.0-green.svg)](https://tauri.app/)
  [![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
  [![Version](https://img.shields.io/badge/Version-2.2.0-blue.svg)](https://github.com/2488652el/MovieCode-Windows/releases)
  [![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=flat-square&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/2488652el/MovieCode-Windows)
</div>

---

## ✨ 功能特性

| 功能 | 描述 |
|------|------|
| 🎬 **海报墙浏览** | Apple TV 风格的精美海报墙展示 |
| 📡 **NAS 连接** | 支持 SMB、NFS、WebDAV、本地目录多种协议 |
| 🔍 **智能扫描** | 自动识别电影、电视剧、动漫 |
| 🎥 **TMDB 增强** | 海报、剧照、演员、评分等丰富元数据 (7天缓存) |
| ▶️ **内置播放** | 支持多种格式的本地/网络视频播放，8级倍速 |
| 📱 **响应式设计** | 适配不同屏幕尺寸 |
| ⭐ **个性化推荐** | 基于观看历史推荐相似内容 |
| 👨‍👩‍👧 **家长控制** | PIN 码保护、年龄分级过滤 |
| 📥 **离线下载** | 下载管理、进度跟踪、暂停/继续 |
| 🌙 **暗黑模式** | 自动定时切换深色主题 |
| 📜 **播放历史** | 续播提示、历史记录管理 |
| 🚀 **性能优化** | 懒加载、图片缓存、快速启动 |
| 🌐 **Plex/Emby 连接** | 连接现有媒体服务器 |
| 📡 **DLNA 投屏** | 推送到局域网内的智能电视/音箱 |
| 👥 **多用户支持** | 家庭成员独立配置 |
| ⭐ **收藏夹** | 标记喜爱的影片 |
| 📋 **播放列表** | 创建自定义播放列表 |
| 📊 **观看统计** | 每日/每周观看时长统计 |

## 🚀 v2.2.0 新功能

### Sprint 10: 用户增强
- 👥 多用户支持 - 家庭成员独立配置
- ⭐ 收藏夹 - 标记喜爱的影片，支持添加笔记
- 📋 播放列表 - 创建自定义播放列表，支持拖拽排序
- 📊 观看统计 - 每日/每周观看时长统计，最爱榜单

### Sprint 9: 生态扩展
- 🌐 Plex/Emby 连接器 - 连接现有的 Plex、Emby、Jellyfin 服务器
- 📡 WebDAV 增强 - 双向同步，递归媒体文件扫描
- 📺 DLNA 投屏 - 发现并投送到局域网内的智能电视/音箱

### Sprint 8: 跨平台支持
- 🍎 macOS 支持 - Tauri 多平台构建
- 🐧 Linux 支持 - AppImage/deb/rpm 打包
- 📱 Android 手机适配 - Phone 产品风味

### Sprint 7: 性能优化
- 🚀 启动优化 - 冷启动 < 3秒
- 🖼️ 海报懒加载 - IntersectionObserver 视口检测
- 💾 图片缓存 - IndexedDB + 内存缓存混合
- ⚡ 预连接 - 关键域名预连接

## 🎨 界面预览

| 首页海报墙 | 详情页面 |
|:---------:|:-------:|
| ![Home](public/screenshot-home.png) | ![Player](public/screenshot-player.png) |

### UI 更新亮点

- **Hero 轮播** - 自动轮播 + 手动切换
- **分类 Tab 筛选** - 推荐 / 电影 / 电视剧 / 动漫
- **渐变色彩系统** - 蓝紫渐变主题
- **玻璃态导航栏** - backdrop-filter 毛玻璃效果
- **焦点动画** - 1.08x 缩放 + 弹性动效

## 🚀 快速开始

### 前置要求

- Windows 10/11 (x64)
- WebView2 运行时（Win11 自带，Win10 会自动提示安装）

### 安装方式

**方式一：一键安装（推荐）**

[![Download](https://img.shields.io/badge/Download-NSIS_Installer-blue.svg)](https://github.com/2488652el/MovieCode-Windows/releases/latest)

**方式二：MSI 安装包**
```bash
# 下载 MSI 文件并双击安装
```

**方式三：便携版**
```bash
# 直接运行可执行文件
MovieCode.exe
```

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/2488652el/MovieCode-Windows.git
cd MovieCode-Windows

# 安装依赖
npm install

# 开发模式
npm run tauri dev

# 构建发布版本
npm run tauri build

# 多平台构建
npm run tauri:build:all
```

### 配置 TMDB API

1. 访问 [TMDB](https://www.themoviedb.org/settings/api) 注册并获取 API Key（免费）

2. 运行应用 → 设置 → API设置

3. 输入您的 API Key

## 📁 项目结构

```
MovieCode-Windows/
├── src/                      # React 前端源码
│   ├── components/           # UI 组件
│   │   ├── layout/           # 布局组件
│   │   ├── home/             # 海报墙组件
│   │   ├── player/           # 播放器组件
│   │   ├── settings/         # 设置组件
│   │   └── downloads/        # 下载组件
│   ├── pages/                # 页面
│   ├── stores/               # Zustand 状态管理
│   │   ├── userStore.ts     # 多用户/收藏/播放列表/统计
│   │   └── *.ts             # 其他 Store
│   ├── services/             # 服务
│   │   ├── api/              # TMDB API 服务
│   │   ├── mediaServer.ts    # Plex/Emby 连接器
│   │   ├── dlna.ts           # DLNA 投屏服务
│   │   ├── webdav.ts         # WebDAV 服务
│   │   └── imageCache.ts     # 图片缓存服务
│   └── types/                # TypeScript 类型定义
├── src-tauri/                # Rust 后端源码
│   └── src/
│       ├── media.rs          # 媒体扫描
│       └── nas.rs            # NAS 连接
├── public/                   # 静态资源
└── dist/                     # 构建输出
```

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 桌面框架 | [Tauri v2](https://tauri.app/) |
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite |
| 状态管理 | Zustand |
| 样式方案 | Tailwind CSS (Apple TV 风格) |
| 后端语言 | Rust |
| 元数据 | TMDB API |

## 📋 更新日志

### v2.2.0 (2026-03-22)
- ✨ Sprint 10: 多用户支持、收藏夹、播放列表、观看统计
- ✨ Sprint 9: Plex/Emby 连接、WebDAV 增强、DLNA 投屏
- ✨ Sprint 8: macOS/Linux/Android 多平台支持
- ✨ Sprint 7: 性能优化（懒加载、图片缓存、快速启动）

### v2.1.0 (2026-03-22)
- ✨ 新增离线下载功能
- ✨ 新增家长控制 (PIN保护/年龄分级)
- ✨ 新增个性化推荐
- ✨ 新增播放历史管理
- ✨ 新增自动暗黑模式

### v2.0.0 (2026-03-22)
- 🎨 全新 UI 设计
- 🚀 Tauri v2 重构
- ⚡ 性能优化

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 🙏 致谢

- [Tauri](https://tauri.app/) - 让桌面应用开发更简单
- [TMDB](https://www.themoviedb.org/) - 提供精彩的影视元数据
- [React](https://react.dev/) - 优秀的前端框架
