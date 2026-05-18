# AI 助手工作规范 (AGENTS.md)

## 核心概述 (TL;DR)

- 本项目是一个 **Chrome/Edge MV3 新标签页扩展**（当前已使用 `pnpm + Vite + React 19 + MUI 6 + Zustand` 完成重构）。
- 运行时入口：`index.html` -> `src/main.jsx` -> `src/App.jsx`。
- 保持变更**小步、模块化、且对浏览器安全**。
- 当前代码库使用 Vite 进行构建与开发，支持现代前端化模块管理与热更新。
- 状态管理使用 **Zustand**（`src/store/`），数据持久化到 `localStorage`，并支持跨标签页实时同步。

## 目录结构

- `public/manifest.json`：MV3 配置文件、新标签页覆盖、CSP 策略、权限声明。（构建时由 Vite 插件自动复制到 `dist/`）
- `index.html`：页面壳层与应用挂载点。
- `nav.json`：书签的初始种子数据。
- `src/main.jsx`：React 应用入口，挂载 `FeedbackProvider` 全局反馈 Context。
- `src/App.jsx`：应用核心，串联全局主题、布局、搜索、书签网格和右键菜单。
- `src/store/`：**Zustand 状态管理层**，统一管理数据与设置。
  - `src/store/index.js`：Store 统一导出。
  - `src/store/useDataStore.js`：书签数据 Store（`nav_data_v4` 持久化到 localStorage）。
  - `src/store/useSettingsStore.js`：全局设置 Store（`settings_data_v2` 持久化到 localStorage）。
  - `src/store/CacheManager.js`：防抖缓存存储层，减少高频 localStorage 写入。
  - `src/store/sync.js`：跨标签页实时同步（BroadcastChannel + storage 事件兜底）。
- `src/components/`：核心 UI 组件。
  - `src/components/layout/AppShell.jsx`：应用布局壳层（暗色背景、壁纸、设置入口）。
  - `src/components/search/SearchBar.jsx`：搜索栏（支持本地书签过滤、多搜索引擎切换）。
  - `src/components/sites/SiteCard.jsx`：单个书签卡片（图标/首字母、右键菜单触发）。
  - `src/components/sites/SiteGrid.jsx`：书签网格布局（含新增按钮）。
  - `src/components/sites/SiteEditorDialog.jsx`：书签增删改查弹窗（名称、链接、图标、背景色）。
  - `src/components/sites/SiteContextMenu.jsx`：书签右键菜单（打开、编辑、删除）。
  - `src/components/settings/SettingsDrawer.jsx`：全局设置抽屉（外观、壁纸、导入/导出）。
  - `src/components/wallpaper/WallpaperManager.jsx`：壁纸管理弹窗（上传、预览、重置）。
  - `src/components/feedback/FeedbackProvider.jsx`：全局反馈 Context（Snackbar 消息 + Loading 遮罩）。
  - `src/components/common/`：公共组件目录（预留）。
  - `src/components/navigation/`：导航组件目录（预留）。
- `src/theme/index.js`：MUI 主题配置（暗色模式）。
- `vite.config.js`：Vite 构建配置（Emotion、manifest 复制插件、开发端口 8123）。
- `tsconfig.json`：TypeScript 配置（JSDoc 类型检查）。
- `.github/workflows/quality-gate.yml`：CI 质量门禁。
- `PLAN.md` / `PLAN_PHASE2.md`：重构执行计划与进度表。

## 关键代码入口

- **启动流程**：
  - `src/main.jsx` -> `FeedbackProvider` -> `App`
  - `src/App.jsx`
- **状态管理**：
  - `useDataStore`（Zustand）：管理 `categories`（书签分类及条目），提供 `addSite` / `updateSite` / `deleteSite` / `setCategories`。
  - `useSettingsStore`（Zustand）：管理 `wallpaperUrl` / `openInNewTab` / `searchEngine` / `wallpaperOpacity` 等全局设置。
  - 数据持久化：`nav_data_v4`（书签）、`settings_data_v2`（设置），通过 `CacheManager` 做防抖写入。
  - 跨标签页同步：`setupStoreSync()` 在 `App` 挂载时启动，通过 BroadcastChannel 实时同步 + `storage` 事件兜底。
