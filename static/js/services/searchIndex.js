import { getDomain } from '../core/utils.js';

let searchIndex = [];

function normalizeText(value) {
    return String(value || '').trim();
}

function createSearchEntry(site, category, categoryIndex, itemIndex) {
    const name = normalizeText(site?.name);
    const url = normalizeText(site?.url);
    if (!name && !url) return null;

    const domain = normalizeText(getDomain(url));
    const cleanDomain = domain.replace(/^www\./i, '');
    const categoryLabel = normalizeText(category?.label);

    return {
        name,
        url,
        domain,
        cleanDomain,
        categoryLabel,
        categoryIndex,
        itemIndex,
        nameLower: name.toLowerCase(),
        urlLower: url.toLowerCase(),
        domainLower: domain.toLowerCase(),
        cleanDomainLower: cleanDomain.toLowerCase()
    };
}

function scoreEntry(queryLower, entry) {
    if (!queryLower) return 0;
    let score = 0;

    if (entry.nameLower === queryLower) score += 6;
    else if (entry.nameLower.startsWith(queryLower)) score += 4;
    else if (entry.nameLower.includes(queryLower)) score += 2;

    if (entry.domainLower === queryLower || entry.cleanDomainLower === queryLower) score += 5;
    else if (entry.domainLower.startsWith(queryLower) || entry.cleanDomainLower.startsWith(queryLower)) score += 3;
    else if (entry.domainLower.includes(queryLower) || entry.cleanDomainLower.includes(queryLower)) score += 1;

    if (entry.urlLower.includes(queryLower)) score += 1;
    return score;
}

export function rebuildSearchIndex(categories) {
    const entries = [];

    (categories || []).forEach((category, categoryIndex) => {
        (category?.items || []).forEach((site, itemIndex) => {
            const entry = createSearchEntry(site, category, categoryIndex, itemIndex);
            if (entry) {
                entries.push(entry);
            }
        });
    });

    searchIndex = entries;
    return searchIndex.length;
}

export function querySearchIndex(query, limit = 8) {
    const value = normalizeText(query);
    if (!value) return [];

    const queryLower = value.toLowerCase();
    const matches = [];

    for (const entry of searchIndex) {
        const score = scoreEntry(queryLower, entry);
        if (score <= 0) continue;
        matches.push({
            ...entry,
            score
        });
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, Math.max(0, limit));
}

export function getSearchIndexStats() {
    return {
        size: searchIndex.length
    };
}
