const SEARCH_SAMPLE_LIMIT = 40;

const perfState = {
    initialized: false,
    bootstrapStartMs: 0,
    bootstrapDurationMs: 0,
    fcpMs: null,
    siteFirstBatch: null,
    searchSamples: []
};

function now() {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        return performance.now();
    }
    return Date.now();
}

function roundTo2(value) {
    return Math.round(value * 100) / 100;
}

function toSearchStats() {
    const durations = perfState.searchSamples
        .map((item) => item.durationMs)
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => a - b);

    if (!durations.length) {
        return {
            sampleCount: 0,
            avgMs: 0,
            p95Ms: 0
        };
    }

    const total = durations.reduce((sum, value) => sum + value, 0);
    const p95Index = Math.min(durations.length - 1, Math.floor(durations.length * 0.95));

    return {
        sampleCount: durations.length,
        avgMs: roundTo2(total / durations.length),
        p95Ms: roundTo2(durations[p95Index])
    };
}

function observePaintMetrics() {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;

    try {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint' && perfState.fcpMs === null) {
                    perfState.fcpMs = roundTo2(entry.startTime);
                }
            }
        });
        observer.observe({ type: 'paint', buffered: true });
    } catch {
        // Ignore browser compatibility errors.
    }
}

export function initPerfBaseline() {
    if (perfState.initialized) return;
    perfState.initialized = true;
    observePaintMetrics();
}

export function markBootstrapStart() {
    perfState.bootstrapStartMs = now();
}

export function markBootstrapEnd() {
    if (!perfState.bootstrapStartMs) return;
    perfState.bootstrapDurationMs = roundTo2(now() - perfState.bootstrapStartMs);
    console.info('[PerfBaseline] Bootstrap', {
        bootstrapMs: perfState.bootstrapDurationMs,
        fcpMs: perfState.fcpMs
    });
}

export function recordSearchLatency(query, resultCount, durationMs) {
    if (!Number.isFinite(durationMs)) return;

    perfState.searchSamples.push({
        queryLength: String(query || '').length,
        resultCount: Number(resultCount) || 0,
        durationMs: roundTo2(durationMs),
        timestamp: Date.now()
    });

    if (perfState.searchSamples.length > SEARCH_SAMPLE_LIMIT) {
        perfState.searchSamples.shift();
    }

    if (perfState.searchSamples.length % 10 === 0) {
        console.info('[PerfBaseline] Search', toSearchStats());
    }
}

export function recordSiteFirstBatch(durationMs, renderedCount, totalCount) {
    if (!Number.isFinite(durationMs)) return;
    perfState.siteFirstBatch = {
        durationMs: roundTo2(durationMs),
        renderedCount: Number(renderedCount) || 0,
        totalCount: Number(totalCount) || 0
    };

    console.info('[PerfBaseline] SiteFirstBatch', perfState.siteFirstBatch);
}

export function getPerfBaselineSnapshot() {
    return {
        bootstrapDurationMs: perfState.bootstrapDurationMs,
        fcpMs: perfState.fcpMs,
        siteFirstBatch: perfState.siteFirstBatch,
        search: toSearchStats()
    };
}
