import yts from 'yt-search';
import pLimit from 'p-limit';

// Type definitions
export interface YouTubeResult {
    youtubeUrl: string | null;
    title: string | null;
    channel: string | null;
    duration: string | null;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | null;
    reason: 'matched' | 'no_results' | 'low_confidence' | 'negative_keyword';
}

export interface TrackInput {
    name: string;
    artists: string;
}

export interface SearchResult {
    track: TrackInput;
    youtubeUrl: string | null;
    title: string | null;
    channel: string | null;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | null;
    reason: 'matched' | 'no_results' | 'low_confidence' | 'negative_keyword';
}

// Negative keywords to skip (PRD 3.6)
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

// Positive indicators for scoring
const POSITIVE_KEYWORDS = ['official', 'audio', 'music video', 'vevo'];

/**
 * Check if a video title contains negative keywords
 */
function hasNegativeKeyword(title: string): boolean {
    const lower = title.toLowerCase();
    return NEGATIVE_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Score a video based on title match quality
 */
function scoreVideo(video: yts.VideoSearchResult, track: TrackInput): number {
    let score = 0;
    const title = video.title.toLowerCase();
    const trackName = track.name.toLowerCase();
    const artist = track.artists.split(',')[0].toLowerCase().trim();

    // Title contains track name
    if (title.includes(trackName)) score += 30;

    // Title contains artist
    if (title.includes(artist)) score += 20;

    // Official/VEVO indicators
    if (video.author.name.toLowerCase().includes('vevo')) score += 25;
    if (video.author.name.toLowerCase().includes(artist)) score += 15;

    // Positive keywords in title
    for (const kw of POSITIVE_KEYWORDS) {
        if (title.includes(kw)) {
            score += 10;
            break;
        }
    }

    // High view count bonus
    if (video.views > 10000000) score += 10;
    else if (video.views > 1000000) score += 5;

    return score;
}

/**
 * Determine confidence level based on score
 */
function getConfidence(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (score >= 60) return 'HIGH';
    if (score >= 35) return 'MEDIUM';
    return 'LOW';
}

/**
 * Search YouTube for a single track
 * Never throws - returns null youtubeUrl on failure (PRD 3.6)
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

            // Filter out negative keyword matches and score remaining
            const candidates = videos
                .slice(0, 10) // Check top 10
                .filter(v => !hasNegativeKeyword(v.title))
                .map(v => ({ video: v, score: scoreVideo(v, track) }))
                .sort((a, b) => b.score - a.score);

            if (candidates.length === 0) {
                // All results had negative keywords
                return {
                    youtubeUrl: null,
                    title: null,
                    channel: null,
                    duration: null,
                    confidence: null,
                    reason: 'negative_keyword',
                };
            }

            const best = candidates[0];
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
 * Max 2 concurrent searches (PRD 3.10)
 * Max 10 tracks per batch (caller responsibility)
 */
export async function searchTracks(tracks: TrackInput[]): Promise<SearchResult[]> {
    const limit = pLimit(2); // Max 2 concurrent (PRD 3.10)

    const promises = tracks.map(track =>
        limit(async () => {
            const result = await searchSingleTrack(track);
            return {
                track,
                youtubeUrl: result.youtubeUrl,
                title: result.title,
                channel: result.channel,
                confidence: result.confidence,
                reason: result.reason,
            };
        })
    );

    return Promise.all(promises);
}
