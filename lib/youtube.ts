import yts from 'yt-search';
import pLimit from 'p-limit';
import * as fuzzball from 'fuzzball';

// Type definitions
export interface YouTubeResult {
    youtubeUrl: string | null;
    title: string | null;
    channel: string | null;
    duration: string | null;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | null;
    reason: 'matched' | 'no_results' | 'low_confidence' | 'negative_keyword' | 'no_match' | 'search_error';
}

export interface TrackInput {
    name: string;
    artists: string;
    duration_ms?: number; // Optional for backwards compatibility
}

export interface SearchResult {
    track: TrackInput;
    youtubeUrl: string | null;
    title: string | null;
    channel: string | null;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | null;
    reason: 'matched' | 'no_results' | 'low_confidence' | 'negative_keyword' | 'no_match' | 'search_error';
}

interface ScoredCandidate {
    video: yts.VideoSearchResult;
    score: number;
    hasDurationMatch: boolean;
    isOfficial: boolean;
    fuzzyScore: number;
}

// Constants
const NEGATIVE_KEYWORDS = [
    'karaoke',
    'cover',
    'instrumental',
    'remix',
    'tutorial',
    'reaction',
    'live',
    'acoustic version',
    'piano version',
    'slowed',
    'reverb',
    '8d audio',
];

const POSITIVE_KEYWORDS = ['official', 'audio', 'music video', 'vevo'];

const OFFICIAL_PATTERNS = ['vevo', ' - topic', 'official'];

const MIN_MATCH_THRESHOLD = 40; // Below this, return NO_MATCH

/**
 * Normalize title for better matching by removing featured artist annotations
 */
function normalizeTitleForMatching(title: string): string {
    return title
        .replace(/\(feat\..*?\)/gi, '')  // Remove (feat. ...)
        .replace(/\(ft\..*?\)/gi, '')    // Remove (ft. ...)
        .replace(/feat\..*$/gi, '')      // Remove trailing feat.
        .trim();
}

/**
 * Parse YouTube timestamp (e.g., "3:45" or "1:23:45") to seconds
 */
function parseDuration(timestamp: string): number {
    if (!timestamp) return 0;
    const parts = timestamp.split(':').map(Number);
    // Guard against NaN from malformed input
    if (parts.some(isNaN)) return 0;
    return parts.reduce((acc, val) => acc * 60 + val, 0);
}
/**
 * Check if YouTube duration matches Spotify duration within tolerance
 */
function isDurationMatch(
    spotifyMs: number,
    ytTimestamp: string,
    tolerance = 5
): boolean {
    const spotifySeconds = Math.round(spotifyMs / 1000);
    const ytSeconds = parseDuration(ytTimestamp);

    // Guard: malformed duration
    if (ytSeconds === 0) return false;

    return Math.abs(spotifySeconds - ytSeconds) <= tolerance;
}

/**
 * Check if video should be filtered based on duration
 * Filters: malformed (0s), compilations (+30s), snippets (-10s)
 */
function shouldFilterByDuration(
    spotifyMs: number,
    ytTimestamp: string
): boolean {
    const spotifySeconds = Math.round(spotifyMs / 1000);
    const ytSeconds = parseDuration(ytTimestamp);

    if (ytSeconds === 0) return true; // Malformed
    if (ytSeconds > spotifySeconds + 30) return true; // Likely compilation
    if (ytSeconds < spotifySeconds - 10) return true; // Likely snippet/short

    return false;
}

/**
 * Check if a video title contains negative keywords
 */
