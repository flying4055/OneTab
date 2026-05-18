# 目录结构

```
oneTab/
├── docs/                              # 项目文档
│   ├── architecture.md                #   架构设计
│   ├── directory-structure.md         #   目录结构 (本文件)
│   └── features.md                    #   功能清单
│
├── public/                            # 静态资源 (构建时原样复制到 dist/)
│   ├── manifest.json                  #   MV3 扩展配置
│   ├── bg.webp                        #   默认壁纸
│   └── favicon.ico                    #   网站图标
│
├── src/                               # 源代码
│   ├── main.jsx                       #   应用入口 → ReactDOM.createRoot
│   ├── App.jsx                        #   根组件 (状态管理中枢 + 路由)
│   │
│   ├── store/                         #   Zustand 状态管理
│   │   ├── index.js                   #     统一导出
│   │   ├── useDataStore.js            #     书签数据 Store
│   │   ├── useSettingsStore.js        #     全局设置 Store
│   │   └── sync.js                    #     跨标签页同步
│   │
│   ├── theme/                         #   MUI 主题
│   │   └── index.js                   #     暗色主题配置
│   │
│   └── components/                    #   UI 组件
│       ├── layout/                    #   布局
│       │   └── AppShell.jsx           #     应用壳层 (壁纸 + 设置按钮)
│       │
│       ├── search/                    #   搜索
│       │   └── SearchBar.jsx          #     搜索栏 (Autocomplete + 搜索引擎)
│       │
│       ├── sites/                     #   书签
│       │   ├── SiteCard.jsx           #     单个书签卡片 (useSortable)
│       │   ├── SiteGrid.jsx           #     书签网格 (DndContext)
│       │   ├── SiteEditorDialog.jsx   #     书签编辑器 (新增/编辑/图标/颜色)
│       │   └── SiteContextMenu.jsx    #     右键菜单
│       │
│       ├── settings/                  #   设置
│       │   └── SettingsDrawer.jsx     #     设置抽屉 (外观/壁纸/图标/导入导出)
│       │
│       ├── wallpaper/                 #   壁纸
│       │   └── WallpaperManager.jsx   #     壁纸管理弹窗
│       │
│       ├── feedback/                  #   全局反馈
│       │   └── FeedbackProvider.jsx   #     Snackbar + Loading Context
│       │
│       ├── common/                    #   公共组件 (预留)
│       └── navigation/               #   导航组件 (预留)
│
├── nav.json                           # 种子书签数据 (首次安装使用)
├── index.html                         # HTML 入口
├── package.json                       # 依赖与脚本
├── pnpm-lock.yaml                     # 依赖锁定
├── vite.config.js                     # Vite 构建配置
├── tsconfig.json                      # TypeScript 配置
├── .gitignore                         # Git 忽略规则
├── .github/workflows/                 # CI
│   └── quality-gate.yml               #   质量门禁
│
├── AGENTS.md                          # AI 助手工作规范
└── README.md                          # 项目说明
```
