# MovieCode - Windows 媒体中心应用

<div align="center">
  <img src="public/logo.png" alt="MovieCode Logo" width="180" />

  **一款专为 Windows 设计的本地媒体中心，支持 NAS 连接、海报墙浏览和 TMDB 元数据增强。**

  [English](./README.md) | 简体中文

  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Tauri](https://img.shields.io/badge/Tauri-2.0-green.svg)](https://tauri.app/)
  [![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
  [![Version](https://img.shields.io/badge/Version-2.0.0-blue.svg)](https://github.com/2488652el/MovieCode-Windows/releases)
</div>

---

## ✨ 功能特性

- 🎬 **海报墙浏览** - Apple TV 风格的精美海报墙展示
- 📡 **NAS 连接** - 支持 SMB、NFS、WebDAV、本地目录多种协议
- 🔍 **智能扫描** - 自动识别电影、电视剧、动漫
- 🎥 **TMDB 增强** - 海报、剧照、演员、评分等丰富元数据
- ▶️ **内置播放** - 支持多种格式的本地/网络视频播放
- 📱 **响应式设计** - 适配不同屏幕尺寸

## 🎨 界面预览

| 首页海报墙 | 详情页面 |
|:---------:|:-------:|
| ![Home](public/screenshot-home.png) | ![Player](public/screenshot-player.png) |

### v2.0.0 UI 更新亮点

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

**方式一：安装包（推荐）**

[![Download](https://img.shields.io/badge/Download-NSIS_Installer-blue.svg)](https://github.com/2488652el/MovieCode-Windows/releases/download/v2.0.0/MovieCode_2.0.0_x64-setup.exe)
[![Download](https://img.shields.io/badge/Download-MSI_Installer-blue.svg)](https://github.com/2488652el/MovieCode-Windows/releases/download/v2.0.0/MovieCode_2.0.0_x64_en-US.msi)

**方式二：便携版**
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
│   │   └── settings/         # 设置组件
│   ├── pages/                # 页面
│   ├── stores/               # Zustand 状态管理
│   ├── services/api/         # TMDB API 服务
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

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 🙏 致谢

- [Tauri](https://tauri.app/) - 让桌面应用开发更简单
- [TMDB](https://www.themoviedb.org/) - 提供精彩的影视元数据
- [React](https://react.dev/) - 优秀的前端框架
