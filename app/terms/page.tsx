import Link from 'next/link';

export default function Terms() {
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
                                <Link href="/privacy" className="block py-2 px-3 rounded text-sm text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/30 transition-colors">Privacy</Link>
                                <Link href="/terms" className="block py-2 px-3 rounded text-sm text-white bg-[#1E293B]/50">Terms</Link>
                            </nav>
                            
                            <Link href="/" className="mt-4 text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors duration-300">
                                ← Back to mapper
                            </Link>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="lg:col-span-1">
                        <div className="bg-glass border-glass rounded-xl p-6">
                            <h1 className="text-2xl font-semibold text-white mb-8">Terms of Service</h1>

                            <div className="space-y-8 text-base text-[#94A3B8]">
                                <section>
                                    <h2 className="text-xl font-medium text-white mb-3">What This Service Does</h2>
                                    <p>Maps Spotify playlist metadata to YouTube video links. Search and linking only.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-medium text-white mb-3">What This Service Does NOT Do</h2>
                                    <ul className="list-disc list-inside space-y-2 text-[#64748B]">
                                        <li>Download audio or video content</li>
                                        <li>Host or stream copyrighted material</li>
                                        <li>Store your playlist data permanently</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-xl font-medium text-white mb-3">Disclaimer</h2>
                                    <p className="text-[#64748B]">
                                        Not affiliated with Spotify AB or Google LLC.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-medium text-white mb-3">Limitations</h2>
                                    <p className="text-[#64748B]">
                                        Free service provided as-is. No guarantees.
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