# AI 助手工作规范 (AGENTS.md)

## 核心概述 (TL;DR)

- 本项目是一个 **Chrome/Edge MV3 新标签页扩展**（当前为无构建步骤的纯静态架构，即将进行 MUI React 重构）。
- 运行时入口：`manifest.json` -> `index.html` -> `static/js/app.js`。
- 保持变更**小步、模块化、且对浏览器安全**。
- 当前代码库使用原生 HTML/CSS/ES Modules，目前没有使用包管理器脚本进行打包。

## 目录结构

- `manifest.json`：MV3 配置文件、新标签页覆盖、CSP 策略、权限声明。
- `index.html`：页面壳层、右键菜单、模态框、设置 UI。
- `nav.json`：书签和分类的初始种子数据。
- `static/css/styles.css`：全局和组件样式。
- `static/js/app.js`：应用启动和功能串联。
- `static/js/core/`：共享常量、状态、工具函数和 DOM 元素。
- `static/js/features/`：UI 和领域模块（如站点、标签、搜索、模态框、设置、壁纸等）。
- `static/js/services/`：存储和图标相关的底层服务。
- `static/img/`：静态资源。
- `ARCHITECTURE_PROPOSAL.md`：架构设计与重构方案。
- `PLAN.md`：重构执行计划与进度表。

## 关键代码入口

- 启动流程：
  - `static/js/app.js`
  - `static/js/features/sites.js`
  - `static/js/features/tabs.js`
- 数据流向：
  - `static/js/services/navStorage.js` (`nav_data_v1` 数据持久化)
  - `static/js/core/state.js` (运行时状态容器)
- 图标流向：
  - `static/js/services/favicon.js` (候选图标解析与运行时加载)
  - `static/js/services/iconFetcher.js` (存在但目前未接入启动流程)
- 用户操作：
  - `static/js/features/modals.js`
  - `static/js/features/contextMenuActions.js`

## 开发 / 运行 / 测试命令

- 本地静态快速预览：
  - `python -m http.server 8123`
  - 浏览器访问 `http://127.0.0.1:8123/index.html`
- 扩展运行（推荐方式）：
  1. 打开 `chrome://extensions` 或 `edge://extensions`
  2. 开启“开发者模式”
  3. 点击“加载已解压的扩展程序” -> 选择项目根目录
- 语法检查（当前未配置 Lint 流水线）：
  - `pnpm run check:syntax`
  - `pnpm run typecheck`
- 代码库搜索：
  - `rg "pattern" static/js` (需要安装 ripgrep)

## 部署注意事项

- 本项目作为解压/打包的浏览器扩展进行部署。
- 发布前必须：
  1. 提升 `manifest.json` 中的 `version` 版本号。
  2. 重新检查 `permissions` 和 `content_security_policy` (CSP) 的变更。
  3. 在 Chrome 和 Edge 中验证新标签页的覆盖行为。
  4. 验证 `localStorage` 数据的兼容性（`nav_data_v1`、`tab_state_v1`、`wallpaper_v1`）。
- 手动打包（可选）：
  - 使用浏览器的“打包扩展程序”功能，或直接压缩项目根目录（打包时需排除 `.git` 及本地临时文件）。

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
   未达到上线水平前暂时不要编译构建最终产物，仅保持在开发预览状态运行（通过 Vite dev server 或同等方式预览）。
8. 保持模块聚焦；避免在入口文件中放入跨功能的领域逻辑。
9. 倾向于对持久化数据进行非破坏性变更；如果需要类似 Schema 的结构变更，必须添加兼容性处理逻辑。

## AI 助手工作风格

- 进行最小化、可逆的编辑。
- 通过直接检查来确认行为（如 `pnpm run typecheck`、手动重载扩展）。
- 绝不静默忽略持久化或图标加载失败的异常；必须暴露可操作的日志信息。
