# API Routes Pseudo-Code

## Overview

This document provides detailed pseudo-code for all API routes, highlighting architectural decisions, error handling, and control flow. Each route is designed to be stateless, secure, and timeout-proof.

---

## Common Patterns

### Request ID Generation
All routes generate a unique request ID for logging:
```typescript
const requestId = generateRequestId(); // crypto.randomBytes(8).toString('hex')
```

### Cookie Parsing
All routes that need authentication parse cookies:
```typescript
const cookies = parse(request.headers.get('cookie') || '');
const refreshToken = cookies.sp_refresh_token;
```

### Rate Limiting
All routes (except `/api/auth/login`) check rate limits:
```typescript
const ip = getClientIp(request.headers);
const userAgent = request.headers.get('user-agent') || '';
const fingerprint = getFingerprint(ip, userAgent);
const rateLimitResult = checkRateLimit(fingerprint, 'endpoint_name');

if (!rateLimitResult.allowed) {
    return 429 Response with Retry-After header;
}
```

### Error Response Format
Standardized error responses:
```typescript
{
    error: 'error_code',
    message: 'User-friendly message',
    retryAfter?: number  // For rate limits
}
```

---

## Route: `/api/auth/login` (GET)

### Purpose
Initiate OAuth 2.0 flow, generate CSRF state token, redirect to Spotify.

### Pseudo-Code

```
FUNCTION GET /api/auth/login():
    requestId = generateRequestId()
    
    // Validate environment variables
    IF NOT process.env.SPOTIFY_CLIENT_ID OR NOT process.env.REDIRECT_URI:
        RETURN 500 {
            error: 'missing_config',
            message: 'Server configuration error'
        }
    END IF
    
    // Generate cryptographically secure state token (CSRF protection)
    state = crypto.randomBytes(16).toString('hex')
    
    // Build Spotify OAuth scopes
    scopes = [
        'playlist-read-private',
        'playlist-read-collaborative',
        'playlist-read-public'
    ].join(' ')
    
    // Build authorization URL
    params = URLSearchParams({
        response_type: 'code',
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope: scopes,
        redirect_uri: process.env.REDIRECT_URI,
        state: state
    })
    authUrl = 'https://accounts.spotify.com/authorize?' + params.toString()
    
    // Create redirect response
    response = NextResponse.redirect(authUrl)
    
    // Set state cookie (HttpOnly, Secure in production, 5min TTL)
    response.headers.append('Set-Cookie', serialize('oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 300  // 5 minutes
    }))
    
    RETURN response
END FUNCTION
```

### Security Notes
- State token prevents CSRF attacks
- HttpOnly cookie prevents JavaScript access
- Secure flag ensures HTTPS-only in production
- SameSite: Lax allows OAuth redirects

### Error Cases
- Missing configuration → 500 Internal Server Error

### Reference
- Implementation: `app/api/auth/login/route.ts`

---

## Route: `/api/auth/callback` (GET)

### Purpose
Handle OAuth callback, validate state, exchange code for tokens, store refresh token.

### Pseudo-Code

```
FUNCTION GET /api/auth/callback(request):
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL OR 'http://localhost:3000'
    
    // Extract query parameters
    code = request.nextUrl.searchParams.get('code')
    state = request.nextUrl.searchParams.get('state')
    error = request.nextUrl.searchParams.get('error')
    
    // Check for Spotify authorization errors
    IF error:
        RETURN NextResponse.redirect(baseUrl + '?error=' + encodeURIComponent(error))
    END IF
    
    // Validate state (CSRF protection)
    cookies = parse(request.headers.get('cookie') || '')
    savedState = cookies.oauth_state
    
    IF NOT state OR NOT savedState OR state !== savedState:
        RETURN NextResponse.redirect(baseUrl + '?error=invalid_state')
    END IF
    
    // Validate authorization code
    IF NOT code:
        RETURN NextResponse.redirect(baseUrl + '?error=missing_code')
    END IF
    
    TRY:
        // Exchange code for tokens
        spotifyApi = createSpotifyApi()
        data = await spotifyApi.authorizationCodeGrant(code)
        refresh_token = data.body.refresh_token
        
        // Create redirect response
        response = NextResponse.redirect(baseUrl)
        
        // Store ONLY refresh_token (HttpOnly cookie, 30 days)
        response.headers.append('Set-Cookie', serialize('sp_refresh_token', refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30  // 30 days
        }))
        
        // Clear state cookie
        response.headers.append('Set-Cookie', serialize('oauth_state', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0
        }))
        
        RETURN response
        
    CATCH err:
        console.error('Spotify callback error:', err)
        RETURN NextResponse.redirect(baseUrl + '?error=auth_failed')
    END TRY
END FUNCTION
```

