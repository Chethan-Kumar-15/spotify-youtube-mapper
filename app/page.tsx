'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Track {
  name: string;
  artists: string;
  primaryArtist: string;
  duration_ms: number;
  spotifyUri: string;
}

interface SearchResult {
  track: { name: string; artists: string };
  youtubeUrl: string | null;
  title: string | null;
  channel: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  reason: string;
}

type Phase = 'idle' | 'authenticating' | 'fetching_playlist' | 'matching_youtube' | 'completed' | 'error';
type TrackStatus = 'pending' | 'searching' | 'matched' | 'low_confidence' | 'not_found';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [results, setResults] = useState<Map<string, SearchResult>>(new Map());

  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    if (urlError) {
      setPhase('error');
      setError(urlError === 'invalid_state'
        ? 'Session expired. Please log in again.'
        : 'Authentication failed. Please try again.');
      window.history.replaceState({}, '', '/');
    }
    setIsLoggedIn(document.cookie.includes('sp_refresh_token'));
  }, []);

  useEffect(() => {
    // Create animated background particles
    if (particlesRef.current) {
      particlesRef.current.innerHTML = '';
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute rounded-full opacity-20 animate-pulse';
        particle.style.width = `${Math.random() * 20 + 5}px`;
        particle.style.height = particle.style.width;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.backgroundColor = i % 2 === 0 ? '#6A35FF' : '#FF4D94';
        particle.style.animationDuration = `${Math.random() * 4 + 2}s`;
        particlesRef.current.appendChild(particle);
      }
    }
  }, []);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-30), message]);
  };

  const handleLogin = () => {
    setPhase('authenticating');
    window.location.href = '/api/auth/login';
  };

  const handleLogout = () => {
    document.cookie = 'sp_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setIsLoggedIn(false);
    setTracks([]);
    setResults(new Map());

    setPhase('idle');
    setLogs([]);
    setPlaylistName('');
  };

  const getTrackKey = (track: { name: string; artists: string }) =>
    `${track.name}|${track.artists}`;

  const isValidUrl = (url: string) =>
    url.includes('spotify.com/playlist/') || url.includes('spotify:playlist:');

  const fetchPlaylist = async () => {
    if (!playlistUrl.trim() || !isValidUrl(playlistUrl)) {
      setError('Enter a valid Spotify playlist URL.');
      setPhase('error');
      return;
    }

    setPhase('fetching_playlist');
    setError('');
    setTracks([]);
    setResults(new Map());
    setLogs([]);
    setProgress({ current: 0, total: 0 });
    addLog('Connecting to Spotify...');

    try {
      let allTracks: Track[] = [];
      let offset = 0;
      let done = false;
      let name = '';

      while (!done) {
        const res = await fetch('/api/playlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playlistUrl, offset }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.error === 'auth_expired') {
            setIsLoggedIn(false);
            throw new Error('Session expired. Please log in again.');
          }
          throw new Error(data.message || 'Failed to fetch playlist.');
        }

        if (data.playlistName) name = data.playlistName;
        allTracks = [...allTracks, ...data.tracks];
        setProgress({ current: data.processed, total: data.total });
        addLog(`Fetched ${data.processed} / ${data.total} tracks`);

        done = data.done;
        offset = data.nextOffset;
      }

      setTracks(allTracks);
      setPlaylistName(name);
      setPhase('idle');
      addLog(`Ready: ${allTracks.length} tracks loaded`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
      setPhase('error');
    }
  };

  const mapToYouTube = async () => {
    if (tracks.length === 0) return;

    setPhase('matching_youtube');
    setError('');
    setResults(new Map());
    setLogs([]);

    const initialStatuses = new Map<string, TrackStatus>();
    tracks.forEach(t => initialStatuses.set(getTrackKey(t), 'pending'));


    setProgress({ current: 0, total: tracks.length });
    addLog('Starting YouTube search...');

    const BATCH_SIZE = 10;
    const newResults = new Map<string, SearchResult>();

    try {
      for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
        const batch = tracks.slice(i, i + BATCH_SIZE);



        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tracks: batch.map(t => ({ name: t.name, artists: t.artists }))
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.error === 'rate_limit_exceeded') {
            throw new Error(`Rate limited. Wait ${data.retryAfter || 60}s.`);
          }
          throw new Error(data.message || 'Search failed.');
        }

        for (const result of data.results) {
          const key = getTrackKey(result.track);
          newResults.set(key, result);

          let status: TrackStatus;
          let symbol: string;

          if (result.youtubeUrl) {
            status = result.confidence === 'LOW' ? 'low_confidence' : 'matched';
            symbol = status === 'matched' ? '✓' : '⚠';
          } else {
            status = 'not_found';
            symbol = '○';
          }


          addLog(`${symbol} ${result.track.name.slice(0, 40)}`);
        }

        setResults(new Map(newResults));
        setProgress({ current: Math.min(i + BATCH_SIZE, tracks.length), total: tracks.length });
      }

      const matched = Array.from(newResults.values()).filter(r => r.youtubeUrl).length;
      setPhase('completed');
      addLog(`Complete: ${matched}/${tracks.length} matched`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.');
      setPhase('error');
    }
  };

  const ConfidenceBadge = ({ level }: { level: string | null }) => {
    const styles: Record<string, string> = {
      HIGH: 'bg-green-900/30 text-green-400 border border-green-800/50',
      MEDIUM: 'bg-amber-900/30 text-amber-400 border border-amber-800/50',
      LOW: 'bg-slate-700/30 text-slate-400 border border-slate-600/50',
    };
    if (!level) return null;
    return (
      <span className={`text-xs px-2 py-1 rounded ${styles[level] || ''}`}>
        {level}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-dark-navy text-[#E5E7EB] font-[Inter,ui-sans-serif,system-ui] relative overflow-hidden">
      {/* Animated background particles */}
      <div ref={particlesRef} className="fixed inset-0 z-0"></div>
      
      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Three-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_300px] gap-6">
          {/* Left sidebar */}
          <div className="lg:col-span-1 bg-glass border-glass rounded-xl p-4 h-fit">
            <div className="flex flex-col space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Playlist Mapper</h2>
                <div className="mt-2 text-xs text-white">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${isLoggedIn ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>{isLoggedIn ? 'Spotify: Connected' : 'Spotify: Not connected'}</span>
                  </div>
                </div>
              </div>
              
              <nav className="space-y-2">
                <Link href="/" className="block py-2 px-3 rounded text-sm text-white bg-[#1E293B]/50">Home</Link>
                <Link href="/privacy" className="block py-2 px-3 rounded text-sm text-white hover:text-white hover:bg-[#1E293B]/30 transition-colors">Privacy</Link>
                <Link href="/terms" className="block py-2 px-3 rounded text-sm text-white hover:text-white hover:bg-[#1E293B]/30 transition-colors">Terms</Link>
              </nav>
              
                <button
                  onClick={handleLogout}
                  className="mt-4 text-xs text-white hover:text-gray-300 transition-colors duration-300"
                >
                  Change Spotify account
                </button>
            </div>
          </div>
          
          {/* Center main content */}
          <div className="lg:col-span-1">
            {/* Stepper */}
            <div className="mb-8">
              <div className="flex justify-between relative">
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#1E293B] -z-10"></div>
                <div className="flex-1 text-center relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${isLoggedIn ? 'bg-gradient-purple-pink text-white' : 'bg-[#1E293B] text-white'}`}>
                    1
                  </div>
                  <span className="text-xs text-white">Connect Spotify</span>
                </div>
                <div className="flex-1 text-center relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${(isLoggedIn && tracks.length === 0) ? 'bg-gradient-purple-pink text-white' : tracks.length > 0 ? 'bg-gradient-purple-pink text-white' : 'bg-[#1E293B] text-white'}`}>
                    2
                  </div>
                  <span className="text-xs text-white">Paste Playlist</span>
                </div>
                <div className="flex-1 text-center relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${results.size > 0 ? 'bg-gradient-purple-pink text-white' : 'bg-[#1E293B] text-white'}`}>
                    3
                  </div>
                  <span className="text-xs text-white">Map & Review</span>
                </div>
              </div>
            </div>
            
            {/* Main content based on auth state */}
            {!isLoggedIn ? (
              <div className="bg-glass border-glass rounded-xl p-6">
                <div className="text-center py-8">
                  <h1 className="text-2xl font-bold text-white mb-3">Spotify → YouTube Playlist Mapper</h1>
                  <p className="text-[#94A3B8] mb-8">Map tracks safely, in batches, with transparent results.</p>
                  
                  <button
                    onClick={handleLogin}
                    disabled={phase === 'authenticating'}
                    className="inline-flex items-center gap-2 bg-gradient-purple-pink hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    {phase === 'authenticating' ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                      </svg>
                    )}
                    Connect Spotify securely
                  </button>
                  
                  <p className="mt-4 text-xs text-[#64748B]">
                    Uses Spotify OAuth. Read-only, no tokens stored client-side. <Link href="/privacy" className="text-[#38BDF8] hover:underline">Learn more</Link>
                  </p>
                </div>
                
                {/* How it works section */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-[#0B1120]/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center mx-auto mb-3">1</div>
                    <h3 className="font-medium text-white mb-1">Connect</h3>
                    <p className="text-xs text-[#94A3B8]">Securely connect your Spotify account</p>
                  </div>
                  <div className="text-center p-4 bg-[#0B1120]/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center mx-auto mb-3">2</div>
                    <h3 className="font-medium text-white mb-1">Paste playlist</h3>
                    <p className="text-xs text-[#94A3B8]">Enter your Spotify playlist URL</p>
                  </div>
                  <div className="text-center p-4 bg-[#0B1120]/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center mx-auto mb-3">3</div>
                    <h3 className="font-medium text-white mb-1">Get links</h3>
                    <p className="text-xs text-[#94A3B8]">Receive YouTube links for all tracks</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-glass border-glass rounded-xl p-6">
                <div className="mb-6 pb-4 border-b border-[#1E293B]">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-white">Playlist Mapper</h2>
                    <span className="text-xs text-[#64748B]">✓ Connected to Spotify</span>
                  </div>
                </div>
                
                {/* Playlist URL input */}
                <div className="mb-6">
                  <label className="block text-xs uppercase tracking-wide text-white mb-3">
                    Spotify Playlist URL
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={playlistUrl}
                      onChange={(e) => setPlaylistUrl(e.target.value)}
                      placeholder="https://open.spotify.com/playlist/..."
                      className="w-full px-4 py-3 bg-[#0B1120] border border-[#1E293B] rounded-lg text-sm text-[#E5E7EB] placeholder-[#475569] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/30 transition-all duration-300"
                      disabled={phase === 'fetching_playlist' || phase === 'matching_youtube'}
                    />
                    <button
                      onClick={fetchPlaylist}
                      disabled={phase === 'fetching_playlist' || phase === 'matching_youtube' || !playlistUrl.trim()}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium py-1.5 px-3 rounded transition-colors duration-300"
                    >
                      {phase === 'fetching_playlist' ? 'Fetching...' : 'Start mapping'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-[#64748B]">
                    Example: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
                  </p>
                </div>
                
                {/* Progress visualization */}
                {progress.total > 0 && (phase === 'fetching_playlist' || phase === 'matching_youtube' || phase === 'completed') && (
                  <div className="mb-6">
                    <div className="flex justify-between text-xs text-[#64748B] mb-2">
                      <span>Processed {progress.current} of {progress.total} tracks</span>
                      <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-[#1E293B] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ease-in-out ${phase === 'completed' ? 'bg-gradient-purple-pink' : 'bg-[#2563EB]'}`}
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-[#64748B] flex justify-between">
                      <span>Batch {Math.ceil(progress.current / 50)} of {Math.ceil(progress.total / 50)}</span>
                      <span className={`px-2 py-0.5 rounded ${phase === 'fetching_playlist' ? 'bg-blue-900/30 text-blue-400' : phase === 'matching_youtube' ? 'bg-purple-900/30 text-purple-400' : 'bg-green-900/30 text-green-400'}`}>
                        {phase === 'fetching_playlist' ? 'Fetching playlist' : phase === 'matching_youtube' ? 'Searching YouTube' : 'Done'}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Playlist Info */}
                {tracks.length > 0 && phase !== 'fetching_playlist' && (
                  <div className="mb-6 p-4 border border-[#1E293B] rounded-lg bg-[#0B1120]/50">
                    <div className="text-lg font-medium text-white">{playlistName || 'Playlist'}</div>
                    <div className="text-sm text-[#94A3B8] mt-1">
                      {tracks.length} tracks
                    </div>
                    {results.size === 0 && phase !== 'matching_youtube' && (
                      <button
                        onClick={mapToYouTube}
                        className="mt-4 bg-gradient-purple-pink hover:opacity-90 text-white text-sm font-medium py-2 px-4 rounded transition-all duration-300"
                      >
                        Map to YouTube
                      </button>
                    )}
                  </div>
                )}
                
                {/* Activity Log */}
                {logs.length > 0 && (
                  <div className="mb-6 p-4 bg-[#020617] border border-[#1E293B] rounded font-mono text-xs max-h-32 overflow-y-auto">
                    {logs.map((log, i) => (
                      <div key={i} className="text-[#94A3B8] py-0.5 border-b border-[#1E293B]/30 last:border-0">{log}</div>
                    ))}
                  </div>
                )}
                
                {/* Results */}
                {results.size > 0 && (
                  <div className="border border-[#1E293B] rounded-lg overflow-hidden">
                    <div className="bg-[#0B1120] px-4 py-3">
                      <h3 className="font-medium text-white">Results</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-[#0B1120]">
                          <tr className="text-[#64748B] text-xs uppercase tracking-wide">
                            <th className="text-left px-4 py-3 font-medium">#</th>
                            <th className="text-left px-4 py-3 font-medium">Track</th>
                            <th className="text-left px-4 py-3 font-medium">YouTube</th>
                            <th className="text-left px-4 py-3 font-medium">Confidence</th>
                            <th className="text-left px-4 py-3 font-medium">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tracks.map((track, i) => {
                            const result = results.get(getTrackKey(track));
                            return (
                              <tr key={i} className="border-b border-[#1E293B] last:border-0 hover:bg-[#0B1120]/30 transition-colors duration-200">
                                <td className="px-4 py-3 text-[#64748B]">{i + 1}</td>
                                <td className="px-4 py-3">
                                  <div className="text-[#E5E7EB] truncate max-w-[120px]">{track.name}</div>
                                  <div className="text-xs text-[#64748B] truncate max-w-[120px]">{track.artists}</div>
                                </td>
                                <td className="px-4 py-3">
                                  {result?.youtubeUrl ? (
                                    <a
                                      href={result.youtubeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#2563EB] hover:underline inline-flex items-center gap-1 transition-colors duration-300"
                                    >
                                      Link
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                  ) : (
                                    <span className="text-[#475569]">No match</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <ConfidenceBadge level={result?.confidence || null} />
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs text-[#64748B]">
                                    {result?.reason === 'no_results' ? 'No results' : 
                                     result?.reason === 'negative_keyword' ? 'Filtered: karaoke, cover, etc.' : 
                                     result?.reason === 'low_confidence' ? 'Low confidence' : 
                                     'Exact match'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Empty State */}
                {!tracks.length && phase === 'idle' && !error && (
                  <div className="text-center py-8">
                    <p className="text-sm text-[#64748B]">
                      Paste a Spotify playlist link to begin mapping to YouTube.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Right results panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Progress stats */}
            <div className="bg-glass border-glass rounded-xl p-4">
              <h3 className="font-medium text-white mb-3">Progress</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-[#64748B] mb-1">
                    <span>Overall Progress</span>
                    <span>{progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-[#1E293B] rounded-full h-2">
                    <div
                      className={`h-full ${phase === 'completed' ? 'bg-gradient-purple-pink' : 'bg-[#2563EB]'}`}
                      style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-[#0B1120]/50 p-3 rounded">
                    <div className="text-lg font-semibold text-white">{progress.current}</div>
                    <div className="text-xs text-[#64748B]">Processed</div>
                  </div>
                  <div className="bg-[#0B1120]/50 p-3 rounded">
                    <div className="text-lg font-semibold text-white">{progress.total}</div>
                    <div className="text-xs text-[#64748B]">Total</div>
                  </div>
                </div>
                
                {results.size > 0 && (
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-[#0B1120]/50 p-3 rounded">
                      <div className="text-lg font-semibold text-green-400">
                        {Array.from(results.values()).filter(r => r.youtubeUrl).length}
                      </div>
                      <div className="text-xs text-[#64748B]">Matched</div>
                    </div>
                    <div className="bg-[#0B1120]/50 p-3 rounded">
                      <div className="text-lg font-semibold text-red-400">
                        {Array.from(results.values()).filter(r => !r.youtubeUrl).length}
                      </div>
                      <div className="text-xs text-[#64748B]">No match</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* How it works - visible only when not logged in */}
            {!isLoggedIn && (
              <div className="bg-glass border-glass rounded-xl p-4">
                <h3 className="font-medium text-white mb-3">How it works</h3>
                <div className="space-y-3 text-sm text-[#94A3B8]">
                  <div className="flex">
                    <div className="w-6 h-6 rounded-full bg-[#1E293B] flex items-center justify-center text-xs mr-3 flex-shrink-0">1</div>
                    <p>Connect your Spotify account securely with OAuth</p>
                  </div>
                  <div className="flex">
                    <div className="w-6 h-6 rounded-full bg-[#1E293B] flex items-center justify-center text-xs mr-3 flex-shrink-0">2</div>
                    <p>Paste your Spotify playlist URL</p>
                  </div>
                  <div className="flex">
                    <div className="w-6 h-6 rounded-full bg-[#1E293B] flex items-center justify-center text-xs mr-3 flex-shrink-0">3</div>
                    <p>Get YouTube links for all tracks in batches</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Batch info - visible when processing */}
            {progress.total > 0 && (
              <div className="bg-glass border-glass rounded-xl p-4">
                <h3 className="font-medium text-white mb-3">Batch Info</h3>
                <div className="text-sm text-[#94A3B8] space-y-2">
                  <p>Processing in batches to stay within serverless limits.</p>
                  <p>You can leave this page; completed batches will remain visible until you refresh.</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-12 text-xs text-white text-center">
          <p className="mb-3">Links redirect to YouTube. No content hosted.</p>
          <div className="flex justify-center gap-6">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors duration-300">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-gray-300 transition-colors duration-300">Terms</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}