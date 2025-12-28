import { SearchResult } from './youtube';

// In-memory cache store
// Note: Resets on cold start (PRD 3.7)
const cacheStore = new Map<string, { data: SearchResult; timestamp: number }>();

// Cache TTL: 24 hours
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Generate cache key for a track
 */
function getCacheKey(name: string, artists: string): string {
    return `${name.toLowerCase()}|${artists.toLowerCase()}`;
}

/**
 * Get cached YouTube result for a track
 */
export function getCachedResult(name: string, artists: string): SearchResult | null {
    const key = getCacheKey(name, artists);
    const entry = cacheStore.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        cacheStore.delete(key);
        return null;
    }

    return entry.data;
}

/**
 * Cache a YouTube result for a track
 */
export function setCachedResult(name: string, artists: string, result: SearchResult): void {
    const key = getCacheKey(name, artists);
    cacheStore.set(key, {
        data: result,
        timestamp: Date.now(),
    });
}

/**
 * Clear expired cache entries (called periodically)
 */
export function cleanupCache(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of cacheStore.entries()) {
        if (now - entry.timestamp > CACHE_TTL_MS) {
            cacheStore.delete(key);
            cleaned++;
        }
    }

    return cleaned;
}

/**
 * Get cache stats for health endpoint
 */
export function getCacheStats(): { size: number } {
    return { size: cacheStore.size };
}