### Security Notes
- State validation prevents CSRF attacks
- Only refresh_token stored (access_token discarded)
- HttpOnly cookie prevents JavaScript access
- State cookie cleared after use

### Error Cases
- Invalid/missing state → Redirect to `/?error=invalid_state`
- Missing code → Redirect to `/?error=missing_code`
- Token exchange failure → Redirect to `/?error=auth_failed`
- Spotify authorization error → Redirect to `/?error={error}`

### Reference
- Implementation: `app/api/auth/callback/route.ts`

---

## Route: `/api/auth/refresh` (POST)

### Purpose
Exchange refresh token for fresh access token (utility endpoint, not used directly by frontend).

### Pseudo-Code

```
FUNCTION POST /api/auth/refresh(request):
    requestId = generateRequestId()
    
    // Rate limiting (5 req/min per IP)
    ip = getClientIp(request.headers)
    userAgent = request.headers.get('user-agent') || ''
    fingerprint = getFingerprint(ip, userAgent)
    rateLimitResult = checkRateLimit(fingerprint, 'refresh')
    
    IF NOT rateLimitResult.allowed:
        RETURN 429 {
            error: 'rate_limit_exceeded',
            message: 'Too many refresh attempts. Please wait.',
            retryAfter: Math.ceil(rateLimitResult.resetIn / 1000)
        } WITH HEADERS {
            'X-Request-Id': requestId,
            'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000))
        }
    END IF
    
    // Get refresh token from cookie
    cookies = parse(request.headers.get('cookie') || '')
    refreshToken = cookies.sp_refresh_token
    
    IF NOT refreshToken:
        RETURN 401 {
            error: 'auth_expired',
            message: 'No refresh token found. Please login again.'
        } WITH HEADERS {
            'X-Request-Id': requestId
        }
    END IF
    
    TRY:
        // Exchange refresh token for access token (PRD Principle 2: Token Safety)
        result = await getAccessTokenFromRefresh(refreshToken)
        accessToken = result.accessToken
        expiresIn = result.expiresIn
        
        // Return access token (NOT stored - exists only in memory during request)
        RETURN 200 {
            success: true,
            accessToken: accessToken,
            expiresIn: expiresIn
        } WITH HEADERS {
            'X-Request-Id': requestId
        }
        
    CATCH err:
        console.error('[' + requestId + '] Token refresh failed:', err)
        RETURN 401 {
            error: 'refresh_failed',
            message: 'Failed to refresh token. Please login again.'
        } WITH HEADERS {
            'X-Request-Id': requestId
        }
    END TRY
END FUNCTION
```

### Security Notes
- Access token returned but NOT stored
- Rate limiting prevents abuse
- Refresh token validated before use

### Error Cases
- Rate limit exceeded → 429 with Retry-After
- Missing refresh token → 401 Unauthorized
- Refresh token expired/invalid → 401 Unauthorized

### Reference
- Implementation: `app/api/auth/refresh/route.ts`
- Lib function: `lib/spotify.ts::getAccessTokenFromRefresh()`

---

## Route: `/api/playlist` (POST)

### Purpose
Fetch Spotify playlist tracks in chunks (max 50 per request), with offset-based pagination.

### Request Body
```json
{
    "playlistUrl": "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
    "offset": 0
}
```

### Pseudo-Code

