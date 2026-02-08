# OneTab 架构分析（现状）

**概览**
这是一个基于原生 HTML/CSS/JavaScript 的 Chrome/Edge MV3 新标签页覆盖扩展。页面包含侧边栏与书签网格，支持搜索联想、拖拽排序、右键菜单、设置弹层和本地壁纸功能。

**运行时组成**
1. UI 外壳  
`index.html` 定义页面布局、弹层和右键菜单。
2. 样式层  
`styles.css` 提供主题、玻璃质感、布局与响应式规则。
3. 交互层  
`app.js` 管理状态、渲染、事件与存储读写。
4. 数据种子  
`nav.json` 提供默认分类与书签结构。
5. 扩展清单  
`manifest.json` 注册新标签页覆盖与 CSP 规则。

**核心数据模型**
1. 分类数组  
- `id`、`label`、`items[]`
2. 书签项  
- `id`、`name`、`url`、可选 `src`、可选 `backgroundColor`

**状态与存储**
1. 运行态状态集中在 `app.js` 的 `state` 对象。
2. LocalStorage 键  
- `nav_data_v1`：用户修改后的导航数据。  
- `favicon_cache_v1`：站点图标 DataURL 缓存。  
- `wallpaper_v1`：壁纸 DataURL。

**渲染流程**
1. `init()` 加载缓存与数据源。  
2. `loadNav()` 读取 `nav_data_v1`，无则回退 `nav.json`。  
3. `renderTabs()` 构建分类标签。  
4. `renderSites()` 构建当前分类的书签卡片。  
5. `renderSearchResults()` 渲染搜索匹配列表。  
6. `updateWallpaperUI()` 刷新壁纸预览。

**交互流程**
1. 搜索输入  
- 评分排序的实时匹配。  
- 方向键选择，回车打开。
2. 右键菜单  
- 仅在侧边栏或图标上触发。  
- 操作：新增、编辑、删除、复制、粘贴。
3. 拖拽  
- 分类与书签排序，写入 localStorage。
4. 设置弹层  
- 新增书签、导出 JSON、壁纸上传/重置。

**性能考量**
1. 渲染为同步 DOM 操作，无虚拟 DOM。  
2. favicon 在 localStorage 中缓存。  
3. 壁纸在上传时压缩优化以降低存储占用。

**安全与 CSP**
1. CSP 限制图片来源为允许列表。  
2. 搜索右键菜单使用剪贴板权限。

**已知限制**
1. localStorage 容量限制会影响壁纸大小。  
2. 大量书签可能导致重新渲染开销增加。  
3. 所有逻辑集中在 `app.js`，缺少模块边界。
