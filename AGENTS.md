# AI 助手工作规范 (AGENTS.md)

## 核心概述 (TL;DR)

- 本项目是一个 **Chrome/Edge MV3 新标签页扩展**（当前已使用 `pnpm + Vite + React + MUI` 完成重构）。
- 运行时入口：`manifest.json` -> `index.html` -> `src/main.jsx` -> `src/App.jsx`。
- 保持变更**小步、模块化、且对浏览器安全**。
- 当前代码库使用 Vite 进行构建与开发，支持现代前端化模块管理与热更新。

## 目录结构

- `manifest.json`：MV3 配置文件、新标签页覆盖、CSP 策略、权限声明。
- `index.html`：页面壳层与应用挂载点。
- `nav.json`：书签的初始种子数据。
- `src/main.jsx`：React 应用入口，注入全局 Context（如 Feedback）。
- `src/App.jsx`：应用核心，串联全局主题、路由/布局和主要功能组件。
- `src/components/`：核心 UI 组件（按功能领域划分，如 `search/`、`sites/`、`settings/`、`wallpaper/`、`feedback/` 等）。
- `src/theme/`：MUI 主题配置。
- `ARCHITECTURE_PROPOSAL.md`：架构设计与重构方案。
- `PLAN.md`：重构执行计划与进度表。

## 关键代码入口

- **启动流程**：
  - `src/main.jsx`
  - `src/App.jsx`
- **核心功能组件**：
  - `src/components/sites/SiteGrid.jsx` (书签网格展示)
  - `src/components/search/SearchBar.jsx` (搜索与本地书签过滤)
  - `src/components/sites/SiteEditorDialog.jsx` (书签增删改查)
  - `src/components/settings/SettingsDrawer.jsx` (全局设置管理)
- **数据流向与状态**：
  - 运行时状态主要由 `src/App.jsx` 统一管理（React Hooks）。
  - `localStorage` 持久化读取与写入，包括 `nav_data_v1`（书签数据）、`wallpaper_v1`（自定义壁纸）和 `tab_state_v1` 等。

## 开发 / 运行 / 测试命令

- **依赖安装**：
  - `pnpm install`
- **本地开发预览**：
  - `pnpm run dev`
  - 浏览器访问 `http://localhost:5173/` 进行调试。
- **构建生产产物**：
  - `pnpm run build`
  - 产物将输出至 `dist/` 目录。
- **扩展运行验证（推荐方式）**：
  1. 运行 `pnpm run build` 生成 `dist` 文件夹。
  2. 打开 `chrome://extensions` 或 `edge://extensions`。
  3. 开启“开发者模式”。
  4. 点击“加载已解压的扩展程序” -> 选择项目中的 `dist` 目录。
- **语法检查**：
  - `pnpm run typecheck` (基于 TypeScript 和 JSDoc 进行类型推导验证)

## 部署注意事项

- 本项目作为解压/打包的浏览器扩展进行部署，构建产物在 `dist/` 目录下。
- 发布前必须：
  1. 提升 `manifest.json` 中的 `version` 版本号。
  2. 重新检查 `permissions` 和 `content_security_policy` (CSP) 的变更。
  3. 运行 `pnpm run build`，确保构建无误。
  4. 在 Chrome 和 Edge 中加载 `dist/` 目录，验证新标签页的覆盖行为。
  5. 验证 `localStorage` 数据的兼容性（`nav_data_v1`、`wallpaper_v1`）。

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
   本项目使用 `pnpm + Vite + React + MUI` 进行构建与开发，所有的组件引入和打包配置均需遵循此技术栈的最佳实践。
7. **开发编译规则**  
   日常开发保持在 `pnpm run dev` 状态运行；需要验证扩展环境或最终上线时，执行 `pnpm run build`。
8. 保持模块聚焦；避免在入口文件中放入跨功能的领域逻辑。
9. 倾向于对持久化数据进行非破坏性变更；如果需要类似 Schema 的结构变更，必须添加兼容性处理逻辑。

## AI 助手工作风格

- 进行最小化、可逆的编辑。
- 通过直接检查来确认行为（如 `pnpm run typecheck`、本地运行构建）。
- 绝不静默忽略持久化或图标加载失败的异常；必须暴露可操作的日志信息。
