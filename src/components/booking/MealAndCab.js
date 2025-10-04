'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function MealAndCab({ initialData, onNext, onBack, tracker }) {
  const { user } = useAuth();
  const [extras, setExtras] = useState(initialData || {
    trainMeal: false,
    stationCab: false,
  });

  const handleToggle = (field) => {
    setExtras({ ...extras, [field]: !extras[field] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Send behavioral data to database for training
    if (tracker && user) {
      const behaviorData = tracker.exportForML();

      try {
        const response = await fetch('/api/save-training-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            ...behaviorData
          }),
        });
        const result = await response.json();
        console.log('Training data saved:', behaviorData);
        console.log('API response:', result);
      } catch (error) {
        console.error('Error saving training data:', error);
      }
    }

    onNext({ extras });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Additional Services</h2>
      <p className="text-gray-600 mb-6">
        Enhance your journey with meals and transportation
      </p>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mb-8">
          <div className="border border-gray-200 rounded-lg p-6 hover:border-[#F27500] transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🍱</span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order Train Meal
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Pre-order delicious meals to be delivered to your seat during the journey. Choose from Indonesian, Western, or vegetarian options.
                </p>
                <ul className="text-sm text-gray-600 mb-3 ml-6 list-disc">
                  <li>Nasi Goreng Special</li>
                  <li>Chicken Sandwich</li>
                  <li>Vegetarian Rice Bowl</li>
                </ul>
                <p className="text-[#F27500] font-semibold">+ Rp 45,000 per meal</p>
              </div>
              <div className="ml-4">
                <button
                  type="button"
                  onClick={() => handleToggle('trainMeal')}
                  className={`
                    relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                    ${extras.trainMeal ? 'bg-[#F27500]' : 'bg-gray-300'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                      ${extras.trainMeal ? 'translate-x-7' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 hover:border-[#F27500] transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🚖</span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order Station Cab
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Book a cab to pick you up from the destination station. Your driver will be waiting when you arrive.
                </p>
                <ul className="text-sm text-gray-600 mb-3 ml-6 list-disc">
                  <li>Guaranteed pickup within 5 minutes</li>
                  <li>Air-conditioned comfortable vehicles</li>
                  <li>Professional drivers</li>
                </ul>
                <p className="text-[#F27500] font-semibold">+ Rp 35,000 base fare</p>
              </div>
              <div className="ml-4">
                <button
                  type="button"
                  onClick={() => handleToggle('stationCab')}
                  className={`
                    relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                    ${extras.stationCab ? 'bg-[#F27500]' : 'bg-gray-300'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                      ${extras.stationCab ? 'translate-x-7' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {(extras.trainMeal || extras.stationCab) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Services Selected:</strong>
              {extras.trainMeal && ' Train Meal'}
              {extras.trainMeal && extras.stationCab && ' + '}
              {extras.stationCab && ' Station Cab'}
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
            className="px-8 py-3 bg-[#F27500] text-white rounded-lg hover:bg-[#d96600] transition-colors font-medium"
          >
            Continue to Checkout
          </button>
        </div>
      </form>
    </div>
  );
}
