# Production Checklist

## Overview

This checklist ensures the application is ready for production launch. Each item should be verified before deployment. Items are organized by category and priority (Critical vs. Nice-to-Have).

---

## Security (Critical)

### Authentication & Authorization

- [ ] **Environment variables set correctly**
  - [ ] `SPOTIFY_CLIENT_ID` configured in Vercel
  - [ ] `SPOTIFY_CLIENT_SECRET` configured in Vercel (marked as sensitive)
  - [ ] `REDIRECT_URI` matches production domain (e.g., `https://yourdomain.com/api/auth/callback`)
  - [ ] `NEXT_PUBLIC_BASE_URL` set to production domain
  - [ ] `NODE_ENV` set to `production`
  
  **Verification**: Check Vercel Environment Variables dashboard, ensure all values are set and `REDIRECT_URI` matches exactly.

- [ ] **Cookies use secure flags in production**
  - [ ] HttpOnly flag set (prevents JavaScript access)
  - [ ] Secure flag set (HTTPS only in production)
  - [ ] SameSite set to `lax` (CSRF protection, allows OAuth redirects)
  - [ ] Path set to `/` (available to all routes)
  
  **Verification**: 
  ```bash
  # In browser DevTools → Application → Cookies, verify:
  # - HttpOnly: ✓
  # - Secure: ✓ (only in production)
  # - SameSite: Lax
  ```

- [ ] **No access tokens stored anywhere**
  - [ ] Access tokens only exist in memory during request
  - [ ] No access tokens in cookies
  - [ ] No access tokens in localStorage/sessionStorage
  - [ ] No access tokens logged to console/files
  
  **Verification**: Search codebase for `access_token` storage:
  ```bash
  grep -r "access_token" --include="*.ts" --include="*.tsx" | grep -v "getAccessToken" | grep -v "accessToken"
  # Should return minimal results (only function names, not storage)
  ```

- [ ] **State validation implemented**
  - [ ] OAuth state token generated securely (crypto.randomBytes)
  - [ ] State token stored in HttpOnly cookie
  - [ ] State token validated in callback route
  - [ ] State cookie cleared after use
  
  **Verification**: Review `app/api/auth/login/route.ts` and `app/api/auth/callback/route.ts`, ensure state validation logic exists.

- [ ] **HTTPS enforced in production**
  - [ ] Vercel automatically enforces HTTPS (verify in deployment settings)
  - [ ] No HTTP endpoints exposed
  - [ ] Mixed content warnings resolved (if any)
  
  **Verification**: Deploy to production, check browser console for HTTPS errors.

- [ ] **CORS configured (if needed)**
  - [ ] No CORS headers required (same-origin requests only)
  - [ ] If API accessed from different domain, CORS headers configured correctly
  
  **Verification**: Review Next.js CORS configuration (should be default for same-origin).

---

## Architecture (Critical)

### Stateless Design

- [ ] **No session storage**
  - [ ] No server-side sessions (Next.js default)
  - [ ] No database connections
  - [ ] State only in cookies (refresh token) or client-side
  
  **Verification**: Search codebase for session/database usage:
  ```bash
  grep -r "session\|Session\|database\|Database\|mongoose\|prisma\|sqlite" --include="*.ts" --include="*.tsx"
  # Should return minimal/no results
  ```

- [ ] **Chunked playlist fetching (50 max per request)**
  - [ ] `fetchPlaylistTracks()` limits to 50 tracks
  - [ ] Client manages offset pagination
  - [ ] Server returns `done` flag when complete
  
  **Verification**: Review `lib/spotify.ts::fetchPlaylistTracks()`, verify `BATCH_SIZE = 50`.

- [ ] **Batch YouTube search (10 max, concurrency 2)**
  - [ ] `/api/search` enforces `MAX_BATCH_SIZE = 10`
  - [ ] `searchTracks()` uses `pLimit(2)` for concurrency
  - [ ] Client batches requests appropriately
  
  **Verification**: 
  - Review `app/api/search/route.ts`, verify `MAX_BATCH_SIZE = 10`
  - Review `lib/youtube.ts::searchTracks()`, verify `pLimit(2)`

