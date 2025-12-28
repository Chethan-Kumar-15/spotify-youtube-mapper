import Link from 'next/link';

export default function Privacy() {
    return (
        <div className="min-h-screen bg-dark-navy text-[#E5E7EB] font-[Inter,ui-sans-serif,system-ui]">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
                    {/* Left sidebar */}
                    <div className="lg:col-span-1 bg-glass border-glass rounded-xl p-4 h-fit">
                        <div className="flex flex-col space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Playlist Mapper</h2>
                            </div>
                            
                            <nav className="space-y-2">
                                <Link href="/" className="block py-2 px-3 rounded text-sm text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/30 transition-colors">Home</Link>
                                <Link href="/privacy" className="block py-2 px-3 rounded text-sm text-white bg-[#1E293B]/50">Privacy</Link>
                                <Link href="/terms" className="block py-2 px-3 rounded text-sm text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/30 transition-colors">Terms</Link>
                            </nav>
                            
                            <Link href="/" className="mt-4 text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors duration-300">
                                ← Back to mapper
                            </Link>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="lg:col-span-1">
                        <div className="bg-glass border-glass rounded-xl p-6">
                            <h1 className="text-2xl font-semibold text-white mb-8">Privacy Policy</h1>

                            <div className="space-y-8 text-base text-[#94A3B8]">
                                <section>
                                    <h2 className="text-xl font-medium text-white mb-3">Information We Access</h2>
                                    <p>Read-only access to Spotify playlists. Track names and artist names only.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-medium text-white mb-3">Information We Store</h2>
                                    <ul className="list-disc list-inside space-y-2 text-[#64748B]">
                                        <li>Session token in HTTP-only cookie</li>
                                        <li>Temporary search cache (resets on restart)</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-xl font-medium text-white mb-3">Information We Do NOT Store</h2>
                                    <ul className="list-disc list-inside space-y-2 text-[#64748B]">
                                        <li>Spotify profile or username</li>
                                        <li>Playlist contents</li>
                                        <li>Personally identifiable information</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-xl font-medium text-white mb-3">Revoking Access</h2>
                                    <p className="text-[#64748B]">
                                        Click Logout or visit{' '}
                                        <a
                                            href="https://www.spotify.com/account/apps/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#38BDF8] hover:underline transition-colors duration-300"
                                        >
                                            Spotify Connected Apps
                                        </a>.
                                    </p>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}