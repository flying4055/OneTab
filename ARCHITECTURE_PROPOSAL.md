# OneTab 架构方案（全新规划）

**目标**
1. 通过模块化提升可维护性。  
2. 降低渲染开销，使 UI 更新更增量化。  
3. 规范数据存储与迁移路径。  
4. 强化离线与 CSP 约束下的韧性。

**拟议目录结构**
1. `src/`  
- `ui/`：UI 渲染与模板。  
- `state/`：状态容器、选择器、变更方法。  
- `services/`：存储、favicon、壁纸、搜索服务。  
- `features/`：功能域（search/bookmarks/settings/context-menu）。
2. `public/`  
- 静态资源与 `manifest.json`。
3. `data/`  
- `nav.json` 数据种子与版本说明。

**关键模块**
1. Storage Service  
- 抽象 localStorage 读写。  
- 使用 `schemaVersion` 管理迁移。  
- 提供 `loadNav()`、`saveNav()` 等接口。
2. Render Service  
- 对分类、书签、搜索结果做增量更新。  
- 统一处理键盘焦点与可访问性。
3. Search Service  
- 启动时构建索引。  
- 提供排序与域名缓存。
4. Wallpaper Service  
- 上传校验、缩放、持久化。  
- 为未来在线图库留出扩展点。
5. Context Menu Service  
- 按目标类型声明式配置菜单。

**状态模型**
1. `appState`  
- `categories`、`activeCategoryId`  
- `searchQuery`、`searchMatches`、`searchActiveIndex`  
- `wallpaper`、`ui` 标志位
2. 状态变更  
- 所有写操作统一走 `mutations`，确保一致性。
3. 选择器  
- `getActiveCategory()`、`getSearchResults()`。

**数据流**
1. 启动  
- 载入导航数据、favicon 缓存、壁纸。  
- 构建搜索索引并首次渲染。
2. 交互  
- 事件 → 变更 → 增量渲染。
3. 持久化  
- 变更触发带防抖的存储写入。

**性能计划**
1. 重操作防抖  
- 导航变更后重建搜索索引。  
- 持久化加短防抖。
2. DOM 细粒度更新  
- 优先使用 keyed patch，避免全量重渲染。
3. 图片延迟加载  
- 使用 `loading="lazy"` 并固定占位尺寸。

**安全与 CSP**
1. 统一的资源白名单配置。  
2. 使用前校验用户输入 URL。  
3. 资源受阻时提供安全降级。

**测试计划**
1. 单元测试：存储与搜索排序。  
2. 集成测试：书签 CRUD 与持久化。  
3. UI 测试：键盘导航与右键菜单。

**迁移计划**
1. 在存储数据中引入 `schemaVersion`。  
2. 启动时做数据迁移。  
3. 至少保留一个版本的向后兼容。

**里程碑**
1. Phase 1：拆分文件，建立存储/搜索服务。  
2. Phase 2：增量渲染与持久化防抖。  
3. Phase 3：测试与迁移工具完善。
