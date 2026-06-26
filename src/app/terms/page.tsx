import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service — PhoenixTools",
  description: "Terms of Service for PhoenixTools. Read our terms and conditions for using the platform.",
}

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-[13px] text-[#BEB7AC]/50 mt-3">Last updated: June 26, 2026</p>

            <div className="mt-10 space-y-8 text-[14px] sm:text-[15px] text-[#BEB7AC]/80 leading-relaxed">
              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using PhoenixTools (the &quot;Service&quot;), you agree to be bound by these Terms of
                  Service (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Service.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">2. Description of Service</h2>
                <p>
                  PhoenixTools provides a suite of online utility tools including PDF processing, image optimization,
                  video conversion, audio editing, AI-powered tools, text utilities, developer tools, SEO tools,
                  and business tools. The Service includes both free and premium tiers.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">3. Account Registration</h2>
                <p>
                  You may create an account using your email address or through Google/GitHub OAuth. You are
                  responsible for maintaining the confidentiality of your account credentials and for all activity
                  that occurs under your account.
                </p>
                <p className="mt-2">
                  You must be at least 13 years old to create an account. You agree to provide accurate, current,
                  and complete information during registration and to update such information as necessary.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">4. Free and Premium Tiers</h2>
                <h3 className="text-[#D97757] font-medium mb-2">Free Tier</h3>
                <p>
                  Free users can access all tools with daily usage limits and a maximum file size of 500MB. Free
                  users may see advertisements. We reserve the right to modify free-tier limits at any time.
                </p>
                <h3 className="text-[#D97757] font-medium mb-2 mt-4">Premium Tier</h3>
                <p>
                  Premium subscriptions remove usage limits, increase file size limits to 4GB, and remove all
                  advertisements. Subscriptions are billed monthly or annually through Razorpay. All payments are
                  non-refundable except where required by applicable law.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">5. Acceptable Use</h2>
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li>Use the Service for any illegal purpose</li>
                  <li>Upload files containing malware, viruses, or malicious code</li>
                  <li>Attempt to gain unauthorized access to any part of the Service</li>
                  <li>Use automated tools (bots, scrapers) to access the Service without permission</li>
                  <li>Abuse rate limits or attempt to circumvent usage restrictions</li>
                  <li>Resell or redistribute the Service without written authorization</li>
                  <li>Upload files that violate the intellectual property rights of others</li>
                  <li>Use the Service to process files containing illegal, harmful, or explicit content</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">6. Intellectual Property</h2>
                <p>
                  The Service, including its design, code, features, and content, is owned by PhoenixTools and
                  protected by copyright, trademark, and other intellectual property laws. You retain full ownership
                  of any files you upload to the Service. We claim no rights over your content.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">7. File Processing & Privacy</h2>
                <p>
                  Files are processed locally in your browser whenever possible. When server-side processing is
                  required, files are automatically deleted after processing completes. We do not access, read,
                  share, or store your file contents. See our{" "}
                  <a href="/privacy" className="text-[#D97757] hover:text-[#e08a6a] underline underline-offset-2 transition-colors">
                    Privacy Policy
                  </a>{" "}
                  for full details.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">8. Payments & Refunds</h2>
                <p>
                  All payments are processed securely through Razorpay. By purchasing a premium subscription, you
                  authorize us to charge your selected payment method on a recurring basis until you cancel.
                </p>
                <p className="mt-2">
                  You may cancel your subscription at any time from your dashboard. Cancellation takes effect at the
                  end of the current billing period. No partial refunds are provided for unused portions of a
                  billing period, except where required by applicable law.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">9. Disclaimers</h2>
                <p>
                  THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER
                  EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR
                  SECURE. WE ARE NOT RESPONSIBLE FOR ANY LOSS OF DATA, REVENUE, OR BUSINESS RESULTING FROM THE
                  USE OF THE SERVICE.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">10. Limitation of Liability</h2>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, PHOENIXTOOLS SHALL NOT BE LIABLE FOR ANY INDIRECT,
                  INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF
                  PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING FROM YOUR USE OF THE SERVICE.
                </p>
                <p className="mt-2">
                  Our total liability to you for any claims arising from the Service shall not exceed the amount
                  you paid us in the 12 months preceding the claim, or $100, whichever is greater.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">11. Indemnification</h2>
                <p>
                  You agree to indemnify and hold harmless PhoenixTools and its operators from any claims, losses,
                  or damages (including legal fees) arising from your use of the Service, your violation of these
                  Terms, or your violation of any rights of a third party.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">12. Termination</h2>
                <p>
                  We may suspend or terminate your access to the Service at any time, without prior notice, for
                  conduct that we determine violates these Terms or is harmful to other users, us, or third parties.
                  Upon termination, your right to use the Service ceases immediately.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">13. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these Terms at any time. We will notify you of material changes
                  by posting the updated Terms on this page with a new &quot;Last updated&quot; date. Your continued use
                  of the Service after changes are posted constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">14. Governing Law</h2>
                <p>
                  These Terms are governed by and construed in accordance with the laws of India. Any disputes
                  arising under these Terms shall be resolved in the courts of Andhra Pradesh, India.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-[#F6F3EE] mb-3">15. Contact</h2>
                <p>Questions about these Terms? Contact us at:</p>
                <p className="mt-2 text-[#D97757]">support.hittools@gmail.com</p>
                <p className="mt-1 text-[#BEB7AC]/50 text-[13px]">India, Andhra Pradesh</p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
