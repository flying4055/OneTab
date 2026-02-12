export function labelToId(label) {
    return String(label).replace(/类?/g, '').toLowerCase().replace(/[^\w]+/g, '-');
}

export function normalizeNav(input) {
    if (input && input.navConfig && Array.isArray(input.navConfig)) {
        return {
            version: 1,
            categories: input.navConfig.map(cat => ({
                id: String(cat.id),
                label: cat.name,
                icon: cat.icon,
                items: Array.isArray(cat.children) ? cat.children : []
            }))
        };
    }
    if (input && Array.isArray(input.categories)) return input;
    const categories = Object.entries(input || {}).map(([label, items], i) => ({
        id: labelToId(label) || `cat-${i}`,
        label,
        items: Array.isArray(items) ? items : []
    }));
    return { version: 1, categories };
}

export function getDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
}

export function formatDomainLabel(domain) {
    if (!domain) return '';
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) return domain;
    const clean = domain.replace(/^www\./i, '');
    const parts = clean.split('.').filter(Boolean);
    if (parts.length >= 3) return clean;
    const brandCaps = new Set(['google.com']);
    if (brandCaps.has(clean)) {
        return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return clean;
}

export function normalizeUrl(input) {
    if (!input) return '';
    let value = input.trim();
    if (!value) return '';
    if (!/^https?:\/\//i.test(value)) {
        value = `https://${value}`;
    }
    try {
        return new URL(value).toString();
    } catch {
        return '';
    }
}

export function createSiteId() {
    return `site-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function moveItem(list, from, to) {
    if (!Array.isArray(list) || from === to) return;
    const item = list.splice(from, 1)[0];
    if (!item) return;
    list.splice(to, 0, item);
}
