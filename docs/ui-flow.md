# UI Flow & User Journey

## Overview

This document describes the user journey through the Spotify → YouTube Playlist Mapper application, including screen flows, user interactions, and decision points.

---

## High-Level User Journey

```mermaid
journey
    title User Journey: Spotify to YouTube Playlist Mapping
    section Authentication
      Land on homepage: 5: User
      Click "Connect Spotify": 4: User
      Authorize on Spotify: 3: User
      Return to app: 5: User
    section Playlist Input
      Paste playlist URL: 5: User
      Click "Start mapping": 4: User
      Watch progress: 5: User
    section YouTube Mapping
      Review playlist: 4: User
      Click "Map to YouTube": 4: User
      Watch matching progress: 5: User
    section Results
      Review results: 5: User
      Export/share links: 3: User
      Start new mapping: 4: User
```

---

## Screen Flow Diagram

```mermaid
flowchart TD
    Start([User lands on homepage]) --> CheckAuth{Authenticated?}
    
    CheckAuth -->|No| LoginScreen[Login Screen]
    CheckAuth -->|Yes| PlaylistInput[Playlist Input Screen]
    
    LoginScreen --> ClickLogin[User clicks 'Connect Spotify']
    ClickLogin --> OAuthRedirect[Redirect to Spotify OAuth]
    OAuthRedirect --> SpotifyAuth[User authorizes on Spotify]
    SpotifyAuth --> Callback[Callback to /api/auth/callback]
    Callback --> SuccessCheck{Auth successful?}
    
    SuccessCheck -->|Yes| PlaylistInput
    SuccessCheck -->|No| ErrorScreen[Error Screen: Auth failed]
    ErrorScreen --> LoginScreen
    
    PlaylistInput --> PasteURL[User pastes playlist URL]
    PasteURL --> ValidateURL{Valid URL?}
    ValidateURL -->|No| URLError[Error: Invalid URL format]
    URLError --> PlaylistInput
    ValidateURL -->|Yes| ClickFetch[User clicks 'Start mapping']
    
    ClickFetch --> Fetching[Fetching Playlist Screen]
    Fetching --> FetchProgress[Show progress: X/Y tracks]
    FetchProgress --> FetchComplete{All chunks done?}
    FetchComplete -->|No| FetchProgress
    FetchComplete -->|Yes| PlaylistLoaded[Playlist Loaded Screen]
    
    Fetching --> FetchError{Error occurred?}
    FetchError -->|Yes| FetchErrorScreen[Error Screen: Fetch failed]
    FetchErrorScreen --> PlaylistInput
    
    PlaylistLoaded --> ClickMap[User clicks 'Map to YouTube']
    ClickMap --> Matching[Matching YouTube Screen]
    Matching --> MatchProgress[Show progress + results table]
    MatchProgress --> MatchComplete{All batches done?}
    MatchComplete -->|No| MatchProgress
    MatchComplete -->|Yes| ResultsScreen[Results Screen]
    
    Matching --> MatchError{Error occurred?}
    MatchError -->|Yes| MatchErrorScreen[Error Screen: Match failed]
    MatchErrorScreen --> PlaylistLoaded
    
    ResultsScreen --> UserAction{User action?}
    UserAction -->|Retry failed| Matching
    UserAction -->|Start new| PlaylistInput
    UserAction -->|Export| Export[Export Results]
    UserAction -->|Done| End([User leaves])
    
    style Start fill:#e1f5ff
    style End fill:#e1f5ff
    style ErrorScreen fill:#ffcccc
    style FetchErrorScreen fill:#ffcccc
    style MatchErrorScreen fill:#ffcccc
    style ResultsScreen fill:#ccffcc
```

---

## Detailed Screen Flows