```
FUNCTION POST /api/playlist(request):
    requestId = generateRequestId()
    
    // Rate limiting (3 req/min per IP)
    ip = getClientIp(request.headers)
    userAgent = request.headers.get('user-agent') || ''
    fingerprint = getFingerprint(ip, userAgent)
    rateLimitResult = checkRateLimit(fingerprint, 'playlist')
    
    IF NOT rateLimitResult.allowed:
        RETURN 429 {
            error: 'rate_limit_exceeded',
            message: 'Too many playlist requests. Please wait.',
            retryAfter: Math.ceil(rateLimitResult.resetIn / 1000)
        } WITH HEADERS {
            'X-Request-Id': requestId,
            'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000))
        }
    END IF
    
    // Authenticate (PRD Principle 2: Token Safety)
    cookies = parse(request.headers.get('cookie') || '')
    refreshToken = cookies.sp_refresh_token
    
    IF NOT refreshToken:
        RETURN 401 {
            error: 'auth_expired',
            message: 'Please login with Spotify first.'
        } WITH HEADERS {
            'X-Request-Id': requestId
        }
    END IF
    
    TRY:
        // Parse request body
        body = await request.json()
        playlistUrl = body.playlistUrl
        offset = body.offset OR 0
        
        // Validate playlist URL
        IF NOT playlistUrl:
            RETURN 400 {
                error: 'bad_request',
                message: 'Please provide a playlist URL.'
            } WITH HEADERS {
                'X-Request-Id': requestId
            }
        END IF
        
        // Extract playlist ID (supports URL, URI, or raw ID)
        playlistId = extractPlaylistId(playlistUrl)
        
        IF NOT playlistId:
            RETURN 400 {
                error: 'invalid_playlist',
                message: 'Could not parse playlist URL. Check the format.'
            } WITH HEADERS {
                'X-Request-Id': requestId
            }
        END IF
        
        // Get fresh access token (PRD Principle 2: refresh on every call)
        accessTokenResult = await getAccessTokenFromRefresh(refreshToken)
        accessToken = accessTokenResult.accessToken
        
        // Fetch playlist tracks (PRD Principle 3: Chunk Everything - max 50)
        result = await fetchPlaylistTracks(accessToken, playlistId, offset)
        // Returns: { tracks, processed, total, done, nextOffset, playlistName }
        
        RETURN 200 result WITH HEADERS {
            'X-Request-Id': requestId
        }
        
    CATCH err:
        console.error('[' + requestId + '] Playlist fetch error:', err)
        
        // Handle Spotify API errors (PRD Principle 4: Deterministic Outputs)
        IF err IS SpotifyAPIError:
            IF err.statusCode === 404:
                RETURN 404 {
                    error: 'playlist_not_found',
                    message: 'Playlist not found. Check the URL.'
                } WITH HEADERS {
                    'X-Request-Id': requestId
                }
            ELSE IF err.statusCode === 403:
                RETURN 403 {
                    error: 'playlist_not_accessible',
                    message: 'This playlist is private or unavailable.'
                } WITH HEADERS {
                    'X-Request-Id': requestId
                }
            ELSE IF err.statusCode === 401:
                RETURN 401 {
                    error: 'auth_expired',
                    message: 'Session expired. Please login again.'
                } WITH HEADERS {
                    'X-Request-Id': requestId
                }
            END IF
        END IF
        
        // Generic server error
        RETURN 500 {
            error: 'server_error',
            message: 'Failed to fetch playlist. Please try again.'
        } WITH HEADERS {
            'X-Request-Id': requestId
        }
    END TRY
END FUNCTION
```

### Chunking Strategy (PRD Principle 3)
- Client controls `offset` (passes in request)
- Server fetches max 50 tracks per request
- Server returns `done: true` when `processed >= total`
- Client continues fetching until `done === true`

### Deduplication
Tracks deduplicated by: `name + primaryArtist + durationBucket`
- Duration bucket = `Math.floor(duration_ms / 3000)` (3-second tolerance)

### Error Cases
- Rate limit exceeded → 429 with Retry-After
- Missing refresh token → 401 Unauthorized
- Invalid playlist URL → 400 Bad Request
- Playlist not found → 404 Not Found
- Playlist private/inaccessible → 403 Forbidden
- Expired refresh token → 401 Unauthorized
- Server error → 500 Internal Server Error

### Reference
- Implementation: `app/api/playlist/route.ts`
- Lib functions:
  - `lib/spotify.ts::extractPlaylistId()`
  - `lib/spotify.ts::getAccessTokenFromRefresh()`
  - `lib/spotify.ts::fetchPlaylistTracks()`

---

## Route: `/api/search` (POST)

### Purpose
Search YouTube for tracks, return matches with confidence scores, apply filtering.

### Request Body
```json
{
    "tracks": [
        { "name": "Song Name", "artists": "Artist 1, Artist 2" }
    ]
}
```

### Pseudo-Code

