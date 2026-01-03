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
                                    <li>✅ Technical data (IP/timestamps) collected for security/debugging</li>
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
                                            <ul className="list-disc list-inside ml-6 mt-1">                                                <li>Track name</li>
                                                <li>Artist name(s)</li>
                                                <li>Track duration</li>
                                            </ul>
                                        </li>
                                        <li>User preferences related to matching or export (if applicable)</li>
                                    </ul>

                                    <p className="mt-4 font-medium">We <span className="text-white">do not</span> collect:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4 text-[#94A3B8]">
                                        <li>Spotify or YouTube account passwords</li>
                                        <li>Payment information</li>
                                        <li>Personal identifiers such as name, email, or phone number (unless explicitly provided for support)</li>
                                    </ul>

                                    <h3 className="text-lg font-medium text-white mt-6 mb-2">2.2 OAuth Tokens and Authentication</h3>
                                    <p>Our Service uses the official Spotify OAuth 2.0 protocol to authenticate users and fetch playlist data. Please note the following important details regarding token handling:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4 text-[#94A3B8]">
                                        <li><span className="font-medium text-white">Requirement:</span> Authentication is required to access the Service, including metadata for both public and private playlists, to ensure consistent and secure data retrieval.</li>
                                        <li><span className="font-medium text-white">Requested Scopes:</span> We request limited, read-only access with the following scopes: <code className="text-white text-xs">playlist-read-private</code> and <code className="text-white text-xs">playlist-read-collaborative</code>. We cannot create, delete, or modify your library.</li>
                                        <li><span className="font-medium text-white">Token Disclosure:</span> Upon authentication, we receive an <span className="italic">access token</span> (short-lived) and a <span className="italic">refresh token</span> (long-lived). We consider these tokens as <span className="font-medium text-white">credentials</span> and protect them with high security.</li>
                                        <li><span className="font-medium text-white">Storage Method:</span> Tokens are stored exclusively in your browser as secure, <code className="text-white text-xs">httpOnly</code>, <code className="text-white text-xs">secure</code>, and <code className="text-white text-xs">SameSite: Lax</code> cookies. We <span className="font-medium text-white">do not store</span> these tokens in an external database or server-side persistent storage.</li>
                                        <li><span className="font-medium text-white">Storage Duration:</span> Access tokens are transient and expire within 1 hour. Refresh tokens are stored for <span className="font-medium text-white">30 days</span> to provide a seamless experience without requiring daily logins.</li>
                                        <li><span className="font-medium text-white">Expiration and Deletion:</span> Tokens are automatically rotated upon use. You can force immediate deletion of all tokens from your browser by clicking the <span className="font-medium text-white">&quot;Log out&quot;</span> button.</li>
                                    </ul>

                                    <h3 className="text-lg font-medium text-white mt-6 mb-2">2.3 Automatically Collected Information</h3>
                                    <p>We automatically collect limited technical data. Under the GDPR, certain identifiers such as IP addresses (when combined with other data) may be classified as <span className="font-medium text-white">Personal Identifiable Information (PII)</span>.</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                                        <li><span className="font-medium text-white">Data types:</span> IP address, request timestamps, browser and device metadata.</li>
                                        <li><span className="font-medium text-white">Legal Basis:</span> Processing is based on our <span className="font-medium text-white">Legitimate Interests</span> (maintaining security, debugging errors, and preventing abuse). See Section 11 for details.</li>
                                        <li><span className="font-medium text-white">Retention Period:</span> This technical data is stored in server logs for a maximum of <span className="font-medium text-white">30 days</span>, after which it is automatically deleted or anonymized.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
                                    <p>We use collected information only to:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                                        <li>Fetch Spotify playlist metadata via secure OAuth tokens</li>
                                        <li>Search YouTube for corresponding music videos</li>
                                        <li>Apply automated matching algorithms (fuzzy matching, duration comparison)</li>
                                        <li>Generate confidence scores and debug mismatch logs (if enabled)</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">4. Algorithmic Matching Disclaimer</h2>
                                    <p>Video matching is performed <span className="font-medium text-white">automatically</span> using heuristic methods. We <span className="font-medium text-white">do not guarantee</span> that all matches are exact or official.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">5. Data Storage and Retention</h2>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li><span className="font-medium text-white">In-Memory Processing:</span> Playlist metadata and matching results are processed temporarily in memory.</li>
                                        <li><span className="font-medium text-white">No Database Storage:</span> We do <span className="font-medium text-white">not</span> store your Spotify playlists, search history, or personal results on our servers.</li>
                                        <li><span className="font-medium text-white">Log retention:</span> Debug logs (if enabled) are retained for a maximum of 30 days for quality improvement.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">6. Third-Party Services</h2>
                                    <p>The Service interacts with <span className="font-medium text-white">Spotify</span> and <span className="font-medium text-white">YouTube</span>. We are <span className="font-medium text-white">not affiliated with, endorsed by, or sponsored by</span> these services. Your use is subject to their respective policies.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">7. Cookies</h2>
                                    <p>Cookies are used exclusively for session management (OAuth refresh tokens) and basic site analytics. No advertising or cross-site tracking cookies are used.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">8. Data Security</h2>
                                    <p>We implement reasonable technical measures to protect data. However, no internet-based service is completely secure, and we cannot guarantee absolute security.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">9. Children&apos;s Privacy</h2>
                                    <p>The Service is not intended for users under the age of 13. We do not knowingly collect personal data from children.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">10. Revoking Access</h2>
                                    <p>You can revoke access at any time by:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                                        <li>Clicking the &quot;Log out&quot; or &quot;Change account&quot; button</li>
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
                                    <h3 className="text-lg font-medium text-white mt-4 mb-2">For EU Users (GDPR)</h3>
                                    <p>You have the right to access, rectify, or erase your data. Processing is based on <span className="font-medium text-white">Legitimate Interests</span> for providing the requested service. Session data is deleted upon logout.</p>

                                    <h3 className="text-lg font-medium text-white mt-6 mb-2">For Indian Users (IT Rules 2021)</h3>
                                    <p>We act as an intermediary providing automated search/linking services. We do not host, store, or modify user-generated content. Grievance redressal is available below.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">12. Changes to This Policy</h2>
                                    <p>We may update this Privacy Policy periodically. Continued use constitutes acceptance of the revised policy.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">13. Contact</h2>
                                    <p>For privacy-related questions or requests, please contact us at: <a href="mailto:privacy@yourcompany.com" className="text-[#38BDF8] hover:underline">privacy@yourcompany.com</a></p>
                                    <div className="mt-4 p-4 bg-[#1E293B]/30 rounded-lg border border-glass">
                                        <p className="font-medium text-white">India Grievance Officer:</p>
                                        <p className="mt-1 text-sm text-[#94A3B8]">Name: [Actual Officer Name]</p>
                                        <p className="text-sm text-[#94A3B8]">Email: <a href="mailto:grievance@yourcompany.com" className="text-[#38BDF8] hover:underline">grievance@yourcompany.com</a></p>
                                        <p className="text-sm text-[#94A3B8]">Address: [Complete Physical Address with Pincode]</p>
                                    </div>                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}