### Flow 1: First-Time User (Not Authenticated)

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant HomePage
    participant LoginAPI[/api/auth/login]
    participant SpotifyOAuth[Spotify OAuth]
    participant CallbackAPI[/api/auth/callback]
    
    User->>Browser: Navigate to homepage
    Browser->>HomePage: Load /
    HomePage->>User: Display login screen
    
    User->>HomePage: Click "Connect Spotify"
    HomePage->>Browser: Navigate to /api/auth/login
    Browser->>LoginAPI: GET /api/auth/login
    LoginAPI->>Browser: Set oauth_state cookie, redirect to Spotify
    Browser->>SpotifyOAuth: Redirect to authorization page
    
    User->>SpotifyOAuth: Authorize application
    SpotifyOAuth->>CallbackAPI: GET /api/auth/callback?code=XXX&state=YYY
    CallbackAPI->>CallbackAPI: Validate state, exchange code
    CallbackAPI->>Browser: Set sp_refresh_token cookie, redirect to /
    Browser->>HomePage: Load / (authenticated)
    HomePage->>User: Display playlist input screen
```

**Screen States**:
1. **Initial**: Login screen with "Connect Spotify" button
2. **Redirecting**: Brief loading state (handled by browser redirect)
3. **Authenticated**: Playlist input screen

---

### Flow 2: Authenticated User - Playlist Fetching

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant HomePage
    participant PlaylistAPI[/api/playlist]
    participant SpotifyAPI[Spotify API]
    
    User->>HomePage: Paste playlist URL
    User->>HomePage: Click "Start mapping"
    
    HomePage->>HomePage: Validate URL format
    HomePage->>HomePage: Set state: fetching_playlist
    HomePage->>User: Show progress bar (0%)
    
    loop For each chunk (50 tracks)
        HomePage->>PlaylistAPI: POST /api/playlist {playlistUrl, offset}
        PlaylistAPI->>SpotifyAPI: Refresh token, get access token
        PlaylistAPI->>SpotifyAPI: Fetch tracks (offset, limit=50)
        SpotifyAPI->>PlaylistAPI: Return tracks
        PlaylistAPI->>HomePage: {tracks, processed, total, done, nextOffset}
        HomePage->>HomePage: Update tracks array
        HomePage->>HomePage: Update progress bar
        HomePage->>User: Show progress (X/Y tracks, batch indicator)
    end
    
    HomePage->>HomePage: Set state: idle (tracks loaded)
    HomePage->>User: Display playlist info + "Map to YouTube" button
```

**Screen States**:
1. **Before**: Playlist input screen
2. **During**: Fetching screen with progress bar, batch indicators, activity log
3. **After**: Playlist loaded screen with track count and "Map to YouTube" button

**Progress Updates**: Every chunk (approximately every 1-2 seconds for large playlists)

---

### Flow 3: YouTube Matching

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant HomePage
    participant SearchAPI[/api/search]
    participant YouTubeAPI[YouTube Search]
    
    User->>HomePage: Click "Map to YouTube"
    HomePage->>HomePage: Set state: matching_youtube
    HomePage->>User: Show progress bar (0%), empty results table
    
    loop For each batch (10 tracks)
        HomePage->>SearchAPI: POST /api/search {tracks: batch}
        SearchAPI->>SearchAPI: Check cache, filter uncached
        loop For each uncached track (max 2 concurrent)
            SearchAPI->>YouTubeAPI: Search track
            YouTubeAPI->>SearchAPI: Return results
            SearchAPI->>SearchAPI: Filter negative keywords, score results
        end
        SearchAPI->>SearchAPI: Cache results
        SearchAPI->>HomePage: {results, cached, searched}
        HomePage->>HomePage: Update results Map
        HomePage->>HomePage: Update progress bar
        HomePage->>User: Show progress + results table (incremental)
    end
    
    HomePage->>HomePage: Set state: completed
    HomePage->>User: Display complete results + statistics