```
FUNCTION POST /api/search(request):
    requestId = generateRequestId()
    MAX_BATCH_SIZE = 10  // PRD Principle 3: Chunk Everything
    
    // Rate limiting (10 req/min per IP)
    ip = getClientIp(request.headers)
    userAgent = request.headers.get('user-agent') || ''
    fingerprint = getFingerprint(ip, userAgent)
    rateLimitResult = checkRateLimit(fingerprint, 'search')
    
    IF NOT rateLimitResult.allowed:
        RETURN 429 {
            error: 'rate_limit_exceeded',
            message: 'Too many search requests. Please wait.',
            retryAfter: Math.ceil(rateLimitResult.resetIn / 1000)
        } WITH HEADERS {
            'X-Request-Id': requestId,
            'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000))
        }
    END IF
    
    // Verify authentication (presence check only)
    cookies = parse(request.headers.get('cookie') || '')
    IF NOT cookies.sp_refresh_token:
        RETURN 401 {
            error: 'auth_expired',
            message: 'Please login with Spotify first.'
        } WITH HEADERS {
            'X-Request-Id': requestId
        }
    END IF
    
    TRY:
        // Parse request body
        body = await request.json()
        tracks = body.tracks
        
        // Validate input
        IF NOT Array.isArray(tracks) OR tracks.length === 0:
            RETURN 400 {
                error: 'bad_request',
                message: 'Please provide an array of tracks.'
            } WITH HEADERS {
                'X-Request-Id': requestId
            }
        END IF
        
        // Enforce batch size limit (PRD Principle 3)
        IF tracks.length > MAX_BATCH_SIZE:
            RETURN 400 {
                error: 'batch_too_large',
                message: 'Maximum ' + MAX_BATCH_SIZE + ' tracks per request.'
            } WITH HEADERS {
                'X-Request-Id': requestId
            }
        END IF
        
        // Check cache first (best-effort, resets on cold start)
        results = []
        uncachedTracks = []
        
        FOR EACH track IN tracks:
            cachedResult = getCachedResult(track.name, track.artists)
            IF cachedResult:
                results.push(cachedResult)
            ELSE:
                uncachedTracks.push(track)
            END IF
        END FOR
        
        // Search uncached tracks (PRD Principle 3: max 2 concurrent)
        IF uncachedTracks.length > 0:
            searchResults = await searchTracks(uncachedTracks)
            // searchTracks() applies:
            // - Negative keyword filtering (karaoke, cover, etc.)
            // - Scoring algorithm (title match, artist match, official indicators)
            // - Confidence level assignment (HIGH/MEDIUM/LOW)
            // - Never throws (PRD Principle 4: Deterministic Outputs)
            
            // Cache results (24h TTL)
            FOR EACH result IN searchResults:
                setCachedResult(result.track.name, result.track.artists, result)
                results.push(result)
            END FOR
        END IF
        
        // Sort results to match input order
        orderedResults = tracks.map(track =>
            results.find(r =>
                r.track.name === track.name AND
                r.track.artists === track.artists
            )
        ).filter(r => r !== undefined)
        
        RETURN 200 {
            results: orderedResults,
            cached: tracks.length - uncachedTracks.length,
            searched: uncachedTracks.length
        } WITH HEADERS {
            'X-Request-Id': requestId
        }
        
    CATCH err:
        console.error('[' + requestId + '] Search error:', err)
        
        RETURN 500 {
            error: 'server_error',
            message: 'Search failed. Please try again.'
        } WITH HEADERS {
            'X-Request-Id': requestId
        }
    END TRY
END FUNCTION
```

### Search Algorithm (YouTube Matching)

The `searchTracks()` function implements the refined matching pipeline:

