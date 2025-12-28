import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'cookie';
import {
    extractPlaylistId,
    fetchPlaylistTracks,
    getAccessTokenFromRefresh
} from '@/lib/spotify';
import {
    checkRateLimit,
    getClientIp,
    getFingerprint,
    generateRequestId
} from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
    const requestId = generateRequestId();

    // Get fingerprint for rate limiting (PRD 3.11)
    const ip = getClientIp(request.headers);
    const userAgent = request.headers.get('user-agent') || '';
    const fingerprint = getFingerprint(ip, userAgent);

    // Check rate limit (PRD 3.5 - 3 req/min for playlist)
    const rateLimitResult = checkRateLimit(fingerprint, 'playlist');

    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            {
                error: 'rate_limit_exceeded',
                message: 'Too many playlist requests. Please wait.',
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
            { error: 'auth_expired', message: 'Please login with Spotify first.' },
            { status: 401, headers: { 'X-Request-Id': requestId } }
        );
    }

    try {
        // Parse request body
        const body = await request.json();
        const { playlistUrl, offset = 0 } = body;

        if (!playlistUrl) {
            return NextResponse.json(
                { error: 'bad_request', message: 'Please provide a playlist URL.' },
                { status: 400, headers: { 'X-Request-Id': requestId } }
            );
        }

        // Extract playlist ID (PRD 3.8 validation)
        const playlistId = extractPlaylistId(playlistUrl);

        if (!playlistId) {
            return NextResponse.json(
                { error: 'invalid_playlist', message: 'Could not parse playlist URL. Check the format.' },
                { status: 400, headers: { 'X-Request-Id': requestId } }
            );
        }

        // Get fresh access token (PRD 3.1 - refresh on every call)
        const { accessToken } = await getAccessTokenFromRefresh(refreshToken);

        // Fetch playlist tracks with batching (PRD 3.4)
        const result = await fetchPlaylistTracks(accessToken, playlistId, offset);

        return NextResponse.json(result, { headers: { 'X-Request-Id': requestId } });

    } catch (err: unknown) {
        console.error(`[${requestId}] Playlist fetch error:`, err);

        // Handle Spotify API errors (PRD 3.8)
        if (err && typeof err === 'object' && 'statusCode' in err) {
            const spotifyErr = err as { statusCode: number; body?: { error?: { message?: string } } };

            if (spotifyErr.statusCode === 404) {
                return NextResponse.json(
                    { error: 'playlist_not_found', message: 'Playlist not found. Check the URL.' },
                    { status: 404, headers: { 'X-Request-Id': requestId } }
                );
            }

            if (spotifyErr.statusCode === 403) {
                return NextResponse.json(
                    { error: 'playlist_not_accessible', message: 'This playlist is private or unavailable.' },
                    { status: 403, headers: { 'X-Request-Id': requestId } }
                );
            }

            if (spotifyErr.statusCode === 401) {
                return NextResponse.json(
                    { error: 'auth_expired', message: 'Session expired. Please login again.' },
                    { status: 401, headers: { 'X-Request-Id': requestId } }
                );
            }
        }

        return NextResponse.json(
            { error: 'server_error', message: 'Failed to fetch playlist. Please try again.' },
            { status: 500, headers: { 'X-Request-Id': requestId } }
        );
    }
}
