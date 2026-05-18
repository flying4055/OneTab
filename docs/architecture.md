# 架构设计

## 概述

OneTab 是一个 Chrome/Edge Manifest V3 新标签页扩展，使用 **pnpm + Vite + React 19 + MUI 6 + Zustand 5** 构建。

## 技术栈

| 层 | 技术 | 用途 |
|---|------|------|
| 运行时 | React 19 | UI 组件框架 |
| 状态管理 | Zustand 5 + persist 中间件 | 全局状态 + localStorage 持久化 |
| UI 库 | MUI 6 (Material UI) | 组件库 + 暗色主题 |
| CSS-in-JS | Emotion | 样式方案（与 MUI 一致） |
| 构建工具 | Vite 8 | 开发服务器 + 生产打包 |
| 类型检查 | TypeScript 5 (JSDoc 模式) | 静态类型验证 |
| 拖拽排序 | @dnd-kit | 书签拖拽排序 |
| 包管理 | pnpm | 依赖管理 |

## 数据流

```
用户操作 → Zustand Store (useDataStore / useSettingsStore)
                ↓ set()
          内存状态更新
                ↓ persist 中间件
          localStorage 同步写入 (nav_data_v4 / settings_data_v2)
                ↓ storage 事件
          其他标签页 rehydrate() → 内存状态同步
```

## 状态管理

### useDataStore
- **localStorage key**: `nav_data_v4`
- **数据结构**: `{ categories: [{ id, label, items: [{ id, name, url, icon, bgColor, textColor }] }] }`
- **操作**: `addSite`, `updateSite`, `deleteSite`, `setCategories`, `reorderItems`
- **种子数据**: `nav.json`（首次安装或清空缓存时使用）
- **merge 逻辑**: 持久化数据优先 → 回退种子数据

### useSettingsStore
- **localStorage key**: `settings_data_v2`
- **设置项**: `wallpaperUrl`, `openInNewTab`, `searchEngine`, `iconSize`, `gridGap`, `contentMaxWidth`, `wallpaperOpacity`
- **旧版兼容**: `merge` 自动从旧 key (`wallpaper_url`, `open_in_new_tab`) 迁移

### 跨标签页同步
- 原生 `storage` 事件监听（`src/store/sync.js`）
- A 标签页写入 localStorage → B 标签页 `storage` 事件触发 → `rehydrate()` 刷新

## 组件层级

```
main.jsx
  └─ FeedbackProvider              ← 全局反馈 (Snackbar + Loading)
      └─ App
          ├─ ThemeProvider          ← MUI 暗色主题
          ├─ AppShell               ← 布局壳层 (壁纸背景 + 设置入口)
          │   ├─ SearchBar          ← 搜索栏 (搜索引擎切换 + 本地书签过滤)
          │   └─ SiteGrid          ← 书签网格
          │       ├─ DndContext     ← @dnd-kit 拖拽容器
          │       ├─ SortableContext
          │       ├─ SiteCard × N   ← 单个书签卡片 (useSortable)
          │       └─ AddButton      ← 新增按钮
          ├─ SiteContextMenu        ← 右键菜单
          ├─ SiteEditorDialog       ← 书签编辑器
          ├─ DeleteConfirmDialog    ← 删除确认
          ├─ SettingsDrawer (lazy)  ← 设置抽屉
          └─ WallpaperManager (lazy)← 壁纸管理
```

## 构建流程

```
npm scripts:
  dev          → vite (端口 8123, HMR)
  build        → vite build → dist/
  build:analyze→ vite build --mode analyze
  typecheck    → tsc --noEmit

Vite 插件:
  - @vitejs/plugin-react (Emotion 支持)
  - copy-manifest (public/manifest.json → dist/manifest.json)
```

## 扩展配置

- **manifest**: `public/manifest.json`
- **权限**: `favicon`
- **新标签页覆盖**: `chrome_url_overrides.newtab`
- **CSP**: 允许 self 脚本 + Google Fonts
