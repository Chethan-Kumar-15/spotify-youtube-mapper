import crypto from 'crypto';

// In-memory rate limit store
// Note: Resets on cold start (PRD 3.7)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Rate limit configurations per endpoint (PRD 3.5)
export const RATE_LIMITS = {
    playlist: { maxRequests: 3, windowMs: 60 * 1000 },    // 3 req/min
    search: { maxRequests: 10, windowMs: 60 * 1000 },    // 10 req/min
    refresh: { maxRequests: 5, windowMs: 60 * 1000 },    // 5 req/min
} as const;

export type RateLimitEndpoint = keyof typeof RATE_LIMITS;

/**
 * Generate fingerprint from IP + User-Agent (PRD 3.11)
 * Non-security-critical, just abuse reduction
 */
export function getFingerprint(ip: string, userAgent: string): string {
    const raw = `${ip}|${userAgent}`;
    return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

/**
 * Get client IP from request headers
 */
export function getClientIp(headers: Headers): string {
    // Check x-forwarded-for (Cloudflare/Vercel)
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    // Cloudflare specific
    const cfIp = headers.get('cf-connecting-ip');
    if (cfIp) return cfIp;

    // Fallback
    return 'unknown';
}

/**
 * Check rate limit and return result
 * Returns: { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
    fingerprint: string,
    endpoint: RateLimitEndpoint
): { allowed: boolean; remaining: number; resetIn: number } {
    const config = RATE_LIMITS[endpoint];
    const key = `${endpoint}:${fingerprint}`;
    const now = Date.now();

    const existing = rateLimitStore.get(key);

    // Clean up expired entries
    if (existing && existing.resetAt <= now) {
        rateLimitStore.delete(key);
    }

    const current = rateLimitStore.get(key);

    if (!current) {
        // First request in window
        rateLimitStore.set(key, {
            count: 1,
            resetAt: now + config.windowMs,
        });
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetIn: config.windowMs,
        };
    }

    if (current.count >= config.maxRequests) {
        // Rate limit exceeded
        return {
            allowed: false,
            remaining: 0,
            resetIn: current.resetAt - now,
        };
    }

    // Increment count
    current.count += 1;
    rateLimitStore.set(key, current);

    return {
        allowed: true,
        remaining: config.maxRequests - current.count,
        resetIn: current.resetAt - now,
    };
}

/**
 * Generate unique request ID for logging (PRD 3.14)
 */
export function generateRequestId(): string {
    return crypto.randomBytes(8).toString('hex');
}
