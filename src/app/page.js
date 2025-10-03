'use client';

import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import QueueStatusWidget from '@/components/QueueStatusWidget';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // ✅ Auto redirect kalau sudah login
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-brand text-xl">Loading...</div>
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
            <div className="max-w-lg rounded-2xl overflow-hidden shadow-xl border border-gray-100">
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

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 h-full border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-brand text-2xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-2xl font-bold mb-4">Smart Traffic Detection</h3>
                <p className="text-white/90 leading-relaxed">
                  Our AI predicts high-traffic moments and automatically activates the virtual waiting room to keep the system stable and fast.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 h-full border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-brand text-2xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-2xl font-bold mb-4">Bot Protection Layer</h3>
                <p className="text-white/90 leading-relaxed">
                  Trust score system intelligently detects bots while keeping human users flowing smoothly—captcha only when needed.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 h-full border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-brand text-2xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-2xl font-bold mb-4">Seamless Booking</h3>
                <p className="text-white/90 leading-relaxed">
                  Complete your booking on a reliable system with zero downtime. Fast, fair, and frustration-free experience for everyone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