```

**Screen States**:
1. **Before**: Playlist loaded screen
2. **During**: Matching screen with progress bar, real-time results table, activity log
3. **After**: Completed screen with full results, statistics, export options

**Progress Updates**: Every batch (approximately every 2-5 seconds)

**Real-Time Updates**: Results table updates incrementally as matches are found

---

### Flow 4: Error Recovery

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant HomePage
    participant API[API Endpoint]
    
    HomePage->>API: API call
    API->>HomePage: Error response (e.g., rate_limit_exceeded)
    HomePage->>HomePage: Set state: error
    HomePage->>User: Display error message + recovery options
    
    alt User chooses "Retry"
        User->>HomePage: Click "Retry"
        HomePage->>HomePage: Set state: idle (or previous state)
        HomePage->>API: Retry API call
        API->>HomePage: Success response
        HomePage->>HomePage: Continue normal flow
    else User chooses "Go back"
        User->>HomePage: Click "Go back"
        HomePage->>HomePage: Set state: idle
        HomePage->>User: Return to previous screen
    else Auth error
        HomePage->>HomePage: Set state: authenticating
        HomePage->>User: Redirect to login
    end
```

**Error Types & Recovery**:

| Error | Screen | Recovery Options |
|-------|--------|-----------------|
| `auth_expired` | Error screen | Redirect to login (automatic) |
| `rate_limit_exceeded` | Error screen with countdown | Wait and retry |
| `playlist_not_found` | Error screen | Edit URL, retry |
| `network_error` | Error screen | Retry button |
| `server_error` | Error screen | Retry button |

---

## User Interaction Patterns

### Pattern 1: Progressive Disclosure

**Principle**: Show information incrementally as it becomes available.

**Examples**:
- Playlist name appears after first chunk fetched
- Results table populates incrementally during matching
- Statistics update as results come in

**Benefits**: Users see progress immediately, no "blank screen" anxiety

---

### Pattern 2: Optimistic Updates

**Principle**: Update UI immediately, handle errors gracefully.

**Examples**:
- Progress bar updates before API response confirms
- Results appear in table as soon as received
- Error states preserve partial progress

**Benefits**: Perceived performance improvement, users see movement

---

### Pattern 3: Clear Feedback

**Principle**: Always inform users of current state and next steps.

**Examples**:
- Progress indicators: "Processing batch 3 of 10"
- Status badges: "Fetching playlist", "Searching YouTube", "Done"
- Activity logs: "✓ Song Name", "○ Song Name (not found)"

**Benefits**: Users understand what's happening, reduces confusion

---

### Pattern 4: Graceful Degradation

**Principle**: Handle failures without losing progress.

**Examples**:
- Network error → Partial results preserved, error message shown
- Rate limit → Show countdown, allow retry
- Auth expiration → Preserve playlist data, redirect to login

**Benefits**: Users don't lose work, trust in system reliability

---

## Screen Mockups (Text-Based)

### Screen 1: Login Screen

```
┌─────────────────────────────────────────┐
│  Spotify → YouTube Playlist Mapper      │
├─────────────────────────────────────────┤
│                                         │
│         [Connect Spotify Button]        │
│              (Spotify Icon)             │
│                                         │
│  Uses Spotify OAuth. Read-only, no     │
│  tokens stored client-side.             │
│                                         │
│  [Privacy Policy] [Terms of Service]    │
│                                         │
│  How it works:                          │
│  1. Connect your Spotify account       │
│  2. Paste your playlist URL            │
│  3. Get YouTube links for all tracks   │
│                                         │
└─────────────────────────────────────────┘
```

---

### Screen 2: Playlist Input Screen

```
┌─────────────────────────────────────────┐
│  ✓ Spotify: Connected                  │
├─────────────────────────────────────────┤
│                                         │
│  Spotify Playlist URL                   │
│  ┌───────────────────────────────────┐ │
│  │ https://open.spotify.com/playlist/│ │
│  └───────────────────────────────────┘ │
│                    [Start mapping] →   │
│                                         │
│  Example: https://open.spotify.com/    │
│           playlist/37i9dQZF1DXcBWIG... │
│                                         │
└─────────────────────────────────────────┘
```

---

### Screen 3: Fetching Playlist Screen