- [ ] **Rate limiting implemented per endpoint**
  - [ ] `/api/auth/refresh`: 5 req/min
  - [ ] `/api/playlist`: 3 req/min
  - [ ] `/api/search`: 10 req/min
  - [ ] IP-based fingerprinting (IP + User-Agent)
  - [ ] 429 responses include `Retry-After` header
  
  **Verification**: Review `lib/rateLimit.ts`, verify limits match PRD. Test by making rapid requests.

- [ ] **Error handling returns deterministic outputs**
  - [ ] Missing YouTube match returns `null` youtubeUrl (not error)
  - [ ] Low confidence returns result with `confidence: "LOW"` (not error)
  - [ ] Partial progress returns what was processed (not error)
  - [ ] Only auth/infra failures throw errors
  
  **Verification**: Review `lib/youtube.ts`, ensure `searchSingleTrack()` never throws for missing matches.

- [ ] **No database dependencies**
  - [ ] No database connection strings in environment variables
  - [ ] No database libraries in `package.json`
  - [ ] In-memory cache only (acceptable, resets on cold start)
  
  **Verification**: Review `package.json`, verify no database dependencies.

- [ ] **No external service dependencies (except APIs)**
  - [ ] No Redis, no queues, no workers
  - [ ] Only Spotify API and YouTube search library
  - [ ] No paid third-party services
  
  **Verification**: Review `package.json` dependencies, verify only necessary packages.

---

## Frontend (Critical)

### State Machine

- [ ] **State machine implemented correctly**
  - [ ] All states defined: `idle`, `authenticating`, `fetching_playlist`, `matching_youtube`, `completed`, `error`
  - [ ] State transitions match specification
  - [ ] No invalid state transitions possible
  
  **Verification**: Review `app/page.tsx`, compare with `docs/frontend-state-machine.md`.

- [ ] **Progress tracking shows updates every 1-2 seconds**
  - [ ] Progress bar updates during playlist fetching
  - [ ] Progress bar updates during YouTube matching
  - [ ] Batch/chunk indicators show current progress
  - [ ] Percentage displayed correctly
  
  **Verification**: Test with large playlist (100+ tracks), observe progress updates.

- [ ] **Partial results display properly**
  - [ ] Results table populates incrementally during matching
  - [ ] Progress preserved on error (not discarded)
  - [ ] Completed batches remain visible
  
  **Verification**: Test with playlist, verify results appear as batches complete.

- [ ] **Error states have recovery paths**
  - [ ] Error screen shows "Retry" button
  - [ ] Error screen shows "Go back" button
  - [ ] Auth errors redirect to login
  - [ ] Rate limit errors show countdown
  
  **Verification**: Trigger various errors (network, rate limit, auth), verify recovery options.

- [ ] **Loading states prevent duplicate actions**
  - [ ] Buttons disabled during processing
  - [ ] Multiple simultaneous requests prevented
  - [ ] State transitions prevent invalid actions
  
  **Verification**: Test UI, ensure buttons disabled during processing.

- [ ] **Responsive design tested**
  - [ ] Layout works on mobile (320px+ width)
  - [ ] Layout works on tablet (768px+ width)
  - [ ] Layout works on desktop (1024px+ width)
  - [ ] Touch targets appropriate size (44x44px minimum)
  
  **Verification**: Test in browser DevTools responsive mode, verify layout adapts.

---

## Testing (Critical)

### OAuth Flow

- [ ] **OAuth flow tested end-to-end**
  - [ ] Login redirects to Spotify
  - [ ] Authorization grants permissions correctly
  - [ ] Callback stores refresh token in cookie
  - [ ] User redirected to home page after login
  - [ ] Error handling works (invalid state, missing code, etc.)
  
  **Verification**: Complete OAuth flow in production, check cookies, verify redirects.

