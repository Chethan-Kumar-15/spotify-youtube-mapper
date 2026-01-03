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
                        <div className="bg-glass border-glass rounded-xl p-8">
                            <h1 className="text-3xl font-bold text-white mb-2">Terms and Conditions</h1>
                            <p className="text-sm text-[#64748B] mb-6">Last Updated: January 3, 2026</p>

                            {/* TL;DR Summary */}
                            <div className="bg-[#1E293B]/50 border border-[#38BDF8]/30 rounded-lg p-4 mb-8">
                                <h3 className="text-lg font-semibold text-[#38BDF8] mb-2">📋 TL;DR - Quick Summary</h3>
                                <ul className="space-y-1 text-sm text-[#94A3B8]">
                                    <li>✅ This is a search/linking tool - we don&apos;t download or host music</li>
                                    <li>✅ Automated matching may have errors - verify LOW confidence results</li>
                                    <li>✅ Not affiliated with Spotify or YouTube</li>
                                    <li>✅ Free service provided &quot;as is&quot; - no guarantees</li>
                                    <li>✅ Don&apos;t abuse the service or violate copyright laws</li>
                                    <li>✅ We can change or discontinue the service anytime</li>
                                </ul>
                            </div>

                            <div className="space-y-8 text-[#94A3B8] leading-relaxed">
                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                                    <p>By accessing or using this Service, you agree to be bound by these Terms and Conditions. If you do not agree, do not use the Service.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">2. Description of the Service</h2>
                                    <p>The Service allows users to:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                                        <li>Input a Spotify playlist URL</li>
                                        <li>Retrieve public playlist metadata</li>
                                        <li>Automatically search YouTube for matching song videos</li>
                                        <li>Receive YouTube video links with confidence scores</li>
                                    </ul>
                                    <p className="mt-3">The Service does <span className="font-medium text-white">not</span> download, host, stream, or redistribute copyrighted content.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">3. No Affiliation Disclaimer</h2>
                                    <p>This Service is an independent tool and is <span className="font-medium text-white">not affiliated with Spotify, YouTube, Google, or any rights holders</span>.</p>
                                    <p className="mt-2">All trademarks belong to their respective owners.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">4. Use Restrictions</h2>
                                    <p>You agree <span className="font-medium text-white">not</span> to:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                                        <li>Use the Service for illegal purposes</li>
                                        <li>Circumvent YouTube or Spotify terms of service</li>
                                        <li>Abuse, scrape, or overload the Service</li>
                                        <li>Attempt to reverse engineer proprietary algorithms</li>
                                        <li>Misrepresent ownership of content</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">5. Accuracy Disclaimer</h2>
                                    <p>The Service uses automated matching algorithms, including:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                                        <li>Fuzzy string matching</li>
                                        <li>Duration comparison</li>
                                        <li>Heuristic scoring</li>
                                    </ul>
                                    <p className="mt-3">Results are provided <span className="font-medium text-white">&quot;as is&quot;</span> without warranties of accuracy, completeness, or correctness.</p>
                                    <p className="mt-2">LOW confidence matches require manual user verification.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">6. Intellectual Property</h2>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>The Service&apos;s code, algorithms, UI, and branding are owned by the Service operator.</li>
                                        <li>You retain ownership of your Spotify playlists.</li>
                                        <li>No ownership is transferred for third-party content.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">7. Limitation of Liability</h2>
                                    <p>To the maximum extent permitted by law:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                                        <li>We are not liable for incorrect matches, missing matches, or mismatched videos</li>
                                        <li>We are not responsible for actions taken based on LOW or MEDIUM confidence results</li>
                                        <li>We are not liable for data loss, service downtime, or API changes by third parties</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">8. Service Availability</h2>
                                    <p>The Service may be modified, suspended, or discontinued at any time without notice.</p>
                                    <p className="mt-2">We do not guarantee uptime, availability, or future compatibility with Spotify or YouTube APIs.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">9. Termination</h2>
                                    <p>We reserve the right to restrict or terminate access if these Terms are violated.</p>
                                </section>


                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">10. DMCA & Copyright Notice</h2>

                                    <h3 className="text-lg font-medium text-white mt-4 mb-2">10.1 No Content Hosting</h3>
                                    <p>This Service does <span className="font-medium text-white">not</span>:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                                        <li>Host, store, or cache audio or video files</li>
                                        <li>Stream or transmit copyrighted content</li>
                                        <li>Provide download functionality</li>
                                        <li>Circumvent digital rights management (DRM)</li>
                                    </ul>
                                    <p className="mt-3">We provide <span className="font-medium text-white">only</span> publicly accessible links to content hosted by third parties (YouTube).</p>

                                    <h3 className="text-lg font-medium text-white mt-4 mb-2">10.2 Safe Harbor Compliance</h3>
                                    <p>This Service operates as a <span className="font-medium text-white">search engine</span> and <span className="font-medium text-white">information location tool</span> under the Digital Millennium Copyright Act (DMCA) 17 U.S.C. § 512.</p>
                                    <p className="mt-2">We qualify for safe harbor protection because:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                                        <li>We do not have actual knowledge of infringing material</li>
                                        <li>We do not receive direct financial benefit from alleged infringement</li>
                                        <li>We act expeditiously to remove or disable access upon notification</li>
                                        <li>We maintain a designated agent for copyright notices</li>
                                    </ul>

                                    <h3 className="text-lg font-medium text-white mt-4 mb-2">10.3 DMCA Takedown Procedure</h3>
                                    <p>If you believe content linked by this Service infringes your copyright:</p>
                                    <ol className="list-decimal list-inside space-y-1 mt-2 ml-4">
                                        <li>Contact YouTube directly (content is hosted there, not here)</li>
                                        <li>If the link itself violates your rights, submit a DMCA notice including:
                                            <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                                                <li>Identification of the copyrighted work</li>
                                                <li>URL of the allegedly infringing link</li>
                                                <li>Your contact information</li>
                                                <li>Statement of good faith belief</li>
                                                <li>Statement of accuracy and authority</li>
                                                <li>Physical or electronic signature</li>
                                            </ul>                                        </li>
                                    </ol>
                                    <p className="mt-3">We will respond within 72 hours to valid DMCA notices.</p>

                                    <h3 className="text-lg font-medium text-white mt-4 mb-2">10.4 Counter-Notification</h3>
                                    <p>If you believe content was removed in error, you may submit a counter-notification per DMCA § 512(g)(3).</p>

                                    <h3 className="text-lg font-medium text-white mt-4 mb-2">10.5 Repeat Infringer Policy</h3>
                                    <p>We reserve the right to terminate access for users who repeatedly provide infringing playlist URLs.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">11. Governing Law</h2>
                                    <p>These Terms shall be governed by and interpreted in accordance with the laws of <span className="font-medium text-white">India</span>, without regard to conflict-of-law principles. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">12. Changes to Terms</h2>
                                    <p>We may update these Terms at any time. Continued use of the Service constitutes acceptance of the updated Terms.</p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-3">13. Contact</h2>
                                    <p>For questions regarding these Terms, please contact us through the application support channels.</p>
                                    <p className="mt-2"><span className="font-medium text-white">DMCA Agent:</span> For copyright notices, specify &quot;DMCA Takedown Request&quot; in your contact.</p>
                                    <p className="mt-1"><span className="font-medium text-white">Grievance Officer (India):</span> In accordance with the IT Act 2000 and rules made there under, the name and contact details of the Grievance Officer are available upon request through our support channels. Specify &quot;India Grievance&quot; for priority handling.</p>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}