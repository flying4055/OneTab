# OneTab 项目上下文文档

## 项目概述

**OneTab** 是一个高度可定制、极简风格的浏览器新标签页导航扩展（Chrome/Edge MV3 架构），基于 **React 19 + Material-UI v7 + Vite 5 + Zustand** 构建。项目提供沉浸式的书签检索与管理体验，所有数据本地存储于 `localStorage`，确保隐私安全。

### 核心功能

| 功能 | 说明 |
|------|------|
| **书签管理** | 支持新增、编辑、删除书签，自定义图标/背景色/文字颜色 |
| **全局搜索** | 集成 Google/Bing/百度搜索引擎，支持本地书签模糊匹配（防抖） |
| **沉浸式 UI** | 暗黑毛玻璃（Glassmorphism）质感设计 |
| **个性化壁纸** | 支持上传本地图片作为新标签页背景 |
| **数据导入导出** | JSON 格式备份与恢复 |
| **跨标签页同步** | 使用 BroadcastChannel + StorageEvent 实现多标签页数据同步 |

---

## 技术架构

### 技术栈

```
运行时：Chrome/Edge Extension MV3
框架：React 19 + React DOM 19
UI 库：Material-UI v7 + @emotion/react + @emotion/styled
图标：@mui/icons-material
状态管理：Zustand v5 (带 persist 中间件)
构建工具：Vite 5.4 + @vitejs/plugin-react 4.3
压缩工具：Terser
包管理器：pnpm
```

### 目录结构

```
oneTab/
├── public/
│   ├── manifest.json      # MV3 扩展配置（构建时复制到 dist）
│   ├── bg.webp            # 默认壁纸
│   └── favicon.ico        # 网站图标
├── src/
│   ├── components/        # 业务组件（按领域划分）
│   │   ├── common/        # 通用组件
│   │   ├── feedback/      # 消息提示（Snackbar/Backdrop）
│   │   ├── layout/        # 布局组件（AppShell）
│   │   ├── navigation/    # 导航组件
│   │   ├── search/        # 搜索栏组件
│   │   ├── settings/      # 设置面板组件
│   │   ├── sites/         # 书签网格/卡片/编辑器
│   │   └── wallpaper/     # 壁纸管理组件
│   ├── store/             # Zustand 状态管理
│   │   ├── index.js       # 状态导出入口
│   │   ├── useDataStore.js     # 书签数据 Store
│   │   ├── useSettingsStore.js # 设置 Store
│   │   ├── CacheManager.js     # 缓存管理器（防抖落盘）
│   │   └── sync.js             # 跨标签页同步逻辑
│   ├── theme/             # MUI 主题配置
│   ├── App.jsx            # 应用主组件
│   └── main.jsx           # React 渲染入口
├── dist/                  # 构建产物（扩展部署目录）
├── nav.json               # 书签初始种子数据
├── index.html             # 页面壳层
├── package.json           # 依赖配置
├── vite.config.js         # Vite 构建配置
├── tsconfig.json          # TypeScript/JSDoc 类型配置
└── AGENTS.md              # AI 助手工作规范
```

---

## 开发与构建命令

### 环境准备

```bash
# 安装 Node.js (推荐 v18+) 和 pnpm
pnpm install
```

### 开发模式

```bash
pnpm run dev
# 访问 http://localhost:8123 进行调试
```

### 生产构建

```bash
pnpm run build
# 产物输出至 dist/ 目录
```

### 类型检查

```bash
pnpm run typecheck
```

### 扩展部署

1. 运行 `pnpm run build` 生成 `dist` 文件夹
2. 打开 `chrome://extensions` 或 `edge://extensions`
3. 开启 **开发者模式**
4. 点击 **加载已解压的扩展程序**，选择 `dist` 目录
5. 打开新标签页即可体验

---

## 状态管理架构

### Zustand Stores

#### useDataStore (书签数据)

```javascript
// 存储键：nav_data_v3
// 持久化：CacheManager (1000ms 防抖 + requestIdleCallback 落盘)
{
  categories: [{ id, label, items: [{ id, name, url, icon, bgColor, textColor }] }],
  isHydrated: boolean,
  // Actions
  setCategories, addSite, updateSite, deleteSite
}
```

#### useSettingsStore (全局设置)

```javascript
// 存储键：settings_data_v2
// 持久化：CacheManager (500ms 防抖)
{
  wallpaperUrl: string,
  openInNewTab: boolean,
  searchEngine: 'google' | 'bing' | 'baidu',
  wallpaperOpacity: number,
  // Actions
  setWallpaperUrl, toggleOpenInNewTab, setSearchEngine, setWallpaperOpacity
}
```