- [ ] **Token refresh tested**
  - [ ] Expired refresh token handled gracefully
  - [ ] Token refresh endpoint works (if used)
  - [ ] Auth errors redirect to login
  
  **Verification**: Manually expire refresh token (or wait 30 days), verify error handling.

### Playlist Fetching

- [ ] **Large playlists tested (100+ tracks)**
  - [ ] Chunked fetching works correctly
  - [ ] Progress updates incrementally
  - [ ] All tracks fetched (no duplicates)
  - [ ] No timeouts (each chunk < 10s)
  
  **Verification**: Test with playlist containing 200+ tracks, verify all tracks loaded.

- [ ] **Playlist edge cases tested**
  - [ ] Private playlist (should return 403)
  - [ ] Non-existent playlist (should return 404)
  - [ ] Invalid playlist URL (should return 400)
  - [ ] Playlist with duplicate tracks (should deduplicate)
  
  **Verification**: Test each edge case, verify appropriate error messages.

### YouTube Matching

- [ ] **Matching accuracy checked**
  - [ ] HIGH confidence matches are correct (> 90% accuracy)
  - [ ] MEDIUM confidence matches are reasonable (> 70% accuracy)
  - [ ] LOW confidence matches are flagged appropriately
  - [ ] Negative keywords filtered correctly (no karaoke/covers)
  
  **Verification**: Test with known playlist, manually verify match accuracy for 20+ tracks.

- [ ] **Search edge cases tested**
  - [ ] Tracks with no YouTube results (returns null, not error)
  - [ ] Tracks with only covers/remixes (filtered correctly)
  - [ ] Tracks with special characters (handled correctly)
  - [ ] Very long track/artist names (handled correctly)
  
  **Verification**: Test with edge case tracks, verify graceful handling.

### Error Scenarios

- [ ] **Network failures tested**
  - [ ] Interrupted network during playlist fetch (partial results preserved)
  - [ ] Interrupted network during YouTube matching (partial results preserved)
  - [ ] Slow network (timeout handling)
  
  **Verification**: Use browser DevTools Network throttling, test interruptions.

- [ ] **Rate limiting tested**
  - [ ] Rate limit errors return 429 with Retry-After
  - [ ] Frontend displays user-friendly message
  - [ ] Retry works after countdown
  
  **Verification**: Make rapid requests, verify rate limiting kicks in, test retry.

- [ ] **Browser compatibility tested**
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)
  - [ ] Mobile browsers (iOS Safari, Chrome Android)
  
  **Verification**: Test in each browser, verify functionality works.

---

## Performance (Critical)

### API Performance

- [ ] **API routes complete within Vercel timeout (10s)**
  - [ ] `/api/playlist` completes in < 5s per chunk (50 tracks)
  - [ ] `/api/search` completes in < 8s per batch (10 tracks)
  - [ ] No timeouts in production
  
  **Verification**: Monitor Vercel logs, verify no timeout errors. Test with large playlists.

- [ ] **Frontend handles batch loading smoothly**
  - [ ] No UI freezing during processing
  - [ ] Progress updates don't cause lag
  - [ ] Results table renders efficiently (even with 100+ rows)
  
  **Verification**: Test with large playlists, monitor browser performance (Chrome DevTools Performance tab).

- [ ] **Memory usage acceptable (no leaks)**
  - [ ] Memory doesn't grow unbounded during processing
  - [ ] Event listeners cleaned up
  - [ ] No memory leaks in React components
  
  **Verification**: Use Chrome DevTools Memory profiler, test with large playlists, verify memory stable.

- [ ] **Cache TTL appropriate (24h)**
  - [ ] YouTube search results cached for 24 hours
  - [ ] Cache expires correctly
  - [ ] Cache doesn't grow unbounded (acceptable: resets on cold start)
  
  **Verification**: Review `lib/cache.ts`, verify `CACHE_TTL_MS = 24 * 60 * 60 * 1000`.

---

