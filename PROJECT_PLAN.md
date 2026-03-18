# MovieCode - Windows 媒体中心应用

## 项目概述
MovieCode 是一款面向Windows平台的本地媒体管理及播放应用，专注于帮助用户整合局域网NAS与本地硬盘中的电影、电视剧、动漫等多媒体资源，通过海报墙形式呈现，并提供TMDB元数据增强体验。

## 技术栈选型

### 桌面框架：Tauri v2
- **优势**：轻量级（安装包仅10-15MB），性能卓越，内存占用低
- **安全性**：Rust后端，原生系统集成
- **生态**：支持WebView2，与前端生态无缝衔接

### 前端框架
- **React 18** + **TypeScript 5** - 组件化开发，类型安全
- **Vite** - 快速构建工具
- **Tailwind CSS** - 原子化CSS，快速实现Apple TV风格UI

### 主要依赖库
| 功能 | 库选型 | 说明 |
|------|--------|------|
| 状态管理 | Zustand | 轻量级，TypeScript友好 |
| 路由 | React Router v6 | SPA路由管理 |
| 媒体播放 | video.js / 内置H5播放器 | 支持多种格式 |
| 视频流 | Streaming | NAS媒体流式播放 |
| TMDB API | 原生Fetch | 媒体元数据获取 |
| NAS协议 | smb.js / WebDAV | 文件系统访问 |
| 文件扫描 | walkdir (Rust) | 高效目录遍历 |

## 项目架构

```
moviecode/
├── src/                      # React前端源码
│   ├── components/           # UI组件
│   │   ├── layout/           # 布局组件（导航栏、侧边栏）
│   │   ├── home/             # 海报墙相关组件
│   │   ├── player/           # 播放界面组件
│   │   ├── settings/         # 设置页面组件
│   │   └── common/           # 通用组件（海报卡片、加载状态等）
│   ├── pages/                # 页面级组件
│   │   ├── HomePage.tsx      # 主页（海报墙）
│   │   ├── PlayerPage.tsx    # 播放页面
│   │   └── SettingsPage.tsx # 设置页面
│   ├── hooks/                # 自定义Hooks
│   │   ├── useMedia.ts       # 媒体数据Hook
│   │   ├── useTMDB.ts        # TMDB API Hook
│   │   └── useNAS.ts         # NAS连接Hook
│   ├── services/             # 业务服务层
│   │   ├── api/              # TMDB API调用
│   │   ├── nas/              # NAS协议封装
│   │   └── media/            # 媒体扫描服务
│   ├── stores/               # Zustand状态存储
│   ├── types/                # TypeScript类型定义
│   ├── utils/                # 工具函数
│   └── styles/               # 全局样式
├── src-tauri/                # Rust后端源码
│   ├── src/
│   │   ├── main.rs           # 入口文件
│   │   ├── commands/         # Tauri命令
│   │   │   ├── nas.rs        # NAS连接命令
│   │   │   ├── scanner.rs    # 媒体扫描命令
│   │   │   └── media.rs       # 媒体播放命令
│   │   └── utils/            # Rust工具函数
│   ├── Cargo.toml            # Rust依赖
│   └── tauri.conf.json       # Tauri配置
├── public/                   # 静态资源
├── package.json              # Node依赖
├── vite.config.ts           # Vite配置
├── tailwind.config.js       # Tailwind配置
└── tsconfig.json            # TypeScript配置
```

## 功能模块设计

### 1. NAS连接模块
**职责**：管理多源媒体库连接
- **支持的协议**：
  - SMB/CIFS（最常用，适配群晖、威联通等NAS）
  - NFS（Linux NAS常用）
  - WebDAV（远程/云存储）
  - 本地目录直连
- **实现方式**：
  - Rust后端通过 `smb2` / `nfs` 库实现协议通信
  - 前端提供连接向导UI
  - 支持多NAS并行管理

### 2. 媒体扫描模块
**职责**：遍历目录，识别媒体文件
- **扫描策略**：
  - 增量扫描：首次全量，后续监听变更
  - 目录过滤：用户可配置排除规则
  - 并行扫描：多线程提升大目录扫描效率
- **媒体识别**：
  - 文件名解析：提取标题、年份、季/集号
  - 模糊匹配：通过TMDB API精确匹配
  - 缓存机制：本地SQLite存储元数据

