export const state = {
    categories: [],
    activeIndex: 0,
    dragIndex: null,
    dragSiteIndex: null,
    searchInputValue: '',
    searchMatches: [],
    searchActiveIndex: -1,
    wallpaperDataUrl: '',
    selectedEngine: 'https://www.google.com/search?q=',
    engines: [
        { value: 'https://www.google.com/search?q=', label: 'Google' },
        { value: 'https://cn.bing.com/search?q=', label: 'Bing' },
        { value: 'https://www.baidu.com/s?wd=', label: '百度' },
        { value: 'https://duckduckgo.com/?q=', label: 'DuckDuckGo' }
    ],
    faviconCache: {}
};