## Monitoring & Logging (Important)

### Request Tracking

- [ ] **Request IDs generated for all API calls**
  - [ ] All API routes generate unique request ID
  - [ ] Request ID included in response headers (`X-Request-Id`)
  - [ ] Request ID logged with errors
  
  **Verification**: Review API routes, verify `generateRequestId()` called, check response headers.

- [ ] **Error logging in place**
  - [ ] Errors logged with context (request ID, error details)
  - [ ] Errors don't expose sensitive data (no tokens in logs)
  - [ ] Logs include stack traces (development only)
  
  **Verification**: Trigger errors, check Vercel logs, verify error messages present.

- [ ] **Rate limit violations logged**
  - [ ] Rate limit violations logged (optional, for monitoring)
  - [ ] Logs don't include user IPs (privacy)
  
  **Verification**: Review `lib/rateLimit.ts`, verify logging (if implemented).

- [ ] **Health endpoint functional (`/api/health`)**
  - [ ] Health endpoint returns 200 OK
  - [ ] Health endpoint responds quickly (< 100ms)
  - [ ] Health endpoint used for monitoring (if applicable)
  
  **Verification**: 
  ```bash
  curl https://yourdomain.com/api/health
  # Should return: {"status":"ok","timestamp":...}
  ```

---

## Documentation (Important)

### User Documentation

- [ ] **PRD v1.0 complete**
  - [ ] PRD.md file exists and is comprehensive
  - [ ] All sections filled out
  - [ ] Architecture diagrams included (mermaid)
  
  **Verification**: Review `PRD.md`, ensure all sections complete.

- [ ] **README updated with setup instructions**
  - [ ] Installation steps
  - [ ] Environment variable configuration
  - [ ] Development setup
  - [ ] Deployment instructions
  
  **Verification**: Review `README.md`, verify setup instructions are clear.

- [ ] **Environment variables documented**
  - [ ] All required variables listed
  - [ ] Example values provided (without secrets)
  - [ ] `.env.example` file updated (if used)
  
  **Verification**: Review `env.example.txt` or documentation, verify all variables documented.

- [ ] **Deployment instructions clear**
  - [ ] Vercel deployment steps
  - [ ] Environment variable configuration
  - [ ] Domain setup (if custom domain)
  - [ ] Spotify app configuration (redirect URI)
  
  **Verification**: Follow deployment instructions, verify deployment succeeds.

### Technical Documentation

- [ ] **API routes documented**
  - [ ] `docs/api-routes.md` complete
  - [ ] Pseudo-code for all routes
  - [ ] Request/response examples
  
  **Verification**: Review `docs/api-routes.md`, verify all routes documented.

- [ ] **Frontend state machine documented**
  - [ ] `docs/frontend-state-machine.md` complete
  - [ ] State transitions documented
  - [ ] UI components per state documented
  
  **Verification**: Review `docs/frontend-state-machine.md`, verify completeness.

- [ ] **UI flow documented**
  - [ ] `docs/ui-flow.md` complete
  - [ ] User journey diagrams included
  - [ ] Screen flows documented
  
  **Verification**: Review `docs/ui-flow.md`, verify diagrams and flows present.

---

## Legal/Compliance (Critical)

### Privacy & Terms

- [ ] **Privacy policy page (`/privacy`)**
  - [ ] Privacy policy exists and is accessible
  - [ ] States what data is collected (refresh token only)
  - [ ] States what data is NOT collected (no playlists, no YouTube results stored)
  - [ ] States cookie usage (refresh token, HttpOnly)
  - [ ] States no third-party sharing (except Spotify/YouTube APIs)
  
  **Verification**: Visit `/privacy`, verify content is accurate and complete.

- [ ] **Terms of service page (`/terms`)**
  - [ ] Terms of service exists and is accessible
  - [ ] States usage limitations (rate limits, acceptable use)
  - [ ] States no warranties
  - [ ] States liability limitations
  
  **Verification**: Visit `/terms`, verify content is accurate and complete.

