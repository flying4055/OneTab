import fs from 'node:fs';
import crypto from 'node:crypto';

const INPUT_FILE = 'nav.json';
const REPORT_FILE = 'nav.cleanup.report.json';
const LOCAL_FILE_PATH_PREFIXES = [
    'local:',
    'static/',
    '/static/',
    './static/',
    '../static/',
    'icons/',
    '/icons/',
    './icons/',
    '../icons/',
    'assets/',
    '/assets/',
    './assets/',
    '../assets/'
];

function normalizeUrlKeepScheme(input) {
    const value = String(input || '').trim();
    if (!value) return '';

    const withProto = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value)
        ? value
        : `https://${value}`;

    try {
        return new URL(withProto).toString();
    } catch {
        return '';
    }
}

function normalizeCategoryId(value, index) {
    const text = String(value || '').trim();
    if (text) return text;
    return `cat-${index + 1}`;
}

function createStableItemId(seed) {
    const hash = crypto.createHash('sha1').update(seed).digest('hex').slice(0, 10);
    return `site-${hash}`;
}

function normalizeIconSource(input) {
    const raw = String(input || '').trim();
    if (!raw) return '';
    if (raw.startsWith('data:image/')) return raw;

    const lower = raw.toLowerCase();
    if (lower.startsWith('blob:')) return '';
    if (lower.startsWith('chrome-extension://')) return '';
    if (LOCAL_FILE_PATH_PREFIXES.some((prefix) => lower.startsWith(prefix))) return '';

    if (raw.startsWith('//')) return `https:${raw}`;

    try {
        const parsed = new URL(raw);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.toString();
        }
        return '';
    } catch {
        return '';
    }
}

function normalizeBgColor(input) {
    const raw = String(input || '').trim();
    if (!raw) return '';
    const lower = raw.toLowerCase();
    if (lower === 'transparent') return 'transparent';

    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) {
        if (raw.length === 4) {
            return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
        }
        return raw.toLowerCase();
    }

    return '';
}

function cleanNavData(rawData) {
    const categories = Array.isArray(rawData?.categories) ? rawData.categories : [];

    let droppedInvalid = 0;
    let droppedDuplicateInCategory = 0;
    let droppedDuplicateGlobal = 0;
    let generatedItemIdCount = 0;
    let preservedSrcCount = 0;
    let preservedBgColorCount = 0;

    const globalSeen = new Map();
    const globalDuplicateDetails = [];

    const cleanedCategories = categories.map((category, catIndex) => {
        const categoryId = normalizeCategoryId(category?.id, catIndex);
        const categoryLabel = String(category?.label || `分类 ${catIndex + 1}`).trim();
        const sourceItems = Array.isArray(category?.items) ? category.items : [];
        const categorySeen = new Set();
        const outputItems = [];

        sourceItems.forEach((item, itemIndex) => {
            const name = String(item?.name || '').trim();
            const url = normalizeUrlKeepScheme(item?.url);

            if (!name || !url) {
                droppedInvalid += 1;
                return;
            }

            const categoryDedupeKey = url.toLowerCase();
            if (categorySeen.has(categoryDedupeKey)) {
                droppedDuplicateInCategory += 1;
                return;
            }
            categorySeen.add(categoryDedupeKey);

            const firstSeen = globalSeen.get(categoryDedupeKey);
            if (firstSeen) {
                droppedDuplicateGlobal += 1;
                globalDuplicateDetails.push({
                    keep: firstSeen,
                    drop: {
                        categoryId,
                        categoryLabel,
                        itemIndex,
                        id: String(item?.id || '').trim(),
                        name,
                        url
                    }
                });
                return;
            }

            let id = String(item?.id || '').trim();
            if (!id) {
                id = createStableItemId(`${categoryId}|${name}|${url}|${itemIndex}`);
                generatedItemIdCount += 1;
            }

            const cleanedItem = { id, name, url };
            const normalizedSrc = normalizeIconSource(item?.src);
            if (normalizedSrc) {
                cleanedItem.src = normalizedSrc;
                preservedSrcCount += 1;
            }

            const normalizedBgColor = normalizeBgColor(item?.['bg-color']) || normalizeBgColor(item?.backgroundColor);
            if (normalizedBgColor) {
                cleanedItem['bg-color'] = normalizedBgColor;
                preservedBgColorCount += 1;
            } else if (normalizedSrc) {
                cleanedItem['bg-color'] = '#f0f9ff';
                preservedBgColorCount += 1;
            }
            outputItems.push(cleanedItem);

            globalSeen.set(categoryDedupeKey, {
                categoryId,
                categoryLabel,
                itemIndex: outputItems.length - 1,
                id,
                name,
                url
            });
        });

        return {
            id: categoryId,
            label: categoryLabel,
            items: outputItems
        };
    });

    const cleaned = {
        version: 1,
        categories: cleanedCategories
    };

    const totalItems = cleanedCategories.reduce((sum, category) => sum + category.items.length, 0);
    const report = {
        inputFile: INPUT_FILE,
        categoryCount: cleanedCategories.length,
        totalItems,
        droppedInvalid,
        droppedDuplicateInCategory,
        droppedDuplicateGlobal,
        generatedItemIdCount,
        preservedSrcCount,
        preservedBgColorCount,
        globalDuplicateDetails
    };

    return { cleaned, report };
}

function main() {
    const raw = fs.readFileSync(INPUT_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const { cleaned, report } = cleanNavData(parsed);

    fs.writeFileSync(INPUT_FILE, `${JSON.stringify(cleaned, null, 2)}\n`, 'utf8');
    fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    console.log(JSON.stringify({
        categoryCount: report.categoryCount,
        totalItems: report.totalItems,
        droppedInvalid: report.droppedInvalid,
        droppedDuplicateInCategory: report.droppedDuplicateInCategory,
        droppedDuplicateGlobal: report.droppedDuplicateGlobal,
        generatedItemIdCount: report.generatedItemIdCount,
        preservedSrcCount: report.preservedSrcCount,
        preservedBgColorCount: report.preservedBgColorCount,
        reportFile: REPORT_FILE
    }, null, 2));
}

main();