```
┌─────────────────────────────────────────┐
│  Fetching Playlist                      │
├─────────────────────────────────────────┤
│                                         │
│  Progress: 150 / 500 tracks (30%)      │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░      │
│                                         │
│  Batch 3 of 10                         │
│  Status: [Fetching playlist]           │
│                                         │
│  Activity Log:                          │
│  ┌───────────────────────────────────┐ │
│  │ Fetched 50 / 500 tracks           │ │
│  │ Fetched 100 / 500 tracks          │ │
│  │ Fetched 150 / 500 tracks          │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

### Screen 4: Matching YouTube Screen

```
┌─────────────────────────────────────────┐
│  Searching YouTube                      │
├─────────────────────────────────────────┤
│                                         │
│  Progress: 30 / 100 tracks (30%)       │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░    │
│                                         │
│  Batch 3 of 10                         │
│  Status: [Searching YouTube]           │
│                                         │
│  Results (30/100):                      │
│  ┌───────────────────────────────────┐ │
│  │ # Track        YouTube  Conf.     │ │
│  │ 1 Song A       [Link]   [HIGH]    │ │
│  │ 2 Song B       [Link]   [MEDIUM]  │ │
│  │ 3 Song C       -        -         │ │
│  │ ...                                │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Activity Log:                          │
│  ┌───────────────────────────────────┐ │
│  │ ✓ Song A                          │ │
│  │ ⚠ Song B (low confidence)         │ │
│  │ ○ Song C (not found)              │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

### Screen 5: Results Screen

```
┌─────────────────────────────────────────┐
│  Mapping Complete!                      │
├─────────────────────────────────────────┤
│                                         │
│  Statistics:                            │
│  • Total: 100 tracks                   │
│  • Matched: 85 (85%)                   │
│  • Not found: 15 (15%)                 │
│  • High confidence: 70                 │
│  • Medium confidence: 10               │
│  • Low confidence: 5                   │
│                                         │
│  Results:                               │
│  ┌───────────────────────────────────┐ │
│  │ # Track        YouTube  Conf.     │ │
│  │ [Full results table...]           │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Retry failed tracks] [Export]        │
│  [Start new mapping]                   │
│                                         │
└─────────────────────────────────────────┘
```

---

### Screen 6: Error Screen

```
┌─────────────────────────────────────────┐
│  Error                                  │
├─────────────────────────────────────────┤
│                                         │
│  ⚠ Rate limit exceeded                 │
│                                         │
│  Too many requests. Please wait 45      │
│  seconds and try again.                 │
│                                         │
│  Error code: rate_limit_exceeded        │
│                                         │
│  [Retry in 45s] [Go back]              │
│                                         │
│  Note: Your progress has been saved.   │
│  You can continue from where you left  │
│  off once the rate limit resets.       │
│                                         │
└─────────────────────────────────────────┘
```

---

## Accessibility Considerations

### Keyboard Navigation

- All interactive elements focusable via Tab
- Enter/Space activates buttons
- Escape closes modals/overlays (future)

### Screen Readers

- Progress bars include `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Status messages announced via `aria-live` regions
- Error messages clearly labeled
- Links have descriptive text

### Visual Design

- High contrast for text (WCAG AA compliant)
- Color not sole indicator (icons + text for status)
- Focus indicators visible
- Responsive design (mobile-friendly)

---

## Performance Considerations

### Loading States

- Skeleton screens for initial load (future enhancement)
- Progressive image loading (if thumbnails added)
- Lazy loading for results table (virtual scrolling for 100+ tracks)

### Update Frequency

- Progress updates: Maximum every 1-2 seconds
- Results table: Update per batch (not per track)
- Activity log: Update per track (but limit to last 50 entries)

### Network Optimization

- Batch API calls (10 tracks per search request)
- Cache results (24h TTL)
- Retry with exponential backoff (future enhancement)

---

## References

- State Machine: `docs/frontend-state-machine.md`
- API Routes: `docs/api-routes.md`
- PRD: `PRD.md`
- Current Implementation: `app/page.tsx`