- [ ] **Spotify API terms compliance**
  - [ ] Application follows Spotify API Terms of Service
  - [ ] Only requested scopes used (playlist-read-*)
  - [ ] No data stored beyond refresh token
  - [ ] Attribution (if required) included
  
  **Verification**: Review Spotify API Terms, ensure compliance.

- [ ] **No data storage (privacy aligned)**
  - [ ] No database storing user data
  - [ ] No analytics tracking users
  - [ ] Only refresh token stored (in HttpOnly cookie)
  - [ ] No logs containing user data (IPs, playlists, etc.)
  
  **Verification**: Review codebase, verify no user data storage (except refresh token cookie).

---

## Nice-to-Have (Optional)

### Enhancements

- [ ] **Error reporting**
  - [ ] Error boundary implemented (React)
  - [ ] User-friendly error messages
  - [ ] Error reporting service (e.g., Sentry) integrated (optional)
  
- [ ] **Analytics (privacy-conscious)**
  - [ ] No user tracking (privacy-first)
  - [ ] Aggregate usage stats only (if desired)
  - [ ] No personal data collected
  
- [ ] **Performance monitoring**
  - [ ] Vercel Analytics enabled (if desired)
  - [ ] API response time monitoring
  - [ ] Error rate monitoring
  
- [ ] **Accessibility**
  - [ ] Keyboard navigation tested
  - [ ] Screen reader compatibility tested
  - [ ] WCAG AA compliance verified
  
- [ ] **SEO**
  - [ ] Meta tags configured
  - [ ] Open Graph tags (if sharing)
  - [ ] Sitemap (if needed)

---

## Pre-Launch Verification

### Final Checks

1. **Deploy to production**
   ```bash
   vercel --prod
   ```

2. **Test complete user journey**
   - Login with Spotify
   - Fetch playlist (100+ tracks)
   - Map to YouTube
   - Verify results accuracy
   - Test error scenarios

3. **Monitor logs for errors**
   - Check Vercel logs
   - Verify no unexpected errors
   - Verify rate limiting works

4. **Verify environment variables**
   - All variables set in Vercel
   - No secrets exposed
   - Redirect URI matches production domain

5. **Test on multiple devices/browsers**
   - Desktop (Chrome, Firefox, Safari, Edge)
   - Mobile (iOS Safari, Chrome Android)

6. **Verify privacy/terms pages accessible**
   - `/privacy` loads correctly
   - `/terms` loads correctly
   - Links work from footer

---

## Post-Launch Monitoring

### First 24 Hours

- [ ] Monitor error rates (should be < 5%)
- [ ] Monitor API response times (should be < 5s per chunk)
- [ ] Check user feedback (if available)
- [ ] Verify rate limiting works (no abuse)

### First Week

- [ ] Review usage patterns
- [ ] Check for any unexpected errors
- [ ] Verify cache performance (if applicable)
- [ ] Collect user feedback

---

## Rollback Plan

If critical issues arise:

1. **Immediate rollback**
   ```bash
   vercel rollback
   ```

2. **Disable application**
   - Remove environment variables (prevents new logins)
   - Add maintenance message to UI (if needed)

3. **Investigate issue**
   - Review logs
   - Identify root cause
   - Fix issue
   - Test thoroughly
   - Redeploy

---

## Checklist Summary

**Total Items**: ~60

**Critical Items**: ~40 (must complete before launch)

**Important Items**: ~15 (should complete before launch)

**Nice-to-Have Items**: ~5 (optional enhancements)

---

## Notes

- This checklist should be reviewed before every production deployment
- Items marked as "Critical" are non-negotiable for launch
- Items marked as "Important" should be completed but may be deferred if necessary
- Items marked as "Nice-to-Have" are optional enhancements

---

## References

- PRD: `PRD.md`
- API Routes: `docs/api-routes.md`
- Frontend State Machine: `docs/frontend-state-machine.md`
- UI Flow: `docs/ui-flow.md`
