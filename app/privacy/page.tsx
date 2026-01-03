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
                        <div className="bg-glass border-glass rounded-xl p-8">
                            <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
                            <p className="text-sm text-[#64748B] mb-6">Last Updated: January 3, 2026</p>

                            {/* TL;DR Summary */}
                            <div className="bg-[#1E293B]/50 border border-[#38BDF8]/30 rounded-lg p-4 mb-8">
                                <h3 className="text-lg font-semibold text-[#38BDF8] mb-2">📋 TL;DR - Quick Summary</h3>
                                <ul className="space-y-1 text-sm text-[#94A3B8]">
                                    <li>✅ Read-only access to Spotify playlists (names/artists/duration)</li>
                                    <li>✅ No storage of login credentials or personal profile data</li>
                                    <li>✅ Automated matching results are processed in-memory</li>
                                    <li>✅ Not affiliated with Spotify or YouTube</li>
                                    <li>✅ Your data rights (GDPR/India IT Rules) are fully respected</li>
                                </ul>
                            </div>

                            <div className="space-y-8 text-[#94A3B8] leading-relaxed">
                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
                                    <p>This Privacy Policy explains how we collect, use, and protect information when you use our service (&quot;Service&quot;), which converts Spotify playlists into matched YouTube video links using automated matching algorithms.</p>
                                    <p className="mt-2">By using the Service, you agree to the practices described in this policy.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>

                                    <h3 className="text-lg font-medium text-white mt-4 mb-2">2.1 Information You Provide</h3>
                                    <p>We may collect the following information when you use the Service:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4 text-[#94A3B8]">
                                        <li>Spotify playlist URLs</li>
                                        <li>Spotify track metadata retrieved via public APIs, including:
                                            <ul className="list-circle list-inside ml-6 mt-1">
                                                <li>Track name</li>
                                                <li>Artist name(s)</li>
                                                <li>Track duration</li>
                                            </ul>
                                        </li>
                                        <li>User preferences related to matching or export (if applicable)</li>
                                    </ul>

                                    <p className="mt-4 font-medium">We <span className="text-white">do not</span> collect:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4 text-[#94A3B8]">
                                        <li>Spotify login credentials</li>
                                        <li>YouTube login credentials</li>
                                        <li>Payment information</li>
                                        <li>Personal identifiers such as name, email, or phone number (unless explicitly provided for support)</li>
                                    </ul>

                                    <h3 className="text-lg font-medium text-white mt-4 mb-2">2.2 Automatically Collected Information</h3>
                                    <p>We may automatically collect limited technical data, such as:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                                        <li>IP address</li>
                                        <li>Browser type</li>
                                        <li>Device type</li>
                                        <li>Request timestamps</li>
                                        <li>Error and performance logs</li>
                                    </ul>
                                    <p className="mt-2">This data is used solely for security, debugging, and performance optimization.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
                                    <p>We use collected information only to:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                                        <li>Fetch public Spotify playlist data</li>
                                        <li>Search YouTube for corresponding music videos</li>
                                        <li>Apply automated matching algorithms (fuzzy title matching, duration comparison, artist verification)</li>
                                        <li>Generate confidence scores (HIGH / MEDIUM / LOW)</li>
                                        <li>Improve accuracy, reliability, and performance of the Service</li>
                                        <li>Debug errors and analyze mismatches (optional debug mode)</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">4. Algorithmic Matching Disclaimer</h2>
                                    <p>Video matching is performed <span className="font-medium text-white">automatically</span> using heuristic and probabilistic methods. We <span className="font-medium text-white">do not guarantee</span> that all matches are exact, official, or error-free.</p>
                                    <p className="mt-2">Low-confidence matches may require manual user verification.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">5. Data Storage and Retention</h2>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Playlist URLs and matching results may be temporarily processed in memory.</li>
                                        <li>We do <span className="font-medium text-white">not</span> permanently store Spotify playlists or YouTube results unless explicitly stated.</li>
                                        <li>Debug logs (if enabled) may be retained for a limited period for quality improvement.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">6. Third-Party Services</h2>
                                    <p>The Service interacts with:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                                        <li><span className="font-medium text-white">Spotify</span> (public metadata APIs)</li>
                                        <li><span className="font-medium text-white">YouTube</span> (search results and public video metadata)</li>
                                    </ul>
                                    <p className="mt-3">We are <span className="font-medium text-white">not affiliated with, endorsed by, or sponsored by Spotify or YouTube</span>.</p>
                                    <p className="mt-2">Your use of Spotify and YouTube is subject to their respective terms and privacy policies.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">7. Cookies</h2>
                                    <p>If cookies or similar technologies are used, they are limited to:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                                        <li>Session management</li>
                                        <li>Basic analytics</li>
                                    </ul>
                                    <p className="mt-2">No tracking cookies or advertising cookies are used without consent.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">8. Data Security</h2>
                                    <p>We implement reasonable technical and organizational measures to protect data from unauthorized access, misuse, or disclosure.</p>
                                    <p className="mt-2">However, no internet-based service is completely secure, and we cannot guarantee absolute security.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">9. Children&apos;s Privacy</h2>
                                    <p>The Service is not intended for users under the age of 13. We do not knowingly collect personal data from children.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">10. Revoking Access</h2>
                                    <p>You can revoke access at any time by:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                                        <li>Clicking the &quot;Change Spotify account&quot; button in the app</li>
                                        <li>Visiting{' '}
                                            <a
                                                href="https://www.spotify.com/account/apps/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#38BDF8] hover:underline"
                                            >
                                                Spotify Connected Apps
                                            </a>
                                        </li>
                                    </ul>
                                </section>


                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">11. International Users (GDPR & India IT Rules)</h2>

                                    <h3 className="text-lg font-medium text-white mt-4 mb-2">For European Union Users (GDPR)</h3>
                                    <p>Under the General Data Protection Regulation (GDPR), you have the following rights:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                                        <li><span className="font-medium text-white">Right to Access:</span> Request a copy of data we hold about you</li>
                                        <li><span className="font-medium text-white">Right to Rectification:</span> Request correction of inaccurate data</li>
                                        <li><span className="font-medium text-white">Right to Erasure:</span> Request deletion of your data</li>
                                        <li><span className="font-medium text-white">Right to Object:</span> Object to processing of your data</li>
                                        <li><span className="font-medium text-white">Data Portability:</span> Receive your data in a structured format</li>
                                    </ul>
                                    <p className="mt-3">Legal basis for processing: <span className="font-medium text-white">Legitimate interests</span> (providing the service you requested)</p>
                                    <p className="mt-2">Data retention: Session data is deleted when you log out. No long-term personal data storage.</p>

                                    <h3 className="text-lg font-medium text-white mt-4 mb-2">For Indian Users (IT Rules 2021)</h3>
                                    <p>In compliance with India&apos;s Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                                        <li>We act as an intermediary providing automated search/linking services</li>
                                        <li>We do not host, store, or modify user-generated content</li>
                                        <li>We do not exercise editorial control over search results</li>
                                        <li>Grievance redressal mechanism available through support channels</li>
                                    </ul>
                                    <p className="mt-3">Data localization: Technical data may be processed on servers outside India for performance optimization.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">12. Changes to This Policy</h2>
                                    <p>We may update this Privacy Policy periodically. Continued use of the Service after changes constitutes acceptance of the revised policy.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">13. Contact</h2>
                                    <p>For privacy-related questions or requests, please contact us through the application support channels.</p>
                                    <p className="mt-2"><span className="font-medium text-white">EU Representative:</span> For GDPR-related inquiries, contact us specifying &quot;GDPR Request&quot;</p>
                                    <p className="mt-1"><span className="font-medium text-white">India Grievance Officer:</span> For IT Rules compliance, contact us specifying &quot;India Grievance&quot;</p>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}