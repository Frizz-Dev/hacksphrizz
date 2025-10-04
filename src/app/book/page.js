'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCrowdHandler } from '@/context/CrowdHandlerContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import StepTracker from '@/components/booking/StepTracker';
import PassengerDetails from '@/components/booking/PassengerDetails';
import SeatSelector from '@/components/booking/SeatSelector';
import ExtraProtection from '@/components/booking/ExtraProtection';
import MealAndCab from '@/components/booking/MealAndCab';
import Checkout from '@/components/booking/Checkout';
import ReCAPTCHA from 'react-google-recaptcha';
import BehaviorTracker from '@/utils/behaviorTracking';

const TOTAL_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

function BookingPageContent() {
  const router = useRouter();
  const { recordPerformance } = useCrowdHandler();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [train, setTrain] = useState(null);
  const [trainLoading, setTrainLoading] = useState(true);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [recaptchaRef, setRecaptchaRef] = useState(null);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [tracker] = useState(() => new BehaviorTracker());
  const [bookingData, setBookingData] = useState({
    passengers: [],
    selectedSeats: [],
    protections: {
      personalAccident: false,
      travelProtection: false,
    },
    extras: {
      trainMeal: false,
      stationCab: false,
    },
    payment: null,
  });

  const trainId = searchParams.get('train');
  const selectedDate = searchParams.get('date');

  // Track mouse movement globally
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (tracker && currentStep <= 4) {
        tracker.trackMouseMovement(e.clientX, e.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [tracker, currentStep]);

  // Track all clicks globally
  useEffect(() => {
    const handleClick = (e) => {
      if (tracker && currentStep <= 4) {
        tracker.trackClick();
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [tracker, currentStep]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch train details
  useEffect(() => {
    const fetchTrain = async () => {
      if (!trainId) {
        setTrainLoading(false);
        router.push('/trains');
        return;
      }
      try {
        const { data, error } = await supabase
          .from('trains')
          .select('*')
          .eq('id', trainId)
          .single();

        if (error || !data) {
          console.error('Error fetching train:', error);
          alert('Train not found. Redirecting to trains page.');
          router.push('/trains');
          return;
        }
        setTrain(data);
      } catch (err) {
        console.error('Error:', err);
        router.push('/trains');
      } finally {
        setTrainLoading(false);
      }
    };

    fetchTrain();
  }, [trainId, router]);

  // Timer countdown - start after user and train are ready
  useEffect(() => {
    if (authLoading || trainLoading || !user || !train) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          alert('Time expired! Redirecting to home page.');
          router.push('/');
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [authLoading, trainLoading, user, train, router]);

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateTotal = () => {
    if (!train) return 0;
    let total = train.base_price;
    total *= bookingData.passengers.length || 0;

    if (bookingData.protections.personalAccident) {
      total += 15000 * (bookingData.passengers.length || 0);
    }
    if (bookingData.protections.travelProtection) {
      total += 25000 * (bookingData.passengers.length || 0);
    }
    if (bookingData.extras.trainMeal) {
      total += 45000 * (bookingData.passengers.length || 0);
    }
    if (bookingData.extras.stationCab) {
      total += 35000;
    }

    return total;
  };

  const handleNext = (data) => {
    setBookingData({ ...bookingData, ...data });
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleStepClick = (step) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const handleRecaptchaVerify = async (token) => {
    if (!token) return;

    try {
      const verifyRes = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, user_id: user.id }),
      });
      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        setShowCaptcha(false);
        recaptchaRef?.reset();

        // Update trust score di Supabase
        await fetch('/api/update-trust', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, trust_score: 0.4 }),
        });

        // Lanjutkan booking dengan paymentData yang tersimpan
        if (pendingPaymentData) {
          await completeBooking(pendingPaymentData);
        }
      } else {
        console.error('reCAPTCHA Error:', verifyData['error-codes']);
        alert('Verifikasi captcha gagal. Silakan coba lagi.');
        recaptchaRef?.reset();
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan. Coba lagi.');
      recaptchaRef?.reset();
    }
  };

  const completeBooking = async (paymentData) => {
    const finalBookingData = { ...bookingData, payment: paymentData };
    const totalAmount = calculateTotal();

    try {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          train_id: train.id,
          total_amount: totalAmount,
          status: 'completed',
          personal_accident_protection: finalBookingData.protections.personalAccident,
          travel_protection: finalBookingData.protections.travelProtection,
          train_meal: finalBookingData.extras.trainMeal,
          station_cab: finalBookingData.extras.stationCab,
          payment_method: paymentData.paymentMethod,
          payment_details: paymentData.paymentInfo,
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Booking error details:', bookingError);
        showToast(`Failed to create booking: ${bookingError.message}`, 'error', 5000);
        return;
      }

      const passengersToInsert = finalBookingData.passengers.map((passenger, index) => ({
        booking_id: booking.id,
        ktp_number: passenger.ktpNumber,
        full_name: passenger.fullName,
        passenger_type: passenger.type,
        seat_number: finalBookingData.selectedSeats[index] || '',
      }));

      const { error: passengersError } = await supabase
        .from('booking_passengers')
        .insert(passengersToInsert);

      if (passengersError) {
        console.error('Passengers error details:', passengersError);
        showToast(`Failed to save passenger details: ${passengersError.message}`, 'error', 5000);
        return;
      }

      showToast('Booking completed successfully!', 'success');

      // Record performance for successful booking
      await recordPerformance({
        statusCode: 200,
        sample: 1.0 // Record all successful bookings
      });

      router.push(`/recommendations?train=${train.id}`);
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleComplete = async (paymentData) => {
    if (!train) {
      alert('Train information not available. Please try again.');
      return;
    }

    // Collect behavioral data
    const behaviorData = tracker.exportForML();
    console.log('Behavioral Data for Trust Score:', behaviorData);

    // Send behavioral data to ML API for trust score calculation
    try {
      const trustScoreResponse = await fetch('/api/calculate-trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          behavior_data: behaviorData
        }),
      });

      const { trust_score } = await trustScoreResponse.json();
      console.log('Trust Score from ML:', trust_score);

      // If trust score is low, show captcha
      if (trust_score < 0.5) {
        setPendingPaymentData(paymentData);
        setShowCaptcha(true);
        return;
      }

      // If trust score is high, proceed with booking
      await completeBooking(paymentData);
    } catch (error) {
      console.error('Error calculating trust score:', error);
      // Fallback: proceed with booking if ML API fails
      await completeBooking(paymentData);
    }
  };

  if (authLoading || trainLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Navbar />
        <div className="text-[#F27500] text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || !train) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Train Details Header */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {train.departure_time.substring(0, 5)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {train.departure_station_code}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-16 h-px bg-gray-300"></div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {train.arrival_time.substring(0, 5)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {train.arrival_station_code}
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {train.train_name} ({train.train_code})
                </h2>
                <p className="text-sm text-gray-600">
                  {train.departure_station} → {train.arrival_station} • {selectedDate || 'Selected Date'}
                </p>
              </div>
            </div>
          </div>

          {/* Timer and Price Preview */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between md:justify-start md:gap-4">
                <span className="text-gray-600">Time Remaining:</span>
                <span className={`text-2xl font-bold ${timeLeft < 60000 ? 'text-red-600' : 'text-[#F27500]'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="flex items-center justify-between md:justify-end md:gap-4">
                <span className="text-gray-600">Total Price:</span>
                <span className="text-2xl font-bold text-[#F27500]">
                  Rp {calculateTotal().toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Step Tracker */}
          <StepTracker currentStep={currentStep} onStepClick={handleStepClick} />

          {/* Step Content */}
          <div className="bg-white rounded-lg shadow-sm p-8 mt-6">
            {currentStep === 1 && (
              <PassengerDetails
                initialData={bookingData.passengers}
                onNext={handleNext}
                tracker={tracker}
              />
            )}
            {currentStep === 2 && (
              <SeatSelector
                passengers={bookingData.passengers}
                initialData={bookingData.selectedSeats}
                onNext={handleNext}
                onBack={handleBack}
                trainId={train.id}
                availableSeats={train.available_seats}
                tracker={tracker}
              />
            )}
            {currentStep === 3 && (
              <ExtraProtection
                initialData={bookingData.protections}
                onNext={handleNext}
                onBack={handleBack}
                tracker={tracker}
              />
            )}
            {currentStep === 4 && (
              <MealAndCab
                initialData={bookingData.extras}
                onNext={handleNext}
                onBack={handleBack}
                tracker={tracker}
              />
            )}
            {currentStep === 5 && (
              <Checkout
                bookingData={bookingData}
                train={train}
                onComplete={handleComplete}
                onBack={handleBack}
              />
            )}
          </div>
        </main>
      </div>

      {/* Captcha Modal */}
      {showCaptcha && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Human Verification</h3>
            <p className="text-gray-600 mb-6">Complete verification to proceed.</p>
            <ReCAPTCHA
              ref={(ref) => setRecaptchaRef(ref)}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
              onChange={handleRecaptchaVerify}
            />
            <button
              onClick={() => {
                setShowCaptcha(false);
                if (recaptchaRef) recaptchaRef.reset();
              }}
              className="mt-4 text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Navbar />
        <div className="text-[#F27500] text-xl">Loading...</div>
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}