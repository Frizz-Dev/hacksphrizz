'use client';

import { useState } from 'react';

export default function ExtraProtection({ initialData, onNext, onBack, tracker }) {
  const [protections, setProtections] = useState(initialData || {
    personalAccident: false,
    travelProtection: false,
  });

  const handleToggle = (field) => {
    setProtections({ ...protections, [field]: !protections[field] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext({ protections });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Extra Protection</h2>
      <p className="text-gray-600 mb-6">
        Add extra protection to your journey for peace of mind
      </p>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mb-8">
          <div className="border border-gray-200 rounded-lg p-6 hover:border-[#F27500] transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Personal Accident Protection
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Coverage of up to Rp 50,000,000 for accidental death or permanent disability during your journey.
                </p>
                <p className="text-[#F27500] font-semibold">+ Rp 15,000 per passenger</p>
              </div>
              <div className="ml-4">
                <button
                  type="button"
                  onClick={() => handleToggle('personalAccident')}
                  className={`
                    relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                    ${protections.personalAccident ? 'bg-[#F27500]' : 'bg-gray-300'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                      ${protections.personalAccident ? 'translate-x-7' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 hover:border-[#F27500] transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Travel Protection
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Get reimbursement for trip cancellation, delays, lost baggage, and medical emergencies during travel.
                </p>
                <p className="text-[#F27500] font-semibold">+ Rp 25,000 per passenger</p>
              </div>
              <div className="ml-4">
                <button
                  type="button"
                  onClick={() => handleToggle('travelProtection')}
                  className={`
                    relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                    ${protections.travelProtection ? 'bg-[#F27500]' : 'bg-gray-300'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                      ${protections.travelProtection ? 'translate-x-7' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {(protections.personalAccident || protections.travelProtection) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>Protection Selected:</strong>
              {protections.personalAccident && ' Personal Accident Protection'}
              {protections.personalAccident && protections.travelProtection && ' + '}
              {protections.travelProtection && ' Travel Protection'}
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
            Continue to Extras
          </button>
        </div>
      </form>
    </div>
  );
}
