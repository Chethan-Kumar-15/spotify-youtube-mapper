import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { searchTracks, TrackInput, SearchResult } from '@/lib/youtube';
import { getCachedResult, setCachedResult } from '@/lib/cache';
import {
    checkRateLimit,
    getClientIp,
    getFingerprint,
    generateRequestId
} from '@/lib/rateLimit';

const MAX_BATCH_SIZE = 10; // PRD 3.10

export async function POST(request: NextRequest) {
    const requestId = generateRequestId();

    // Get fingerprint for rate limiting (PRD 3.11)
    const ip = getClientIp(request.headers);
    const userAgent = request.headers.get('user-agent') || '';
    const fingerprint = getFingerprint(ip, userAgent);

    // Check rate limit (PRD 3.5 - 10 req/min for search)
    const rateLimitResult = checkRateLimit(fingerprint, 'search');

    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            {
                error: 'rate_limit_exceeded',
                message: 'Too many search requests. Please wait.',
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

    // Verify user is authenticated (has refresh token)
    const cookieStore = await cookies();
    if (!cookieStore.get('sp_refresh_token')?.value) {
        return NextResponse.json(
            { error: 'auth_expired', message: 'Please login with Spotify first.' },
            { status: 401, headers: { 'X-Request-Id': requestId } }
        );
    }

    try {
        const body = await request.json();
        const { tracks } = body as { tracks: TrackInput[] };

        if (!Array.isArray(tracks) || tracks.length === 0) {
            return NextResponse.json(
                { error: 'bad_request', message: 'Please provide an array of tracks.' },
                { status: 400, headers: { 'X-Request-Id': requestId } }
            );
        }

        // Validate track structure (name and artists are required, duration_ms is optional)
        const invalidTrack = tracks.find(t => !t.name || !t.artists);
        if (invalidTrack) {
            return NextResponse.json(
                { error: 'bad_request', message: 'Each track must have name and artists fields.' },
                { status: 400, headers: { 'X-Request-Id': requestId } }
            );
        }

        // Enforce batch size limit (PRD 3.10)
        if (tracks.length > MAX_BATCH_SIZE) {
            return NextResponse.json(
                {
                    error: 'batch_too_large',
                    message: `Maximum ${MAX_BATCH_SIZE} tracks per request.`
                },
                { status: 400, headers: { 'X-Request-Id': requestId } }
            );
        }

        // Check cache first
        const results: SearchResult[] = [];
        const uncachedTracks: TrackInput[] = [];

        for (const track of tracks) {
            const cached = getCachedResult(track.name, track.artists);
            if (cached) {
                results.push(cached);
            } else {
                uncachedTracks.push(track);
            }
        }

        // Search uncached tracks
        if (uncachedTracks.length > 0) {
            const searchResults = await searchTracks(uncachedTracks);

            // Cache and add results
            for (const result of searchResults) {
                setCachedResult(result.track.name, result.track.artists, result);
                results.push(result);
            }
        }

        // Sort results to match input order
        const orderedResults = tracks.map(track =>
            results.find(r =>
                r.track.name === track.name && r.track.artists === track.artists
            )
        ).filter((r): r is SearchResult => r !== undefined);

        return NextResponse.json(
            {
                results: orderedResults,
                cached: tracks.length - uncachedTracks.length,
                searched: uncachedTracks.length,
            },
            { headers: { 'X-Request-Id': requestId } }
        );

    } catch (err) {
        console.error(`[${requestId}] Search error:`, err);

        return NextResponse.json(
            { error: 'server_error', message: 'Search failed. Please try again.' },
            { status: 500, headers: { 'X-Request-Id': requestId } }
        );
    }
}