```
FUNCTION searchSingleTrack(track):
    // Construct queries (in order of preference)
    queries = [
        track.name + ' ' + track.artists + ' official audio',
        track.name + ' ' + track.artists + ' official',
        track.name + ' ' + track.artists
    ]
    
    FOR EACH query IN queries:
        TRY:
            searchResult = await yt-search(query)
            videos = searchResult.videos.slice(0, 10)  // Top 10 results
            
            IF videos.length === 0:
                CONTINUE  // Try next query
            END IF
            
            // Filter negative keywords
            candidates = videos
                .filter(v => NOT hasNegativeKeyword(v.title))
                .map(v => ({
                    video: v,
                    score: scoreVideo(v, track)  // Scoring algorithm
                }))
                .sort((a, b) => b.score - a.score)  // Sort by score
            
            IF candidates.length === 0:
                // All results filtered out (negative keywords)
                RETURN {
                    youtubeUrl: null,
                    confidence: null,
                    reason: 'negative_keyword'
                }
            END IF
            
            best = candidates[0]
            confidence = getConfidence(best.score)
            
            RETURN {
                youtubeUrl: best.video.url,
                title: best.video.title,
                channel: best.video.author.name,
                confidence: confidence,
                reason: confidence === 'LOW' ? 'low_confidence' : 'matched'
            }
            
        CATCH:
            CONTINUE  // Try next query
        END TRY
    END FOR
    
    // All queries failed
    RETURN {
        youtubeUrl: null,
        confidence: null,
        reason: 'no_results'
    }
END FUNCTION

FUNCTION scoreVideo(video, track):
    score = 0
    title = video.title.toLowerCase()
    trackName = track.name.toLowerCase()
    artist = track.artists.split(',')[0].toLowerCase().trim()
    
    // Title contains track name (+30)
    IF title.includes(trackName):
        score += 30
    END IF
    
    // Title contains artist (+20)
    IF title.includes(artist):
        score += 20
    END IF
    
    // Official/VEVO indicators (+25)
    IF video.author.name.toLowerCase().includes('vevo'):
        score += 25
    END IF
    
    // Artist name in channel name (+15)
    IF video.author.name.toLowerCase().includes(artist):
        score += 15
    END IF
    
    // Positive keywords (+10)
    positiveKeywords = ['official', 'audio', 'music video', 'vevo']
    FOR EACH keyword IN positiveKeywords:
        IF title.includes(keyword):
            score += 10
            BREAK  // Only count once
        END IF
    END FOR
    
    // High view count bonus
    IF video.views > 10000000:
        score += 10
    ELSE IF video.views > 1000000:
        score += 5
    END IF
    
    RETURN score
END FUNCTION

FUNCTION getConfidence(score):
    IF score >= 60:
        RETURN 'HIGH'
    ELSE IF score >= 35:
        RETURN 'MEDIUM'
    ELSE:
        RETURN 'LOW'
    END IF
END FUNCTION
```

### Negative Keywords
Filtered out: `karaoke`, `cover`, `instrumental`, `remix`, `tutorial`, `reaction`, `live`, `acoustic version`, `piano version`, `slowed`, `reverb`, `8d audio`

### Confidence Levels
- `HIGH`: Score ≥ 60 (strong match)
- `MEDIUM`: Score 35-59 (reasonable match)
- `LOW`: Score < 35 (weak match)
- `null`: No match or filtered out

### Error Handling (PRD Principle 4)
- Individual track search failures → Swallowed, returns `null` youtubeUrl
- Never throws unless infrastructure fails
- Partial results always returned

### Error Cases
- Rate limit exceeded → 429 with Retry-After
- Missing refresh token → 401 Unauthorized
- Batch too large → 400 Bad Request
- Invalid request body → 400 Bad Request
- Server error → 500 Internal Server Error

### Reference
- Implementation: `app/api/search/route.ts`
- Lib functions:
  - `lib/youtube.ts::searchTracks()`
  - `lib/cache.ts::getCachedResult()`
  - `lib/cache.ts::setCachedResult()`

---

## Health Check Route

### Route: `/api/health` (GET)

**Purpose**: Simple health check endpoint for monitoring.

**Pseudo-Code**:
```
FUNCTION GET /api/health():
    RETURN 200 {
        status: 'ok',
        timestamp: Date.now()
    }
END FUNCTION
```

---

## Summary of Architectural Decisions

### Stateless Design
- No user sessions
- No database
- State in cookies (refresh token only) or client

### Token Safety
- Access tokens never stored
- Refresh token in HttpOnly cookie only
- Token refresh on every authenticated request

### Chunking
- Playlist: 50 tracks per request
- YouTube search: 10 tracks per request, 2 concurrent
- Client manages pagination

### Error Handling
- Deterministic outputs (never throw for missing matches)
- Partial results preserved
- User-friendly error messages

### Rate Limiting
- IP-based fingerprinting
- Per-endpoint limits
- Explicit 429 responses with Retry-After

---

## References

- PRD: `PRD.md` (API Specifications section)
- Implementation files: `app/api/**/route.ts`
- Lib files: `lib/spotify.ts`, `lib/youtube.ts`, `lib/rateLimit.ts`, `lib/cache.ts`
