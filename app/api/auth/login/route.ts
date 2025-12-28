import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { serialize } from 'cookie';

export async function GET() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.REDIRECT_URI;

    if (!clientId || !redirectUri) {
        return NextResponse.json(
            { error: 'missing_config', message: 'Server configuration error' },
            { status: 500 }
        );
    }

    // Generate random state for CSRF protection (PRD 3.2)
    const state = crypto.randomBytes(16).toString('hex');

    // Scopes for reading playlists
    const scopes = [
        'playlist-read-private',
        'playlist-read-collaborative',
        'playlist-read-public',
    ].join(' ');

    // Build Spotify authorization URL
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: scopes,
        redirect_uri: redirectUri,
        state,
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

    // Create response with redirect
    const response = NextResponse.redirect(authUrl);

    // Set state cookie for validation in callback (PRD 3.3)
    response.headers.append(
        'Set-Cookie',
        serialize('oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 300, // 5 minutes
        })
    );

    return response;
}
