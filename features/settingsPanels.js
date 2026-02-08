const PANEL_META = {
    icon: { title: '图标设置', sub: '统一调整图标样式与间距' },
    searchEngine: { title: '搜索引擎', sub: '管理默认搜索引擎与模板' },
    time: { title: '时间设置', sub: '配置时间显示样式' },
    wallpaper: { title: '壁纸设置', sub: '管理背景与预览' },
    data: { title: '数据管理', sub: '导入导出书签数据' }
};

export function initSettingsPanels() {
    const navItems = Array.from(document.querySelectorAll('.settings-nav-item'));
    const sections = Array.from(document.querySelectorAll('.settings-panel-section'));
    const title = document.querySelector('.settings-panel-title');
    const sub = document.querySelector('.settings-panel-sub');

    const setActive = (sectionId) => {
        navItems.forEach(btn => {
            btn.classList.toggle('is-active', btn.dataset.section === sectionId);
        });
        sections.forEach(sec => {
            sec.classList.remove('is-active');
        });
        const meta = PANEL_META[sectionId];
        if (title && sub) {
            if (meta) {
                title.textContent = meta.title;
                sub.textContent = meta.sub;
            } else {
                title.textContent = '设置';
                sub.textContent = '该模块正在规划中';
            }
        }
        const targetPanel = sections.find(sec => sec.dataset.panel === sectionId);
        if (targetPanel) {
            targetPanel.classList.add('is-active');
        } else {
            const placeholder = sections.find(sec => sec.dataset.panel === 'placeholder');
            if (placeholder) placeholder.classList.add('is-active');
        }
    };

    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            setActive(btn.dataset.section);
        });
    });

    const defaultActive = navItems.find(btn => btn.classList.contains('is-active'))?.dataset.section || 'icon';
    setActive(defaultActive);
}