### 跨标签页同步

通过 `sync.js` 实现：
1. **BroadcastChannel** - 实时通信（防抖落盘前）
2. **StorageEvent** - 兜底保障（落盘后触发）

```javascript
// 在 App.jsx 中注册
useEffect(() => {
  const cleanupSync = setupStoreSync();
  return () => cleanupSync();
}, []);
```

---

## 数据持久化策略

### CacheManager 机制

```javascript
// src/store/CacheManager.js
1. 内存缓存 (Map) - 读写立即生效
2. 防抖延迟 (500-1000ms) - 避免频繁 IO
3. requestIdleCallback - 浏览器空闲时落盘
4. beforeunload - 页面关闭前强制落盘
```

### 存储键版本

| 存储键 | 用途 | 版本 |
|--------|------|------|
| `nav_data_v3` | 书签数据 | v3 (Zustand 管理) |
| `settings_data_v2` | 设置数据 | v2 (Zustand 管理) |
| `nav_data_v1` | 旧版书签 | 兼容迁移 |
| `wallpaper_url` | 旧版壁纸 | 兼容迁移 |

---

## 编码规范

### 强制要求

1. **标识符使用英文** - 变量/函数/类/CSS 类名
2. **用户文案使用简体中文** - UI 文本/弹窗/占位符
3. **关键注释使用简体中文** - 复杂逻辑处
4. **UTF-8 编码** - 所有源文件
5. **模块化** - 职责单一，避免大文件

### 开发风格

- 小步、可逆的编辑
- 直接验证（`typecheck` + `build`）
- 暴露可操作的错误日志

---

## 核心组件说明

### App.jsx

应用主容器，负责：
- 全局状态订阅（Zustand selectors）
- 跨标签页同步注册
- 事件处理器定义
- 组件树渲染

### SiteGrid.jsx

书签网格展示：
- 响应式布局
- 添加按钮（`+`）
- 空状态处理

### SiteCard.jsx

单个书签卡片：
- 图标/首字母显示
- 右键菜单触发
- 点击跳转（支持 `openInNewTab`）

### SiteEditorDialog.jsx

书签编辑对话框：
- 名称/链接输入
- 图标上传/自动获取
- 背景色/文字颜色选择

### SearchBar.jsx

搜索栏组件：
- 搜索引擎切换
- 本地书签模糊匹配（防抖 300ms）
- 下拉建议列表

### SettingsDrawer.jsx

设置面板：
- 外观设置（新标签页打开开关）
- 壁纸管理入口
- 数据导入/导出

### WallpaperManager.jsx

壁纸管理弹窗：
- 本地图片上传（≤5MB）
- 预览与重置

---

## 构建配置要点

### vite.config.js

```javascript
// 关键配置
{
  plugins: [
    react({ 
      jsxImportSource: '@emotion/react',
      babel: { plugins: ['@emotion/babel-plugin'] }
    }),
    { name: 'copy-manifest', closeBundle: () => copyFileSync(...) }
  ],
  build: {
    minify: 'terser',
    target: 'es2020',
    terserOptions: { 
      compress: { passes: 2, dead_code: true },
      mangle: { keep_fnames: true } // 保留函数名避免压缩错误
    }
  }
}
```

### 注意事项

- **Vite 版本**：使用 v5.4.x（v8 的 Rolldown 与 React 19 有兼容性问题）
- **压缩配置**：`keep_fnames: true` 防止函数名被混淆导致运行时错误
- **Manifest 复制**：自定义插件在 `closeBundle` 时复制 `public/manifest.json` 到 `dist/`

---

## CSP 策略

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: http:"
  }
}
```

允许的资源：
- Google Fonts（样式表 + 字体）
- 数据 URL 图片（Base64 图标）
- HTTP/HTTPS 外部图片

---

## 常见问题

### Q: 修改 nav.json 后页面未更新？
A: `localStorage` 优先级更高。需清除 `nav_data_v3` 后刷新。

### Q: 构建后扩展无法加载？
A: 检查 `dist/manifest.json` 是否存在，CSP 策略是否正确。

### Q: 图标加载失败？
A: 检查 CORS 策略，优先使用 Base64 或同域图片。

---

## 相关文档

- `README.md` - 项目使用说明
- `AGENTS.md` - AI 助手工作规范
- `PLAN_PHASE2.md` - 二期开发计划（已完成）
- `ARCHITECTURE_PROPOSAL.md` - 架构设计方案
