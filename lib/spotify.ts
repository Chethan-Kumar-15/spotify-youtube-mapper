import SpotifyWebApi from 'spotify-web-api-node';

// Type definitions
export interface SpotifyTrack {
    name: string;
    artists: string;
    primaryArtist: string;
    duration_ms: number;
    spotifyUri: string;
}

export interface PlaylistResult {
    processed: number;
    total: number;
    tracks: SpotifyTrack[];
    done: boolean;
    nextOffset: number;
    playlistName: string;
}

/**
 * Create Spotify API client with credentials
 */
export function createSpotifyApi(): SpotifyWebApi {
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
    }

    return new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        redirectUri: process.env.REDIRECT_URI,
    });
}

/**
 * Exchange refresh token for fresh access token
 * Called on EVERY Spotify API request (per PRD 3.1)
 */
export async function getAccessTokenFromRefresh(
    refreshToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
    const spotifyApi = createSpotifyApi();
    spotifyApi.setRefreshToken(refreshToken);

    const data = await spotifyApi.refreshAccessToken();
    return {
        accessToken: data.body.access_token,
        expiresIn: data.body.expires_in,
    };
}

/**
 * Extract playlist ID from URL or URI
 * Supports:
 * - https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
 * - spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
 * - 37i9dQZF1DXcBWIGoYBM5M (raw ID)
 */
export function extractPlaylistId(urlOrId: string): string | null {
    if (!urlOrId) return null;

    // Full URL format
    const urlMatch = urlOrId.match(/playlist\/([a-zA-Z0-9]+)(\?|$)/);
    if (urlMatch) return urlMatch[1];

    // URI format
    const uriMatch = urlOrId.match(/spotify:playlist:([a-zA-Z0-9]+)/);
    if (uriMatch) return uriMatch[1];

    // Raw ID (22 chars alphanumeric)
    if (/^[a-zA-Z0-9]{22}$/.test(urlOrId)) return urlOrId;

    return null;
}

/**
 * Generate deduplication key for a track (PRD 3.9)
 * Format: name|primaryArtist|durationBucket
 * durationBucket = Math.floor(duration_ms / 3000) for ±3s tolerance
 */
function getDedupeKey(track: SpotifyTrack): string {
    const durationBucket = Math.floor(track.duration_ms / 3000);
    return `${track.name.toLowerCase()}|${track.primaryArtist.toLowerCase()}|${durationBucket}`;
}

/**
 * Fetch playlist tracks with batching and deduplication
 * Returns max 50 tracks per call (PRD 3.10)
 */
export async function fetchPlaylistTracks(
    accessToken: string,
    playlistId: string,
    offset: number = 0
): Promise<PlaylistResult> {
    const BATCH_SIZE = 50; // Hard cap per PRD 3.10

    const spotifyApi = createSpotifyApi();
    spotifyApi.setAccessToken(accessToken);

    // Get playlist info for total count and name
    const playlistInfo = await spotifyApi.getPlaylist(playlistId, { fields: 'name,tracks.total' });
    const total = playlistInfo.body.tracks.total;
    const playlistName = playlistInfo.body.name;

    // Fetch tracks with Spotify's limit
    const data = await spotifyApi.getPlaylistTracks(playlistId, {
        offset,
        limit: BATCH_SIZE,
        fields: 'items(track(name,artists,duration_ms,uri))',
    });

    const seen = new Set<string>();
    const tracks: SpotifyTrack[] = [];

    for (const item of data.body.items || []) {
        if (!item.track || item.track.type !== 'track') continue;

        const track: SpotifyTrack = {
            name: item.track.name,
            artists: item.track.artists.map(a => a.name).join(', '),
            primaryArtist: item.track.artists[0]?.name || 'Unknown',
            duration_ms: item.track.duration_ms,
            spotifyUri: item.track.uri,
        };

        // Deduplicate (PRD 3.9)
        const key = getDedupeKey(track);
        if (seen.has(key)) continue;
        seen.add(key);

        tracks.push(track);
    }

    const processed = offset + tracks.length;
    const done = processed >= total || data.body.items.length < BATCH_SIZE;

    return {
        processed,
        total,
        tracks,
        done,
        nextOffset: done ? offset : offset + BATCH_SIZE,
        playlistName,
    };
}
