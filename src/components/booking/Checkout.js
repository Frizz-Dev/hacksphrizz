'use client';

import { useState, useEffect } from 'react';

export default function Checkout({ bookingData, train, onComplete, onBack }) {
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [aiSecurityStatus, setAiSecurityStatus] = useState('analyzing'); // 'analyzing', 'passed', 'flagged'
  const [securityScore, setSecurityScore] = useState(null);
  const [behaviorData, setBehaviorData] = useState({
    startTime: Date.now(),
    clicks: 0,
    keystrokes: 0,
    mouseMovements: 0,
    scrollEvents: 0,
    formInteractions: 0
  });
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    bankName: '',
    virtualAccount: '',
    ewalletPhone: '',
  });

  // Track user behavior for AI analysis
  useEffect(() => {
    const trackBehavior = () => {
      // Track clicks
      const handleClick = () => {
        setBehaviorData(prev => ({ ...prev, clicks: prev.clicks + 1 }));
      };

      // Track keystrokes
      const handleKeydown = () => {
        setBehaviorData(prev => ({ ...prev, keystrokes: prev.keystrokes + 1 }));
      };

      // Track mouse movements
      const handleMouseMove = () => {
        setBehaviorData(prev => ({ ...prev, mouseMovements: prev.mouseMovements + 1 }));
      };

      // Track scroll events
      const handleScroll = () => {
        setBehaviorData(prev => ({ ...prev, scrollEvents: prev.scrollEvents + 1 }));
      };

      // Add event listeners
      document.addEventListener('click', handleClick);
      document.addEventListener('keydown', handleKeydown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('scroll', handleScroll);

      // Cleanup
      return () => {
        document.removeEventListener('click', handleClick);
        document.removeEventListener('keydown', handleKeydown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('scroll', handleScroll);
      };
    };

    const cleanup = trackBehavior();
    
    // Run AI analysis every 10 seconds
    const aiAnalysisInterval = setInterval(runAIAnalysis, 10000);

    return () => {
      cleanup();
      clearInterval(aiAnalysisInterval);
    };
  }, []);

  const runAIAnalysis = async () => {
    try {
      const sessionDuration = Date.now() - behaviorData.startTime;
      
      // Prepare behavior data for AI analysis
      const aiPayload = {
        user_id: `checkout_${Date.now()}`,
        behaviorData: {
          session_duration: sessionDuration,
          clicks: behaviorData.clicks,
          keystrokes: behaviorData.keystrokes,
          mouse_movements: behaviorData.mouseMovements,
          scroll_events: behaviorData.scrollEvents,
          form_interactions: behaviorData.formInteractions,
          time_on_page: sessionDuration,
          tab_switches: Math.floor(Math.random() * 3), // Simulated
          copy_paste_events: Math.floor(Math.random() * 2), // Simulated
          right_click_events: 0, // Simulated
          form_completion_time: sessionDuration,
          typing_patterns: {
            avg_interval: behaviorData.keystrokes > 0 ? sessionDuration / behaviorData.keystrokes : 200,
            variance: 50
          },
          click_patterns: {
            frequency: behaviorData.clicks > 0 ? sessionDuration / behaviorData.clicks : 1000,
            accuracy: 0.95
          },
          mouse_velocity: behaviorData.mouseMovements > 0 ? sessionDuration / behaviorData.mouseMovements : 100,
          scroll_behavior: {
            frequency: behaviorData.scrollEvents,
            smoothness: 0.8
          }
        }
      };

      const response = await fetch('http://localhost:5001/predict-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiPayload)
      });

      if (response.ok) {
        const result = await response.json();
        setSecurityScore(result.confidence || result.trust_score || 0);
        
        // Determine security status based on AI prediction
        if (result.prediction === 'human' || (result.confidence && result.confidence > 0.7)) {
          setAiSecurityStatus('passed');
        } else if (result.prediction === 'bot' || (result.confidence && result.confidence < 0.3)) {
          setAiSecurityStatus('flagged');
        } else {
          setAiSecurityStatus('analyzing');
        }
        
        console.log('🤖 AI Security Analysis:', result);
      }
    } catch (error) {
      console.error('❌ AI Analysis Error:', error);
      setAiSecurityStatus('analyzing'); // Keep analyzing on error
    }
  };

  // Calculate total price
  const calculateTotal = () => {
    if (!train) return 0;
    let total = train.base_price;
    total *= bookingData.passengers.length;

    if (bookingData.protections.personalAccident) {
      total += 15000 * bookingData.passengers.length;
    }
    if (bookingData.protections.travelProtection) {
      total += 25000 * bookingData.passengers.length;
    }
    if (bookingData.extras.trainMeal) {
      total += 45000 * bookingData.passengers.length;
    }
    if (bookingData.extras.stationCab) {
      total += 35000;
    }

    return total;
  };

  const handleInputChange = (field, value) => {
    setPaymentInfo({ ...paymentInfo, [field]: value });
    // Track form interactions for AI analysis
    setBehaviorData(prev => ({ ...prev, formInteractions: prev.formInteractions + 1 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check AI security status before allowing submission
    if (aiSecurityStatus === 'flagged') {
      alert('⚠️ Security check failed. Please contact customer support.');
      return;
    }

    // Basic validation based on payment method
    if (paymentMethod === 'credit-card') {
      if (!paymentInfo.cardNumber || !paymentInfo.cardName || !paymentInfo.expiryDate || !paymentInfo.cvv) {
        alert('Please fill in all card details');
        return;
      }
    } else if (paymentMethod === 'bank-transfer') {
      if (!paymentInfo.bankName) {
        alert('Please select a bank');
        return;
      }
    } else if (paymentMethod === 'ewallet') {
      if (!paymentInfo.ewalletPhone) {
        alert('Please enter your phone number');
        return;
      }
    }

    // Run final AI analysis before completing
    await runAIAnalysis();

    onComplete({ 
      paymentMethod, 
      paymentInfo, 
      securityCheck: {
        method: 'AI',
        status: aiSecurityStatus,
        score: securityScore,
        behaviorData: behaviorData
      }
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h2>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Booking Summary */}
        <div className="lg:col-span-2">
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Passengers:</span>
                <span className="font-medium">{bookingData.passengers.length} person(s)</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Seats:</span>
                <span className="font-medium">{bookingData.selectedSeats.join(', ')}</span>
              </div>

              {bookingData.protections.personalAccident && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Personal Accident Protection:</span>
                  <span className="font-medium">Rp {(15000 * bookingData.passengers.length).toLocaleString()}</span>
                </div>
              )}

              {bookingData.protections.travelProtection && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Travel Protection:</span>
                  <span className="font-medium">Rp {(25000 * bookingData.passengers.length).toLocaleString()}</span>
                </div>
              )}

              {bookingData.extras.trainMeal && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Train Meal:</span>
                  <span className="font-medium">Rp {(45000 * bookingData.passengers.length).toLocaleString()}</span>
                </div>
              )}

              {bookingData.extras.stationCab && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Station Cab:</span>
                  <span className="font-medium">Rp 35,000</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Security Status */}
          <div className={`rounded-lg p-6 mb-6 border-2 transition-all duration-300 ${
            aiSecurityStatus === 'passed' ? 'bg-green-50 border-green-200' :
            aiSecurityStatus === 'flagged' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${
                aiSecurityStatus === 'passed' ? 'text-green-900' :
                aiSecurityStatus === 'flagged' ? 'text-red-900' :
                'text-blue-900'
              }`}>
                🤖 AI Security Analysis
              </h3>
              
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                aiSecurityStatus === 'passed' ? 'bg-green-200 text-green-800' :
                aiSecurityStatus === 'flagged' ? 'bg-red-200 text-red-800' :
                'bg-blue-200 text-blue-800'
              }`}>
                {aiSecurityStatus === 'passed' ? '✅ VERIFIED' :
                 aiSecurityStatus === 'flagged' ? '⚠️ FLAGGED' :
                 '🔍 ANALYZING'}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${
                  aiSecurityStatus === 'passed' ? 'text-green-700' :
                  aiSecurityStatus === 'flagged' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                  Behavior Analysis:
                </span>
                <span className="text-sm font-medium">
                  {aiSecurityStatus === 'passed' ? 'Human-like patterns detected' :
                   aiSecurityStatus === 'flagged' ? 'Bot-like patterns detected' :
                   'Real-time analysis in progress...'}
                </span>
              </div>

              {securityScore !== null && (
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${
                    aiSecurityStatus === 'passed' ? 'text-green-700' :
                    aiSecurityStatus === 'flagged' ? 'text-red-700' :
                    'text-blue-700'
                  }`}>
                    Confidence Score:
                  </span>
                  <span className="text-sm font-medium">
                    {(securityScore * 100).toFixed(1)}%
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className={`text-sm ${
                  aiSecurityStatus === 'passed' ? 'text-green-700' :
                  aiSecurityStatus === 'flagged' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                  Tracked Interactions:
                </span>
                <span className="text-sm font-medium">
                  {behaviorData.clicks + behaviorData.keystrokes + behaviorData.mouseMovements} events
                </span>
              </div>
            </div>

            <div className={`mt-4 p-3 rounded-lg ${
              aiSecurityStatus === 'passed' ? 'bg-green-100' :
              aiSecurityStatus === 'flagged' ? 'bg-red-100' :
              'bg-blue-100'
            }`}>
              <p className={`text-xs ${
                aiSecurityStatus === 'passed' ? 'text-green-800' :
                aiSecurityStatus === 'flagged' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {aiSecurityStatus === 'passed' ? 
                  '🛡️ Your behavior has been verified as human. Checkout is secure.' :
                 aiSecurityStatus === 'flagged' ?
                  '⚠️ Suspicious activity detected. Please contact customer support if you believe this is an error.' :
                  '🔍 AI is continuously analyzing your behavior patterns to ensure secure checkout.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <h3 className="text-lg font-semibold mb-4">Payment Method</h3>

            <div className="space-y-3 mb-6">
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-[#F27500] transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="credit-card"
                  checked={paymentMethod === 'credit-card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-[#F27500]"
                />
                <span className="ml-3 font-medium">Credit/Debit Card</span>
              </label>

              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-[#F27500] transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="bank-transfer"
                  checked={paymentMethod === 'bank-transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-[#F27500]"
                />
                <span className="ml-3 font-medium">Bank Transfer</span>
              </label>

              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-[#F27500] transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="ewallet"
                  checked={paymentMethod === 'ewallet'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-[#F27500]"
                />
                <span className="ml-3 font-medium">E-Wallet (GoPay, OVO, DANA)</span>
              </label>
            </div>

            {/* Payment Details */}
            {paymentMethod === 'credit-card' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number *
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27500] focus:border-transparent"
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Holder Name *
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.cardName}
                    onChange={(e) => handleInputChange('cardName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27500] focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date *
                    </label>
                    <input
                      type="text"
                      value={paymentInfo.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27500] focus:border-transparent"
                      placeholder="MM/YY"
                      maxLength="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV *
                    </label>
                    <input
                      type="text"
                      value={paymentInfo.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27500] focus:border-transparent"
                      placeholder="123"
                      maxLength="3"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'bank-transfer' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Bank *
                </label>
                <select
                  value={paymentInfo.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27500] focus:border-transparent"
                >
                  <option value="">Choose a bank</option>
                  <option value="BCA">BCA</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="BNI">BNI</option>
                  <option value="BRI">BRI</option>
                  <option value="CIMB">CIMB Niaga</option>
                </select>
                {paymentInfo.bankName && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Virtual Account Number will be generated after you complete the booking.
                    </p>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'ewallet' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={paymentInfo.ewalletPhone}
                  onChange={(e) => handleInputChange('ewalletPhone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27500] focus:border-transparent"
                  placeholder="08xxxxxxxxxx"
                />
                <p className="text-sm text-gray-500 mt-2">
                  You will receive a payment notification on your registered e-wallet app.
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={onBack}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Complete Booking
              </button>
            </div>
          </form>
        </div>

        {/* Price Summary */}
        <div>
          <div className="bg-[#F27500] text-white rounded-lg p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Total Amount</h3>
            <div className="space-y-2 mb-4 pb-4 border-b border-orange-400">
              <div className="flex justify-between text-sm">
                <span>Base Fare ({bookingData.passengers.length}x)</span>
                <span>Rp {(train?.base_price * bookingData.passengers.length).toLocaleString()}</span>
              </div>
              {bookingData.protections.personalAccident && (
                <div className="flex justify-between text-sm">
                  <span>Accident Protection</span>
                  <span>Rp {(15000 * bookingData.passengers.length).toLocaleString()}</span>
                </div>
              )}
              {bookingData.protections.travelProtection && (
                <div className="flex justify-between text-sm">
                  <span>Travel Protection</span>
                  <span>Rp {(25000 * bookingData.passengers.length).toLocaleString()}</span>
                </div>
              )}
              {bookingData.extras.trainMeal && (
                <div className="flex justify-between text-sm">
                  <span>Meal</span>
                  <span>Rp {(45000 * bookingData.passengers.length).toLocaleString()}</span>
                </div>
              )}
              {bookingData.extras.stationCab && (
                <div className="flex justify-between text-sm">
                  <span>Cab</span>
                  <span>Rp 35,000</span>
                </div>
              )}
            </div>
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span>Rp {calculateTotal().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}