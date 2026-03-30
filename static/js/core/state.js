export const state = {
    categories: [],
    activeIndex: 0,
    dragIndex: null,
    dragSiteIndex: null,
    searchInputValue: '',
    searchMatches: [],
    searchActiveIndex: -1,
    wallpaperDataUrl: '',
    selectedEngine: 'default',
    engines: [
        { value: 'default', label: '搜索' },
        { value: 'https://www.baidu.com/s?wd=', label: '百度' },
        { value: 'https://www.google.com/search?q=', label: 'Google' },
        { value: 'https://cn.bing.com/search?q=', label: 'Bing' },
        { value: 'https://example.com/search?q=', label: '测试' }
    ],
    faviconCache: {}
};
