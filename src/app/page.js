'use client';

import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import QueueStatusWidget from '@/components/QueueStatusWidget';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  const steps = [
    {
      number: 1,
      title: "AI Traffic Prediction",
      description: "Historical data analysis predicts ticket surges, accounting for holidays, discounts, and special events to proactively prepare the system."
    },
    {
      number: 2,
      title: "Smart Waiting Room Activation",
      description: "Virtual waiting room activates when thresholds are met with DNS-level redirect to high-load servers, keeping the main system stable."
    },
    {
      number: 3,
      title: "Trust Score Assessment",
      description: "Initial trust score calculated on entry. Low-trust users (≤0.5) get captcha challenge in waiting room to prevent bots from reaching the form."
    },
    {
      number: 4,
      title: "Form Interaction Analysis",
      description: "AI monitors user behavior during multi-page form completion, analyzing mouse movements, typing patterns, and interaction timing."
    },
    {
      number: 5,
      title: "Final Verification & Booking",
      description: "Final trust score determines if additional verification needed. Seamless completion for humans, friction for bots, with zero downtime."
    }
  ];

  // ✅ Auto redirect to dashboard when logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F27500] mx-auto mb-4"></div>
          <div className="text-[#F27500] text-xl font-semibold">Loading...</div>
          <div className="text-gray-500 text-sm mt-2">Please wait while we prepare your experience</div>
        </div>
      </div>
    );
  }

  // If user is logged in, show loading while redirecting
  if (user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F27500] mx-auto mb-4"></div>
          <div className="text-[#F27500] text-xl font-semibold">Redirecting to Dashboard...</div>
          <div className="text-gray-500 text-sm mt-2">Taking you to your personalized dashboard</div>
        </div>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-brand to-brand-hover text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28 flex flex-col lg:flex-row items-center">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              No more hassle, <br /> easier than ever!
            </h1>
            <p className="text-lg mb-8 max-w-xl">
              Quikyu is here to revolutionize train ticket booking: faster, easier, and fairer for all Indonesian passengers.
            </p>
            <div className="flex gap-4 justify-center lg:justify-start">
              <Link
                href="/register"
                className="bg-white text-brand px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Demo Now
              </Link>
              <Link
                href="/login"
                className="border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-white hover:text-brand transition-colors"
              >
                Login
              </Link>
            </div>
          </div>

          {/* Card Gambar Hero */}
          <div className="flex-1 mt-12 lg:mt-0 flex justify-center">
            <div className="max-w-lg rounded-2xl overflow-hidden border shadow-xl border-gray-100 hover:scale-105 hover:rotate-3 hover:shadow-2xl transition duration-500">
              <Image
                src="/hero-train.jpg"
                alt="Kereta Api Indonesia"
                width={600}
                height={400}
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why <span className="text-brand">us</span>?
        </h2>

        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div className="p-6 rounded-lg bg-gray-50 shadow hover:shadow-lg transition">
            <div className="text-5xl mb-4">🚄</div>
            <h3 className="text-xl font-semibold mb-2">Fast and Reliable</h3>
            <p className="text-gray-600">No more server downtime. Book tickets with comfort.</p>
          </div>
          <div className="p-6 rounded-lg bg-gray-50 shadow hover:shadow-lg transition">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">Smart Bot-Detection</h3>
            <p className="text-gray-600">Fair system with seamless UX for happy customers</p>
          </div>
          <div className="p-6 rounded-lg bg-gray-50 shadow hover:shadow-lg transition">
            <div className="text-5xl mb-4">🧩</div>
            <h3 className="text-xl font-semibold mb-2">Easy Integration</h3>
            <p className="text-gray-600">Plug-and-play, no system-breaking changes</p>
          </div>
          <div className="p-6 rounded-lg bg-gray-50 shadow hover:shadow-lg transition">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Secure and Trusted</h3>
            <p className="text-gray-600">Minimal-to-zero user data collection required</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gradient-to-r from-red-600 to-brand text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-center text-white/90 mb-16 max-w-2xl mx-auto">
            Experience seamless train ticket booking with our intelligent multi-layer system
          </p>

          {/* Carousel Container */}
          <div className="relative">
            {/* Left Button */}
            <button
              onClick={prevStep}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-4 border border-white/30 transition-all"
              aria-label="Previous step"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Cards Container */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentStep * 100}%)` }}
              >
                {steps.map((step, index) => (
                  <div key={index} className="min-w-full px-4">
                    <div className="max-w-2xl mx-auto">
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20 hover:bg-white/15 transition-all">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-brand text-3xl font-bold mb-8 mx-auto">
                          {step.number}
                        </div>
                        <h3 className="text-3xl font-bold mb-6 text-center">{step.title}</h3>
                        <p className="text-white/90 leading-relaxed text-lg text-center">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Button */}
            <button
              onClick={nextStep}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-4 border border-white/30 transition-all"
              aria-label="Next step"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-3 mt-8">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Key Metrics/Impact Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            The <span className="text-brand">Impact</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Transform ticket booking from frustrating to flawless with us
          </p>
        </div>

        {/* Additional Stats */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
            <h3 className="text-2xl font-bold mb-6 text-center">Before Quikyu</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span className="text-gray-700">Frequent server crashes</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span className="text-gray-700">70% bot traffic dominance</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span className="text-gray-700">15+ min average wait time</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span className="text-gray-700">Poor user satisfaction (28%)</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand/10 to-brand/5 rounded-xl p-8 border-2 border-brand">
            <h3 className="text-2xl font-bold mb-6 text-center text-brand">With Quikyu</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-brand rounded-full"></div>
                <span className="text-gray-700">99.9% uptime guaranteed</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-brand rounded-full"></div>
                <span className="text-gray-700">80% reduction in bot activity</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-brand rounded-full"></div>
                <span className="text-gray-700">5 min average booking time</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-brand rounded-full"></div>
                <span className="text-gray-700">High satisfaction (92%)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gradient-to-r from-red-600 to-brand py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-white">
            Frequently Asked <span className="text-white">Questions</span>
          </h2>
          <p className="text-center text-white/90 mb-12">
            Everything you need to know about Quikyu
          </p>

          <div className="space-y-4">
            {/* FAQ 1 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-white/15 transition-colors"
              >
                <span className="font-semibold text-lg text-white">How does Quikyu prevent server crashes?</span>
                <svg
                  className={`w-5 h-5 text-white transition-transform ${openFaq === 1 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 1 && (
                <div className="px-6 pb-5 text-white/90 leading-relaxed">
                  Our AI-powered demand prediction system analyzes historical data to forecast traffic surges. When high demand is detected, the smart waiting room automatically activates with DNS-level redirect to dedicated high-load servers, ensuring the main system stays stable and responsive.
                </div>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-white/15 transition-colors"
              >
                <span className="font-semibold text-lg text-white">Will legitimate users be blocked by the bot detection?</span>
                <svg
                  className={`w-5 h-5 text-white transition-transform ${openFaq === 2 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 2 && (
                <div className="px-6 pb-5 text-white/90 leading-relaxed">
                  No! Our two-step trust scoring system is designed for seamless human experience. Most legitimate users will never see a captcha. Only users with very low trust scores (typically bots and suspicious patterns) will be asked for verification. The AI monitors natural human behavior patterns, so real users flow through effortlessly.
                </div>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-white/15 transition-colors"
              >
                <span className="font-semibold text-lg text-white">How long does integration take?</span>
                <svg
                  className={`w-5 h-5 text-white transition-transform ${openFaq === 3 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 3 && (
                <div className="px-6 pb-5 text-white/90 leading-relaxed">
                  Integration is incredibly simple and fast! Since the waiting room operates at the DNS level, you don't need to modify your existing application code. Most implementations are live within 24-48 hours. Just configure your DNS settings, set your thresholds, and you're ready to go.
                </div>
              )}
            </div>

            {/* FAQ 4 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === 4 ? null : 4)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-white/15 transition-colors"
              >
                <span className="font-semibold text-lg text-white">What data do you collect from users?</span>
                <svg
                  className={`w-5 h-5 text-white transition-transform ${openFaq === 4 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 4 && (
                <div className="px-6 pb-5 text-white/90 leading-relaxed">
                  Privacy is a top priority. We collect minimal data: only anonymous behavioral patterns (mouse movements, typing speed) for bot detection. No personal information, payment details, or tracking data is collected. All analysis happens in real-time and is not stored permanently.
                </div>
              )}
            </div>

            {/* FAQ 5 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === 5 ? null : 5)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-white/15 transition-colors"
              >
                <span className="font-semibold text-lg text-white">Can Quikyu be used beyond train ticketing?</span>
                <svg
                  className={`w-5 h-5 text-white transition-transform ${openFaq === 5 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 5 && (
                <div className="px-6 pb-5 text-white/90 leading-relaxed">
                  Absolutely! While optimized for train ticketing, Quikyu works perfectly for any high-demand scenario: concert tickets, event registrations, flash sales, limited product drops, and more. Our demand forecasting also provides valuable operational insights for inventory and resource planning.
                </div>
              )}
            </div>

            {/* FAQ 6 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === 6 ? null : 6)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-white/15 transition-colors"
              >
                <span className="font-semibold text-lg text-white">What happens if the AI prediction is wrong?</span>
                <svg
                  className={`w-5 h-5 text-white transition-transform ${openFaq === 6 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 6 && (
                <div className="px-6 pb-5 text-white/90 leading-relaxed">
                  We've got you covered! In addition to AI predictions, you can set hard-rule thresholds (e.g., max concurrent users) to manually trigger the waiting room. This hybrid approach ensures protection even if predictions are off. Plus, our AI continuously learns from real-time data to improve accuracy over time.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
            Ready to Transform Your Ticketing Experience?
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Join the revolution. Say goodbye to crashes, bots, and frustration. Say hello to fair, fast, and reliable ticket booking for everyone.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              href="/register"
              className="bg-brand text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-brand-hover transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Free Demo
            </Link>
            <Link
              href="/login"
              className="border-2 border-brand text-brand px-10 py-4 rounded-lg text-lg font-semibold hover:bg-brand hover:text-white transition-all"
            >
              Sign In
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16 text-center">
            <div>
              <div className="text-4xl font-bold mb-2 text-brand">24/7</div>
              <div className="text-gray-600">Expert Support</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-brand">48hrs</div>
              <div className="text-gray-600">Quick Integration</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-brand">100%</div>
              <div className="text-gray-600">Money-Back Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4 text-brand">Quikyu</h3>
              <p className="text-gray-400 mb-4 max-w-md">
                Revolutionizing train ticket booking with AI-powered smart waiting rooms and intelligent bot detection.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4 text-lg">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-brand transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-gray-400 hover:text-brand transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/trains" className="text-gray-400 hover:text-brand transition-colors">
                    Trains
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/my-bookings" className="text-gray-400 hover:text-brand transition-colors">
                    My Bookings
                  </Link>
                </li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="font-semibold mb-4 text-lg">Account</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-gray-400 hover:text-brand transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-gray-400 hover:text-brand transition-colors">
                    Register
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              &copy; {new Date().getFullYear()} Quikyu. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