- **核心功能组件**：
  - `src/components/sites/SiteGrid.jsx`（书签网格展示）
  - `src/components/sites/SiteCard.jsx`（单个书签卡片渲染）
  - `src/components/search/SearchBar.jsx`（搜索与本地书签过滤，含搜索引擎切换）
  - `src/components/sites/SiteEditorDialog.jsx`（书签增删改查，含图标获取与颜色配置）
  - `src/components/sites/SiteContextMenu.jsx`（右键菜单：打开/编辑/删除）
  - `src/components/settings/SettingsDrawer.jsx`（全局设置管理与导入导出）
  - `src/components/layout/AppShell.jsx`（应用布局框架）
  - `src/components/feedback/FeedbackProvider.jsx`（全局消息反馈）
- **数据流向**：
  - 运行时状态由 Zustand Store 统一管理。
  - `localStorage` 持久化：`nav_data_v4`（书签数据）、`settings_data_v2`（设置数据）。
  - 旧版兼容：`useSettingsStore` 的 `merge` 函数会自动从旧 key（`wallpaper_url`、`open_in_new_tab`）迁移数据。

## 开发 / 运行 / 测试命令

- **依赖安装**：
  - `pnpm install`
- **本地开发预览**：
  - `pnpm run dev`
  - 浏览器访问 `http://localhost:8123/` 进行调试。（端口在 `vite.config.js` 中配置）
- **构建生产产物**：
  - `pnpm run build`
  - 产物将输出至 `dist/` 目录。
- **构建分析**：
  - `pnpm run build:analyze`
- **扩展运行验证（推荐方式）**：
  1. 运行 `pnpm run build` 生成 `dist` 文件夹。
  2. 打开 `chrome://extensions` 或 `edge://extensions`。
  3. 开启"开发者模式"。
  4. 点击"加载已解压的扩展程序" -> 选择项目中的 `dist` 目录。
- **类型检查**：
  - `pnpm run typecheck`（基于 TypeScript + JSDoc 进行类型推导验证）

## 部署注意事项

- 本项目作为解压/打包的浏览器扩展进行部署，构建产物在 `dist/` 目录下。
- 发布前必须：
  1. 提升 `public/manifest.json` 中的 `version` 版本号。
  2. 重新检查 `permissions` 和 `content_security_policy` (CSP) 的变更。
  3. 运行 `pnpm run build`，确保构建无误。
  4. 在 Chrome 和 Edge 中加载 `dist/` 目录，验证新标签页的覆盖行为。
  5. 验证 `localStorage` 数据的兼容性（`nav_data_v4`、`settings_data_v2`）。

## 严格编码规范 (必须遵守)

1. **标识符必须仅使用英文**  
   包括变量、函数、类、常量、CSS 类名、HTML 属性以及文件名。
2. **面向用户的文案内容必须使用简体中文**  
   由于这是面向国内/中文用户的重构版本，UI 文本、弹窗提示、占位符、标签、模态框标题、菜单文本以及空状态提示均使用简体中文。
3. **关键逻辑注释必须使用简体中文**  
   在逻辑复杂或不直观的地方添加简明的中文注释。
4. **所有源文件必须使用 UTF-8 编码**  
   绝不允许出现乱码或混合编码。
5. **按照企业级标准开发**  
   代码结构清晰、模块职责单一；遵循 React Hooks 最佳实践；包含必要的错误边界与异常处理；提供良好的类型定义与可维护性。
6. **项目技术栈规范**  
   本项目使用 `pnpm + Vite + React 19 + MUI 6 + Zustand 5` 进行构建与开发，所有组件引入和打包配置均需遵循此技术栈的最佳实践。
7. **开发编译规则**  
   日常开发保持在 `pnpm run dev` 状态运行；需要验证扩展环境或最终上线时，执行 `pnpm run build`。
8. 保持模块聚焦；避免在入口文件中放入跨功能的领域逻辑。
9. 倾向于对持久化数据进行非破坏性变更；如果需要类似 Schema 的结构变更，必须添加兼容性处理逻辑。
10. **状态管理**：使用 Zustand Store（`src/store/`）管理全局状态，不要直接在组件中用 `useState` + `localStorage` 绕过 Store 层。
11. **图标处理**：SiteCard 中图标加载失败时使用首字母兜底；背景色透明时强制使用白色背景以确保可读性。

## AI 助手工作风格

- 进行最小化、可逆的编辑。
- 通过直接检查来确认行为（如 `pnpm run typecheck`、`pnpm run build`）。
- 绝不静默忽略持久化或图标加载失败的异常；必须暴露可操作的日志信息。
- 修改 Store 或数据 schema 时，确保 `merge` 函数处理旧版数据迁移。
