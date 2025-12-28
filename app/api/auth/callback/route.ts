import { NextRequest, NextResponse } from 'next/server';
import { parse, serialize } from 'cookie';
import { createSpotifyApi } from '@/lib/spotify';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Check for authorization errors from Spotify
    if (error) {
        return NextResponse.redirect(`${baseUrl}?error=${encodeURIComponent(error)}`);
    }

    // Validate state (CSRF protection - PRD 3.2)
    const cookies = parse(request.headers.get('cookie') || '');
    const savedState = cookies.oauth_state;

    if (!state || !savedState || state !== savedState) {
        return NextResponse.redirect(`${baseUrl}?error=invalid_state`);
    }

    if (!code) {
        return NextResponse.redirect(`${baseUrl}?error=missing_code`);
    }

    try {
        const spotifyApi = createSpotifyApi();
        const data = await spotifyApi.authorizationCodeGrant(code);

        const { refresh_token } = data.body;

        // Create response redirecting to home
        const response = NextResponse.redirect(baseUrl);

        // Store ONLY refresh_token (PRD 3.1 - never store access token)
        // Cookie security per PRD 3.3
        response.headers.append(
            'Set-Cookie',
            serialize('sp_refresh_token', refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 30, // 30 days
            })
        );

        // Clear state cookie
        response.headers.append(
            'Set-Cookie',
            serialize('oauth_state', '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 0,
            })
        );

        return response;
    } catch (err) {
        console.error('Spotify callback error:', err);
        return NextResponse.redirect(`${baseUrl}?error=auth_failed`);
    }
}
