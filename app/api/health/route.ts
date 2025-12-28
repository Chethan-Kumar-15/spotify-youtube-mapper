import { NextResponse } from 'next/server';
import { getCacheStats } from '@/lib/cache';

export async function GET() {
    const timestamp = Date.now();
    const cacheStats = getCacheStats();

    // Check Spotify reachability (simple DNS check)
    let spotifyStatus = 'unknown';
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const res = await fetch('https://api.spotify.com/v1/', {
            method: 'HEAD',
            signal: controller.signal,
        });
        clearTimeout(timeout);

        spotifyStatus = res.status === 401 ? 'reachable' : 'reachable'; // 401 means API is up
    } catch {
        spotifyStatus = 'unreachable';
    }

    // Check YouTube reachability
    let youtubeStatus = 'unknown';
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const res = await fetch('https://www.youtube.com/', {
            method: 'HEAD',
            signal: controller.signal,
        });
        clearTimeout(timeout);

        youtubeStatus = res.ok ? 'reachable' : 'unreachable';
    } catch {
        youtubeStatus = 'unreachable';
    }

    return NextResponse.json({
        status: 'ok',
        spotify: spotifyStatus,
        youtube: youtubeStatus,
        timestamp,
        cache: cacheStats,
    });
}
