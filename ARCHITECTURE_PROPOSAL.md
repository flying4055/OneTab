# OneTab MUI 重构架构方案（对标 WeTab）

## 1. 目标与范围

- 以 MUI 为主导重构 UI 层，尽可能使用官方组件与主题系统。
- 对标 WeTab 的核心体验：快速搜索、分组导航、可视化卡片、个性化主题、便捷设置。
- 保留现有 MV3 扩展能力与本地数据兼容（`nav_data_v1` / `tab_state_v1` / `wallpaper_v1`）。
- 先完成架构升级与功能对齐，再逐步替换旧 DOM 渲染逻辑。

## 2. 对标 WeTab 的功能设计

- 工作台首页：顶部搜索 + 分组标签 + 网站卡片网格。
- 多引擎搜索：支持默认引擎、快捷切换、回车直达。
- 分组管理：分组增删改、拖拽排序、分组内站点排序。
- 卡片能力：图标、标题、网址、副操作菜单（编辑/删除/打开）。
- 个性化：深浅色模式、主题色、壁纸、卡片圆角/密度配置。
- 设置中心：数据导入导出、搜索与外观配置、实验功能开关。

## 3. 技术约束与关键决策

- 当前是 Chrome/Edge MV3 扩展，`script-src 'self'`，不允许 CDN 远程脚本。
- MUI 基于 React，建议引入 React + MUI + Emotion 的本地构建产物。
- 保留现有 services 层（storage/search/favicon），先做 UI 适配，再做领域重构。
- 采用渐进迁移：新旧页面可并行切换，确保功能可回退。

## 4. 分层架构

- UI Layer（MUI）：负责页面布局、交互组件、主题与无障碍。
- ViewModel Layer：把领域状态映射为 UI 可消费模型，统一事件分发。
- Domain Layer：分类、站点、搜索、设置、壁纸等业务逻辑。
- Infrastructure Layer：`localStorage` 持久化、favicon 获取、数据迁移。

## 5. MUI 组件映射

- 页面框架：`CssBaseline` + `AppBar` + `Toolbar` + `Container` + `Drawer`。
- 分组与导航：`Tabs` / `Tab` + `Badge` + `Menu` + `MenuItem`。
- 站点卡片：`Card` + `CardActionArea` + `CardContent` + `Avatar` + `Tooltip`。
- 搜索区：`TextField` + `Autocomplete` + `InputAdornment` + `IconButton`。
- 操作反馈：`Dialog` + `Snackbar` + `Alert` + `Backdrop` + `CircularProgress`。
- 设置面板：`Accordion` + `Switch` + `Select` + `Slider` + `Divider`。

## 6. 模块重组建议

- `src/app/`：应用入口、路由壳层、全局 Provider。
- `src/features/dashboard/`：首页、分组条、卡片网格。
- `src/features/search/`：搜索框、引擎切换、建议列表。
- `src/features/settings/`：设置主页、子面板、数据工具。
- `src/shared/`：主题、通用组件、hooks、常量、类型。
- `src/services/`：复用现有存储/索引/favicon 服务并提供适配器。

## 7. 状态与数据流

- 全局状态建议：`ui`、`navigation`、`search`、`settings`、`wallpaper`。
- 数据流：UI Event -> ViewModel Action -> Domain Mutation -> Storage Persist。
- 启动流程：加载持久化数据 -> 执行 schema 迁移 -> 构建搜索索引 -> 首屏渲染。
- 持久化策略：关键写入防抖，失败时回退内存态并给出 `Snackbar` 提示。

## 8. 迁移阶段

- Phase 1（基础）：搭建 React + MUI 壳层，接入主题与首页静态骨架。
- Phase 2（核心）：迁移搜索、分组、站点卡片 CRUD 与右键菜单。
- Phase 3（完善）：迁移设置中心、壁纸与导入导出，补齐可访问性与测试。
- Phase 4（收敛）：移除旧渲染路径，完成性能基线对比与发布验收。

## 9. 验收标准

- 功能对齐：WeTab 对标清单中的核心能力全部可用。
- 体验一致：深浅色主题、键盘可达性、交互反馈完整。
- 数据安全：历史数据自动迁移且无破坏性变更。
- 性能达标：首屏可交互与搜索响应不弱于当前版本。
