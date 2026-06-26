import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — PhoenixTools",
  description: "Privacy Policy for PhoenixTools. Learn how we collect, use, and protect your personal information.",
}

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0F0E0A]">
        <section className="pt-28 sm:pt-32 pb-20 sm:pb-24">
          <div className="max-w-3xl mx-auto px-5 sm:px-8">
            <span className="text-[11px] font-medium text-[#D97757] uppercase tracking-[0.2em]">
              Legal
            </span>
            <h1 className="font-serif text-[clamp(32px,5vw,48px)] text-[#F6F3EE] leading-[1.1] tracking-[-0.02em] mt-4">
              Privacy Policy
            </h1>
            <p className="text-[13px] text-[#BEB7AC]/50 mt-3">Last updated: June 26, 2026</p>

            <div className="mt-10 space-y-8 text-[14px] sm:text-[15px] text-[#BEB7AC]/80 leading-relaxed">
              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">1. Introduction</h2>
                <p>
                  PhoenixTools (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the PhoenixTools platform (the &quot;Service&quot;).
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you
                  use our website and tools.
                </p>
                <p className="mt-3">
                  By using the Service, you agree to the collection and use of information in accordance with this policy.
                  If you do not agree, please discontinue use.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">2. Information We Collect</h2>
                <h3 className="text-[#D97757] font-medium mb-2">Account Information</h3>
                <p>
                  When you create an account, we collect your name, email address, and password (stored in hashed form).
                  If you sign up via Google or GitHub OAuth, we receive your name, email, and profile picture from those
                  services.
                </p>
                <h3 className="text-[#D97757] font-medium mb-2 mt-4">File Processing</h3>
                <p>
                  Files you upload for processing are handled as follows:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                  <li><strong className="text-[#F6F3EE]">Client-side tools:</strong> Files are processed entirely in your browser. No file data is transmitted to our servers.</li>
                  <li><strong className="text-[#F6F3EE]">Server-side tools:</strong> Files are temporarily uploaded to our servers for processing and automatically deleted after processing completes. We do not store, read, or share your file contents.</li>
                </ul>
                <h3 className="text-[#D97757] font-medium mb-2 mt-4">Usage Data</h3>
                <p>
                  We collect anonymized usage data including tool usage counts, daily active usage, and browser type.
                  This data is used to manage free-tier limits and improve the Service. It is not sold or shared with
                  third parties.
                </p>
                <h3 className="text-[#D97757] font-medium mb-2 mt-4">Payment Information</h3>
                <p>
                  Payments are processed through Razorpay. We do not store your credit card number, CVV, or banking
                  details. We only retain your Razorpay order ID and payment status to manage your subscription.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">3. How We Use Your Information</h2>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>To provide and maintain the Service</li>
                  <li>To manage your account and subscription</li>
                  <li>To process file operations you request</li>
                  <li>To enforce usage limits for free-tier users</li>
                  <li>To communicate with you about your account or the Service</li>
                  <li>To detect and prevent abuse or security issues</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">4. Data Sharing</h2>
                <p>We do not sell your personal information. We may share data with:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li><strong className="text-[#F6F3EE]">Service providers:</strong> Supabase (authentication/database), Razorpay (payments), Vercel (hosting) — only as necessary to operate the Service.</li>
                  <li><strong className="text-[#F6F3EE]">Legal requirements:</strong> If required by law, court order, or governmental request.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">5. Data Retention</h2>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong className="text-[#F6F3EE]">Account data:</strong> Retained until you delete your account.</li>
                  <li><strong className="text-[#F6F3EE]">Processed files:</strong> Deleted automatically after processing. Not retained.</li>
                  <li><strong className="text-[#F6F3EE]">Usage logs:</strong> Retained for 30 days for limit enforcement, then deleted.</li>
                  <li><strong className="text-[#F6F3EE]">Payment records:</strong> Retained for 7 years as required by Indian tax law.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">6. Your Rights</h2>
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li>Access the personal data we hold about you</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your account and data</li>
                  <li>Export your data in a portable format</li>
                  <li>Opt out of non-essential data collection</li>
                </ul>
                <p className="mt-3">
                  To exercise these rights, contact us at support.hittools@gmail.com.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">7. Security</h2>
                <p>
                  We implement industry-standard security measures including encrypted data transmission (HTTPS/TLS),
                  hashed password storage, and regular security audits. However, no method of electronic transmission
                  or storage is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">8. Cookies</h2>
                <p>
                  We use essential cookies to maintain your session and preferences. We do not use tracking cookies.
                  Third-party services (Razorpay, Google AdSense) may set their own cookies. You can manage cookie
                  preferences through your browser settings or our cookie consent banner.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">9. Children&apos;s Privacy</h2>
                <p>
                  The Service is not intended for users under 13 years of age. We do not knowingly collect personal
                  information from children. If we discover that a child has provided us with personal data, we will
                  delete it immediately.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">10. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of significant changes by
                  posting the new policy on this page and updating the &quot;Last updated&quot; date. Continued use of the
                  Service after changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">11. Contact Us</h2>
                <p>
                  If you have questions about this Privacy Policy, contact us at:
                </p>
                <p className="mt-2 text-[#D97757]">
                  support.hittools@gmail.com
                </p>
                <p className="mt-1 text-[#BEB7AC]/50 text-[13px]">
                  India, Andhra Pradesh
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