### 3. TMDB集成模块
**职责**：获取权威媒体元数据
- **电影信息**：海报、背景图、简介、评分、演员、导演、类型
- **电视剧信息**：季/集列表、每集简介、收视率
- **动漫信息**：通过TMDB动漫分类或AniDB补充
- **数据缓存**：本地缓存减少API调用

### 4. 前端界面模块

#### 4.1 海报墙主页（Apple TV风格）
- **视觉特点**：
  - 毛玻璃背景（backdrop模糊）
  - 海报卡片悬浮高亮放大效果
  - 流畅的焦点导航（键盘/鼠标）
  - 深色主题，减少视觉疲劳
- **布局**：
  - 横向分类滚动行（电影/剧集/动漫/最近添加）
  - 响应式网格适配不同分辨率

#### 4.2 播放界面
- **组件**：
  - 视频播放器（支持字幕、音轨切换）
  - 选集列表（季/集导航）
  - 媒体详情卡（剧情简介、演员表、评分）
  - 相关推荐
- **交互**：
  - 鼠标/键盘双导航支持
  - 全屏/小窗模式切换
  - 播放进度记忆

#### 4.3 设置页面
- **Tab分类**：
  - NAS管理：添加/编辑/删除连接
  - 媒体库：扫描路径、排除规则
  - 播放设置：默认画质、字幕语言
  - 外观：主题、字体大小
  - 关于：版本信息、检查更新

## 数据流设计

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   NAS/本地   │────▶│  Rust后端    │────▶│  SQLite DB  │
│   文件系统   │     │  (扫描/连接)  │     │  (元数据)   │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                           │ IPC (Tauri Commands)
                           ▼
                    ┌──────────────┐
                    │  React前端   │
                    │  (状态/UI)   │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐    ┌────────────┐   ┌──────────┐
    │ TMDB API │    │  媒体播放   │   │ 用户配置  │
    │ (元数据)  │    │  (流媒体)  │   │ (Zustand)│
    └──────────┘    └────────────┘   └──────────┘
```

## 关键技术难点及解决方案

### 1. NAS大文件流式播放
**问题**：SMB协议直接播放大文件可能卡顿
**方案**：
- Rust后端实现SMB直连读取
- 支持HTTP分段传输（Range请求）
- 前端video标签支持Blob URL流播放
- 可选：本地缓存当前播放片段

### 2. 海报墙性能优化
**问题**：数千张海报图片加载慢
**方案**：
- 懒加载（Intersection Observer）
- 瀑布流占位骨架屏
- 图片CDN代理压缩（TMDb提供多种尺寸）
- 虚拟列表（react-window）应对长列表

### 3. 媒体识别准确率
**问题**：文件名格式不统一导致识别错误
**方案**：
- 多种命名规则适配器
- 多级模糊匹配（年份>标题>类型）
- 用户可手动校正匹配结果
- 学习用户修正习惯

## 开发计划

### Phase 1：项目基础（预计1-2天）
- [x] 项目初始化（Tauri + React + TypeScript）
- [ ] Tailwind CSS配置与Apple TV风格设计系统
- [ ] 基础布局组件（导航栏、页面框架）

### Phase 2：NAS连接（预计2-3天）
- [ ] Rust SMB连接实现
- [ ] 前端连接配置UI
- [ ] 连接状态管理

### Phase 3：媒体扫描（预计2-3天）
- [ ] Rust目录扫描实现
- [ ] 媒体文件识别逻辑
- [ ] SQLite元数据存储

### Phase 4：TMDB集成（预计1-2天）
- [ ] TMDB API封装
- [ ] 海报/背景图获取
- [ ] 搜索与匹配逻辑

### Phase 5：前端界面（预计3-5天）
- [ ] 海报墙组件开发
- [ ] 播放页面开发
- [ ] 设置页面开发

### Phase 6：测试与优化（预计2-3天）
- [ ] 功能测试
- [ ] 性能优化
- [ ] Windows打包发布

## 安装包规格
- **目标平台**：Windows 10/11 (x64)
- **安装包大小**：~15MB（相比Electron的150MB+）
- **运行时依赖**：WebView2（Win11自带，Win10自动安装）
- **安装方式**：NSIS安装程序或MSI

## 参考资源
- [Tauri官方文档](https://tauri.app/)
- [TMDB API文档](https://developers.themoviedb.org/)
- [Apple TV UI参考](https://developer.apple.com/design/human-interface-guidelines/foundations/motion/)