function hasNegativeKeyword(title: string): boolean {
    const lower = title.toLowerCase();
    return NEGATIVE_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Check if channel matches official patterns
 */
function isOfficialChannel(channel: string, artist: string): boolean {
    const channelLower = channel.toLowerCase();

    // Check whitelist patterns
    if (OFFICIAL_PATTERNS.some(p => channelLower.includes(p))) {
        return true;
    }

    // Check if channel matches artist name closely
    return fuzzball.token_set_ratio(artist, channel) > 85;
}

/**
 * Score a video candidate based on multiple factors
 * Returns normalized score 0-100
 */
function scoreVideo(
    video: yts.VideoSearchResult,
    track: TrackInput
): ScoredCandidate {
    let score = 0;
    const artist = track.artists.split(',')[0].trim();

    // 1. Fuzzy title matching (0-40 points)
    const normalizedSpotify = normalizeTitleForMatching(`${track.name} ${artist}`);
    const normalizedYT = normalizeTitleForMatching(video.title);
    const fuzzyRatio = fuzzball.token_set_ratio(normalizedSpotify, normalizedYT);
    const fuzzyPoints = (fuzzyRatio / 100) * 40;
    score += fuzzyPoints;

    // 2. Duration match (25 points) - only if duration_ms provided
    let hasDurationMatch = false;
    if (track.duration_ms && video.timestamp) {
        if (isDurationMatch(track.duration_ms, video.timestamp)) {
            score += 25;
            hasDurationMatch = true;
        }
    }

    // 3. Artist verification (15 points) - fuzzy matching
    const titleArtistSimilarity = fuzzball.partial_ratio(
        artist.toLowerCase(),
        video.title.toLowerCase()
    );
    const channelArtistSimilarity = fuzzball.partial_ratio(
        artist.toLowerCase(),
        video.author.name.toLowerCase()
    );

    if (titleArtistSimilarity > 80 || channelArtistSimilarity > 80) {
        score += 15;
    }

    // 4. Official/VEVO/Topic channel (10 points)
    const isOfficial = isOfficialChannel(video.author.name, artist);
    if (isOfficial) {
        score += 10;
    }

    // 5. Positive keywords (5 points)
    const titleLower = video.title.toLowerCase();
    const hasPositiveKeyword = POSITIVE_KEYWORDS.some(kw =>
        titleLower.includes(kw)
    );
    if (hasPositiveKeyword) {
        score += 5;
    }

    // 6. View count (5 points max)
    let viewPoints = 0;
    if (video.views > 10000000) viewPoints = 5;
    else if (video.views > 1000000) viewPoints = 2.5;
    score += viewPoints;

    return {
        video,
        score: Math.min(score, 100), // Safety cap
        hasDurationMatch,
        isOfficial,
        fuzzyScore: fuzzyRatio,
    };
}

/**
 * Compare two candidates for tie-breaking
 * Priority: score > duration match > official > fuzzy score > views
 */
function compareCandidates(a: ScoredCandidate, b: ScoredCandidate): number {
    if (a.score !== b.score) return b.score - a.score;

    // Tie-break: duration match
    const aDuration = a.hasDurationMatch ? 1 : 0;
    const bDuration = b.hasDurationMatch ? 1 : 0;
    if (aDuration !== bDuration) return bDuration - aDuration;

    // Tie-break: official channel
    const aOfficial = a.isOfficial ? 1 : 0;
    const bOfficial = b.isOfficial ? 1 : 0;
    if (aOfficial !== bOfficial) return bOfficial - aOfficial;

    // Tie-break: fuzzy score
    if (a.fuzzyScore !== b.fuzzyScore) return b.fuzzyScore - a.fuzzyScore;

    // Final: view count
    return b.video.views - a.video.views;
}

/**
 * Determine confidence level based on score
 */
function getConfidence(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (score >= 70) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    return 'LOW';
}

/**
 * Search YouTube for a single track
 * Never throws - returns null youtubeUrl on failure
 */
async function searchSingleTrack(track: TrackInput): Promise<YouTubeResult> {
    const queries = [
        `${track.name} ${track.artists} official audio`,
        `${track.name} ${track.artists} official`,
        `${track.name} ${track.artists}`,
    ];

    for (const query of queries) {
        try {
            const result = await yts(query);
            const videos = result.videos || [];

            if (videos.length === 0) continue;

            // Filter and score candidates
            const candidates: ScoredCandidate[] = [];

            for (const video of videos.slice(0, 10)) {
                // Skip negative keywords
                if (hasNegativeKeyword(video.title)) continue;

                // Skip duration filtered videos
                if (track.duration_ms && video.timestamp) {
                    if (shouldFilterByDuration(track.duration_ms, video.timestamp)) {
                        continue;
                    }
                }

                const scored = scoreVideo(video, track);
                candidates.push(scored);
            }

            // All results filtered out
            if (candidates.length === 0) {
                return {
                    youtubeUrl: null,
                    title: null,
                    channel: null,
                    duration: null,
                    confidence: null,
                    reason: 'negative_keyword',
                };
            }

            // Sort by score and tie-breaking rules
            candidates.sort(compareCandidates);

            const best = candidates[0];

            // Check minimum threshold
            if (best.score < MIN_MATCH_THRESHOLD) {
                return {
                    youtubeUrl: null,
                    title: null,
                    channel: null,
                    duration: null,
                    confidence: null,
                    reason: 'no_match',
                };
            }

            const confidence = getConfidence(best.score);

            return {
                youtubeUrl: best.video.url,
                title: best.video.title,
                channel: best.video.author.name,
                duration: best.video.timestamp,
                confidence,
                reason: confidence === 'LOW' ? 'low_confidence' : 'matched',
            };
        } catch {
            // Continue to next query on error
            continue;
        }
    }

    // All queries failed
    return {
        youtubeUrl: null,
        title: null,
        channel: null,
        duration: null,
        confidence: null,
        reason: 'no_results',
    };
}

/**
 * Search YouTube for multiple tracks with concurrency control
 * Max 2 concurrent searches
 * Returns results even if individual tracks fail
 */
export async function searchTracks(tracks: TrackInput[]): Promise<SearchResult[]> {
    const limit = pLimit(2); // Max 2 concurrent

    const promises = tracks.map(track =>
        limit(async () => {
            try {
                const result = await searchSingleTrack(track);
                return {
                    track,
                    youtubeUrl: result.youtubeUrl,
                    title: result.title,
                    channel: result.channel,
                    confidence: result.confidence,
                    reason: result.reason,
                };
            } catch {
                // Return error state instead of throwing
                return {
                    track,
                    youtubeUrl: null,
                    title: null,
                    channel: null,
                    confidence: null,
                    reason: 'search_error' as const,
                };
            }
        })
    );

    return Promise.all(promises);
}
