import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'cookie';
import { getAccessTokenFromRefresh } from '@/lib/spotify';
import { checkRateLimit, getClientIp, getFingerprint, generateRequestId } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
    const requestId = generateRequestId();

    // Get fingerprint for rate limiting (PRD 3.11)
    const ip = getClientIp(request.headers);
    const userAgent = request.headers.get('user-agent') || '';
    const fingerprint = getFingerprint(ip, userAgent);

    // Check rate limit (PRD 3.5 - 5 req/min for refresh)
    const rateLimitResult = checkRateLimit(fingerprint, 'refresh');

    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            {
                error: 'rate_limit_exceeded',
                message: 'Too many refresh attempts. Please wait.',
                retryAfter: Math.ceil(rateLimitResult.resetIn / 1000),
            },
            {
                status: 429,
                headers: {
                    'X-Request-Id': requestId,
                    'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)),
                },
            }
        );
    }

    // Get refresh token from cookie
    const cookies = parse(request.headers.get('cookie') || '');
    const refreshToken = cookies.sp_refresh_token;

    if (!refreshToken) {
        return NextResponse.json(
            { error: 'auth_expired', message: 'No refresh token found. Please login again.' },
            { status: 401, headers: { 'X-Request-Id': requestId } }
        );
    }

    try {
        // Exchange refresh token for fresh access token (PRD 3.1)
        const { accessToken, expiresIn } = await getAccessTokenFromRefresh(refreshToken);

        return NextResponse.json(
            {
                success: true,
                accessToken,  // Returned to caller for immediate use (not stored)
                expiresIn,
            },
            { headers: { 'X-Request-Id': requestId } }
        );
    } catch (err) {
        console.error(`[${requestId}] Token refresh failed:`, err);

        return NextResponse.json(
            { error: 'refresh_failed', message: 'Failed to refresh token. Please login again.' },
            { status: 401, headers: { 'X-Request-Id': requestId } }
        );
    }
}
