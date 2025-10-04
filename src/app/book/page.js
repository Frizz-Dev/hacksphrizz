'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCrowdHandler } from '@/context/CrowdHandlerContext';
import { useBehaviorTracking, useCaptchaManager } from '@/hooks/useBehaviorTracking';
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
import CaptchaPlaceholder, { TrustScoreDisplay } from '@/components/CaptchaPlaceholder';

const TOTAL_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

function BookingPageContent() {
  const router = useRouter();
  const { recordPerformance } = useCrowdHandler();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTriggeredCheckoutAnalysis, setHasTriggeredCheckoutAnalysis] = useState(false);
  const [train, setTrain] = useState(null);
  const [trainLoading, setTrainLoading] = useState(true);
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

  // Behavior tracking integration
  const behaviorTracking = useBehaviorTracking(user?.id, {
    autoStart: true,
    sendInterval: 0, // Disable automatic sending - we'll trigger manually
    trackingEnabled: !!user?.id,
  });

  // Captcha manager
  const captchaManager = useCaptchaManager(user?.id);

  // Handle captcha success
  const handleCaptchaSuccess = async () => {
    try {
      // Update trust score after successful captcha
      await behaviorTracking.analyzeNow();
      captchaManager.hideCaptcha();
      setIsSubmitting(false); // Allow submission to continue

      console.log('Captcha verification successful, trust score updated');
    } catch (error) {
      console.error('Failed to update trust score after captcha:', error);
      captchaManager.onCaptchaError(error);
      setIsSubmitting(false);
    }
  };

  // Monitor form submission for final trust check
  const handleFormSubmission = async (stepData) => {
    // Analyze behavior before allowing submission
    const result = await behaviorTracking.analyzeNow();

    if (result && result.needsCaptcha) {
      // Show captcha before allowing form submission
      captchaManager.showCaptcha('Final security verification required before completing booking.');
      return false; // Prevent form submission
    }

    return true; // Allow form submission
  };

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

  // Make test functions globally available for checkout component
  useEffect(() => {
    window.testAnalyzeBehavior = handleTestAnalyzeBehavior;
    window.testSimulateBot = handleTestSimulateBot;
    window.testReset = handleTestReset;

    // Cleanup on unmount
    return () => {
      delete window.testAnalyzeBehavior;
      delete window.testSimulateBot;
      delete window.testReset;
    };
  }, []);

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

  const handleNext = async (data) => {
    // Update booking data first
    setBookingData({ ...bookingData, ...data });

    // Check if moving from step 4 (Meal & Cab) to step 5 (Checkout)
    if (currentStep === 4) {
      console.log('🔥🔥🔥 [CHECKOUT] Moving to checkout (step 4→5) - TRIGGERING NEW ANALYSIS 🔥🔥🔥');
      console.log('🔥 [CHECKOUT] Current behavior tracking state BEFORE analysis:', {
        currentTrustScore: behaviorTracking.currentTrustScore,
        trustLevel: behaviorTracking.trustLevel,
        lastUpdate: behaviorTracking.lastUpdate,
        eventCounts: {
          mouseMovements: behaviorTracking.data?.trackingData?.mouseMovements?.length || 0,
          keystrokes: behaviorTracking.data?.trackingData?.keystrokes?.length || 0,
          formInteractions: Object.keys(behaviorTracking.data?.trackingData?.formInteractions || {}).length,
        }
      });

      setIsAnalyzing(true);
      setAnalysisComplete(false);
      setHasTriggeredCheckoutAnalysis(true); // Mark that checkout analysis was triggered

      try {
        console.log('🔥 [CHECKOUT] Calling behaviorTracking.analyzeNow()...');
        // Trigger AI analysis in background
        const analysisResult = await behaviorTracking.analyzeNow();
        console.log('🔥🔥🔥 [CHECKOUT] AI analysis completed! Result:', analysisResult);
        console.log('🔥 [CHECKOUT] Trust score from analysis:', analysisResult?.trustScore);
        console.log('🔥 [CHECKOUT] Current state AFTER analysis:', {
          currentTrustScore: behaviorTracking.currentTrustScore,
          trustLevel: behaviorTracking.trustLevel,
        });
        setAnalysisComplete(true);
      } catch (error) {
        console.error('🔥 [CHECKOUT] AI analysis FAILED:', error);
        setAnalysisComplete(true); // Continue anyway
      } finally {
        setIsAnalyzing(false);
      }
    }

    // Move to next step
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

  const handleComplete = async (paymentData) => {
    setIsSubmitting(true);

    try {
      let finalTrustScore = behaviorTracking.currentTrustScore;

      // If analysis is still in progress or hasn't completed, wait up to 5 seconds
      if (isAnalyzing || !analysisComplete) {
        console.log('Waiting for AI analysis to complete...');

        const analysisPromise = analysisComplete
          ? Promise.resolve(behaviorTracking.currentTrustScore)
          : behaviorTracking.analyzeNow();

        const timeoutPromise = new Promise(resolve =>
          setTimeout(() => resolve(null), 5000)
        );

        const result = await Promise.race([analysisPromise, timeoutPromise]);

        if (result) {
          finalTrustScore = result.trustScore || behaviorTracking.currentTrustScore;
          console.log('AI analysis completed with score:', finalTrustScore);
        } else {
          console.log('AI analysis timeout - using previous/fallback trust score');
          // Get previous trust score from database
          const previousScore = await behaviorTracking.fetchCurrentTrustScore();
          finalTrustScore = previousScore || 1.0; // Default to high trust if no previous score
        }
      }

      // Check if captcha is needed based on final trust score
      if (finalTrustScore !== null && finalTrustScore <= 0.5) {
        console.log('Trust score too low, showing captcha before submission');
        captchaManager.showCaptcha(
          `Security verification required before completing your booking. Trust score: ${Math.round(finalTrustScore * 100)}%`
        );
        return; // Don't submit yet, wait for captcha completion
      }

      // Proceed with booking completion
      await completeBooking(paymentData, finalTrustScore);

    } catch (error) {
      console.error('Error in booking completion process:', error);
      setIsSubmitting(false);
      alert('An error occurred. Please try again.');
    }
  };

  // Test functions for AI behavior analysis
  const handleTestAnalyzeBehavior = async () => {
    try {
      console.log('🤖 Testing AI behavior analysis...');
      setIsAnalyzing(true);
      
      const result = await behaviorTracking.analyzeNow();
      console.log('Analysis result:', result);

      if (!result) {
        alert('AI Analysis Failed: No result returned. This could mean:\n- No behavior data collected yet\n- API endpoint error\n- Database connection issue\n\nTry interacting with the page first (move mouse, type, etc.)');
        return;
      }

      // Handle beacon response (doesn't have trustScore immediately)
      if (result.method === 'beacon') {
        if (result.success) {
          // For development: Immediately fetch and display the trust score
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Fetching trust score for development display...');

            // Wait a bit for server to process, then fetch and show
            setTimeout(async () => {
              try {
                const response = await fetch(`/api/behavior/track?userId=${encodeURIComponent(user.id)}`);
                const scoreResult = await response.json();

                if (scoreResult.success && scoreResult.trustScore !== null) {
                  const score = (scoreResult.trustScore * 100).toFixed(1);
                  const level = scoreResult.trustLevel || 'Unknown';
                  const needsCaptcha = scoreResult.needsCaptcha ? 'Yes ⚠️' : 'No ✅';

                  // Trigger UI update to show the score in panels
                  setAnalysisComplete(true);

                  alert(`📡 Data sent successfully via beacon!\n\n✅ Trust Score Retrieved:\n\nScore: ${score}%\nLevel: ${level}\nNeeds Captcha: ${needsCaptcha}\n\n(Development mode - auto-fetched for you)\n\nCheck the panels below to see it displayed!`);
                } else {
                  alert('📡 Data sent successfully via beacon!\n\nNote: Trust score will be calculated on the server.\nCheck the panels below for the score.');
                }
              } catch (error) {
                console.error('Failed to fetch score for alert:', error);
                alert('📡 Data sent successfully via beacon!\n\nNote: Trust score will be calculated on the server.\nRefresh or wait a moment to see the updated score.');
              }
            }, 1000); // Wait 1 second for server processing

            return; // Don't show alert yet, will show after fetch
          } else {
            // Production: Simple message
            alert('📡 Data sent successfully via beacon!\n\nNote: Trust score will be calculated on the server.\nRefresh or wait a moment to see the updated score.');
          }
        } else {
          alert(`📡 Beacon send failed: ${result.message || 'Unknown error'}`);
        }
        return;
      }

      // Handle insufficient data error
      if (result.error && result.error.includes('Insufficient')) {
        alert(`⚠️ ${result.error}\n\n${result.message || ''}\n\nPlease interact with the page more (move mouse, type in forms, click buttons) before analyzing.`);
        return;
      }

      if (result.error) {
        alert(`AI Analysis Error: ${result.error}\n\nDetails: ${result.details || result.message || 'Unknown error'}`);
        return;
      }

      // Check if result has the expected structure
      if (typeof result.trustScore === 'undefined') {
        alert(`AI Analysis Invalid: Result missing trustScore\n\nReceived: ${JSON.stringify(result, null, 2)}`);
        return;
      }

      alert(`🤖 AI Analysis Complete!

AI Method: ${result.aiMethod === 'huggingface' ? '🤗 Hugging Face AI' : result.aiMethod === 'rule_based_fallback' ? '⚙️ Rule-based Fallback' : '❓ Unknown'}
${result.metadata?.usedFallback ? '⚠️ Fallback was used (Hugging Face failed)' : ''}

Trust Score: ${(result.trustScore * 100).toFixed(1)}%
Trust Level: ${result.trustLevel || 'Unknown'}
Confidence: ${result.confidence ? (result.confidence * 100).toFixed(1) + '%' : 'Unknown'}
Needs Captcha: ${result.needsCaptcha ? 'Yes' : 'No'}

Data Quality: ${result.metadata?.dataQuality ? (result.metadata.dataQuality * 100).toFixed(1) + '%' : 'Unknown'}
Session Duration: ${result.metadata?.sessionDuration ? Math.round(result.metadata.sessionDuration / 1000) + 's' : 'Unknown'}
Total Interactions: ${result.metadata?.totalInteractions || 'Unknown'}

${result.analysis ? 'Component Scores:\n' + Object.entries(result.analysis).map(([key, value]) => `${key}: ${typeof value === 'number' ? (value * 100).toFixed(1) + '%' : JSON.stringify(value)}`).join('\n') : ''}

${result.reasons && result.reasons.length > 0 ? '\nReasons:\n• ' + result.reasons.slice(0, 3).join('\n• ') : ''}`);
      
    } catch (error) {
      console.error('Test analysis failed:', error);
      alert(`AI Analysis Test Failed: ${error.message}

This could be due to:
1. No behavior data collected yet
2. API endpoint not responding
3. Database not configured
4. Invalid data format

Try:
• Move your mouse around the page
• Type in some form fields
• Click different elements
• Then try the analysis again`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTestSimulateBot = async () => {
    try {
      console.log('🎭 Simulating bot behavior...');
      
      // Create fake bot-like behavior data
      const fakeBotData = {
        mouseMovements: Array.from({length: 20}, (_, i) => ({
          x: i * 10, // Perfectly linear movement
          y: i * 5,  
          timestamp: Date.now() + i * 100 // Identical timing intervals
        })),
        keystrokes: Array.from({length: 10}, (_, i) => ({
          key: 'char',
          timestamp: Date.now() + i * 100, // Identical timings = suspicious
          target: 'INPUT'
        })),
        formInteractions: [],
        sessionDuration: 2000, // Too fast = bot-like
        userAgent: navigator.userAgent,
        sessionMetrics: {
          totalClicks: 0,
          totalKeystrokes: 10,
          totalMouseMoves: 20,
          suspiciousPatterns: ['identical_timing', 'linear_movement', 'too_fast']
        }
      };
      
      // Manually test the AI with bot data
      const { calculateTrustScore } = await import('@/utils/trustScoreAI');
      const result = calculateTrustScore(fakeBotData);
      
      console.log('Bot simulation result:', result);
      
      alert(`Bot Simulation Complete!
Trust Score: ${(result.overallScore * 100).toFixed(1)}%
Trust Level: ${result.overallScore >= 0.8 ? 'high' : result.overallScore >= 0.6 ? 'medium' : result.overallScore >= 0.4 ? 'low' : 'suspicious'}
Should Show Captcha: ${result.overallScore <= 0.5 ? 'YES' : 'NO'}
Detected Patterns: Linear movement, identical timing`);
      
    } catch (error) {
      console.error('Bot simulation failed:', error);
      alert('Bot simulation test failed: ' + error.message);
    }
  };

  const handleTestReset = () => {
    console.log('🔄 Resetting behavior tracking...');
    
    // Reset all tracking data
    behaviorTracking.resetData();
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    
    alert('Behavior tracking data has been reset!');
  };

  const completeBooking = async (paymentData, trustScore) => {
    try {
      const finalBookingData = { ...bookingData, payment: paymentData };
      const totalAmount = calculateTotal();
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
          trust_score: trustScore ? Math.round(trustScore * 100) : null,
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

      // Stop behavior tracking after successful booking
      behaviorTracking.stopTracking();

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
    } finally {
      setIsSubmitting(false);
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

        {/* AI Test Banner - Development Mode */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 sticky top-16 z-40">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">�</span>
                <div>
                  <div className="font-semibold">🤗 HuggingFace AI + Fallback Mode</div>
                  <div className="text-xs opacity-90">
                    Score: {(hasTriggeredCheckoutAnalysis && behaviorTracking.currentTrustScore !== null && !isNaN(behaviorTracking.currentTrustScore)) ? (behaviorTracking.currentTrustScore * 100).toFixed(1) + '%' : 'Not analyzed yet'} |
                    Events: {(behaviorTracking.data?.trackingData?.mouseMovements?.length || 0) + (behaviorTracking.data?.trackingData?.keystrokes?.length || 0)}
                    {isAnalyzing && ' | 🤗 Analyzing with AI...'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleTestAnalyzeBehavior}
                  disabled={isAnalyzing}
                  className="px-3 py-1 bg-white bg-opacity-20 rounded text-sm hover:bg-opacity-30 disabled:opacity-50 transition-colors"
                >
                  � AI Analyze
                </button>
                <button
                  onClick={handleTestSimulateBot}
                  disabled={isAnalyzing}
                  className="px-3 py-1 bg-white bg-opacity-20 rounded text-sm hover:bg-opacity-30 disabled:opacity-50 transition-colors"
                >
                  🎭 Bot
                </button>
                <button
                  onClick={handleTestReset}
                  className="px-3 py-1 bg-white bg-opacity-20 rounded text-sm hover:bg-opacity-30 transition-colors"
                >
                  🔄 Reset
                </button>
              </div>
            </div>
          </div>
        )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Timer and Price Preview */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between md:justify-start md:gap-4">
              <span className="text-gray-600">Time Remaining:</span>
              <span className={`text-2xl font-bold ${timeLeft < 60000 ? 'text-red-600' : 'text-[#F27500]'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="flex items-center justify-center">
              {/* Trust Score Display - only show if available and valid */}
              {behaviorTracking.currentTrustScore !== null &&
               !isNaN(behaviorTracking.currentTrustScore) &&
               currentStep >= 5 && (
                <TrustScoreDisplay
                  trustScore={behaviorTracking.currentTrustScore}
                  trustLevel={behaviorTracking.trustLevel || 'Unknown'}
                  confidence={behaviorTracking.confidence || 0}
                />
              )}
              {/* Quick AI Test Buttons for Development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="flex gap-1 ml-4">
                  <button
                    onClick={handleTestAnalyzeBehavior}
                    disabled={isAnalyzing}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
                    title="Test AI Analysis"
                  >
                    🤖
                    {isAnalyzing && (
                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={handleTestSimulateBot}
                    disabled={isAnalyzing}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50"
                    title="Simulate Bot"
                  >
                    🎭
                  </button>
                  <button
                    onClick={handleTestReset}
                    disabled={isAnalyzing}
                    className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 disabled:opacity-50"
                    title="Reset Data"
                  >
                    🔄
                  </button>
                </div>
              )}
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
          {/* AI Test Panel - Available on all steps for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-yellow-800">
                  <span className="font-medium">🧪 AI Status:</span>
                  Trust Score: {(hasTriggeredCheckoutAnalysis && behaviorTracking.currentTrustScore !== null && !isNaN(behaviorTracking.currentTrustScore)) ? (behaviorTracking.currentTrustScore * 100).toFixed(1) + '%' : 'Not analyzed yet'} |
                  Level: {hasTriggeredCheckoutAnalysis ? (behaviorTracking.trustLevel || 'Unknown') : 'Pending'} |
                  Status: {isAnalyzing ? 'Analyzing...' : (hasTriggeredCheckoutAnalysis ? 'Complete' : 'Awaiting checkout')}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleTestAnalyzeBehavior}
                    disabled={isAnalyzing}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
                  >
                    🤖 Test AI
                  </button>
                  <button
                    onClick={handleTestSimulateBot}
                    className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                  >
                    🎭 Bot
                  </button>
                  <button
                    onClick={handleTestReset}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <PassengerDetails
              initialData={bookingData.passengers}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <SeatSelector
              passengers={bookingData.passengers}
              initialData={bookingData.selectedSeats}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <ExtraProtection
              initialData={bookingData.protections}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 4 && (
            <MealAndCab
              initialData={bookingData.extras}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 5 && (
            <>
              <Checkout
                bookingData={bookingData}
                onComplete={handleComplete}
                onBack={handleBack}
                isSubmitting={isSubmitting}
                isAnalyzing={isAnalyzing}
                analysisComplete={analysisComplete}
                // Test functions untuk development
                onTestAnalyze={handleTestAnalyzeBehavior}
                onTestSimulateBot={handleTestSimulateBot}
                onTestReset={handleTestReset}
                currentTrustScore={behaviorTracking.currentTrustScore}
                trustLevel={behaviorTracking.trustLevel}
              />
              
              {/* Tombol Test AI - Untuk Development */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-3">🧪 AI Testing Tools (Development Only)</h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleTestAnalyzeBehavior}
                      disabled={isAnalyzing}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      🤖 Analyze My Behavior
                      {isAnalyzing && (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                    </button>
                    
                    <button
                      onClick={handleTestSimulateBot}
                      disabled={isAnalyzing}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🎭 Simulate Bot Behavior
                    </button>
                    
                    <button
                      onClick={handleTestReset}
                      disabled={isAnalyzing}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🔄 Reset
                    </button>
                  </div>
                  
                  {/* Status Display */}
                  <div className="mt-3 text-xs text-blue-700">
                    <div className="flex items-center gap-4">
                      <span>Current Trust Score: {(hasTriggeredCheckoutAnalysis && behaviorTracking.currentTrustScore !== null && !isNaN(behaviorTracking.currentTrustScore)) ? (behaviorTracking.currentTrustScore * 100).toFixed(1) + '%' : 'Awaiting checkout'}</span>
                      <span>Trust Level: {hasTriggeredCheckoutAnalysis ? (behaviorTracking.trustLevel || 'Unknown') : 'Pending'}</span>
                      <span>Status: {isAnalyzing ? 'Analyzing...' : (hasTriggeredCheckoutAnalysis ? 'Complete' : 'Not started')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Captcha Modal */}
      <CaptchaPlaceholder
        isVisible={captchaManager.isVisible}
        trustScore={behaviorTracking.currentTrustScore}
        reason={captchaManager.reason || "Security verification required"}
        onSuccess={handleCaptchaSuccess}
        onError={captchaManager.onCaptchaError}
        onClose={captchaManager.hideCaptcha}
      />

      {/* Floating AI Test Panel - Development Only */}
      <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
        <h4 className="text-sm font-semibold mb-3 text-gray-800">🧪 AI Test Panel</h4>
        
        {/* AI Method Indicator */}
        <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
          <div className="flex justify-between">
            <span>AI Method:</span>
            <span className="font-mono text-blue-700">
              {isAnalyzing ? 'Analyzing...' : '🤗 HuggingFace + Fallback'}
            </span>
          </div>
        </div>
        
        {/* Trust Score Display */}
        <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
          <div className="flex justify-between">
            <span>Trust Score:</span>
            <span className="font-mono">
              {behaviorTracking.currentTrustScore !== null
                ? (behaviorTracking.currentTrustScore * 100).toFixed(1) + '%'
                : 'Analyzing...'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={`font-semibold ${
              behaviorTracking.currentTrustScore === null ? 'text-gray-600' :
              behaviorTracking.currentTrustScore >= 0.8 ? 'text-green-600' :
              behaviorTracking.currentTrustScore >= 0.6 ? 'text-yellow-600' :
              behaviorTracking.currentTrustScore >= 0.4 ? 'text-orange-600' : 'text-red-600'
            }`}>
              {behaviorTracking.currentTrustScore === null ? 'PENDING' :
               behaviorTracking.currentTrustScore >= 0.8 ? 'HIGH' :
               behaviorTracking.currentTrustScore >= 0.6 ? 'MEDIUM' :
               behaviorTracking.currentTrustScore >= 0.4 ? 'LOW' : 'SUSPICIOUS'}
            </span>
          </div>
        </div>

        {/* Analysis Status */}
        {isAnalyzing && (
          <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
              <span className="text-blue-700">Analyzing...</span>
            </div>
          </div>
        )}

        {/* Test Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleTestAnalyzeBehavior}
            disabled={isAnalyzing}
            className="w-full px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1"
          >
            🤖 Analyze My Behavior
          </button>
          
          <button
            onClick={handleTestSimulateBot}
            disabled={isAnalyzing}
            className="w-full px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1"
          >
            🎭 Simulate Bot Behavior
          </button>
          
          <button
            onClick={handleTestReset}
            className="w-full px-3 py-2 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 flex items-center justify-center gap-1"
          >
            🔄 Reset
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-3 pt-2 border-t text-xs text-gray-500">
          <div>Mouse: {behaviorTracking.data?.trackingData?.mouseMovements?.length || 0} events</div>
          <div>Keys: {behaviorTracking.data?.trackingData?.keystrokes?.length || 0} events</div>
          <div>Forms: {Object.keys(behaviorTracking.data?.trackingData?.formInteractions || {}).length} events</div>
        </div>
      </div>

      {/* Captcha Modal - Using CaptchaPlaceholder */}
      <CaptchaPlaceholder
        isVisible={captchaManager.isVisible}
        trustScore={behaviorTracking.currentTrustScore}
        reason={captchaManager.reason || "Security verification required"}
        onSuccess={handleCaptchaSuccess}
        onError={captchaManager.onCaptchaError}
        onClose={captchaManager.hideCaptcha}
      />

      {/* Old Captcha Modal - Keep for reference but not used */}
      {false && showCaptcha && (
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
      </div>
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