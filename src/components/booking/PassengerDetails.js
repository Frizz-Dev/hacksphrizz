'use client';

import { useState } from 'react';

export default function PassengerDetails({ initialData, onNext }) {
  const [passengers, setPassengers] = useState(
    initialData.length > 0
      ? initialData
      : [{ id: Date.now(), ktpNumber: '', fullName: '', type: 'Adult' }]
  );

  const addPassenger = () => {
    setPassengers([
      ...passengers,
      { id: Date.now(), ktpNumber: '', fullName: '', type: 'Adult' },
    ]);
  };

  const removePassenger = (id) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((p) => p.id !== id));
    }
  };

  const updatePassenger = (id, field, value) => {
    // For KTP number, only allow digits and limit to 16 characters
    if (field === 'ktpNumber') {
      value = value.replace(/\D/g, '').slice(0, 16);
    }
    setPassengers(
      passengers.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all passengers have required fields
    const allValid = passengers.every(
      (p) => p.ktpNumber.trim() && p.fullName.trim()
    );

    if (!allValid) {
      alert('Please fill in all passenger details');
      return;
    }

    // Validate KTP numbers are 16 digits
    const invalidKTP = passengers.find((p) => p.ktpNumber.length !== 16);
    if (invalidKTP) {
      alert('KTP number must be exactly 16 digits');
      return;
    }

    onNext({ passengers });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Passenger Details</h2>
      <form onSubmit={handleSubmit}>
        {passengers.map((passenger, index) => (
          <div
            key={passenger.id}
            className="border border-gray-200 rounded-lg p-6 mb-4 relative"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Passenger {index + 1}
              </h3>
              {passengers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePassenger(passenger.id)}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  KTP Number *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={passenger.ktpNumber}
                  onChange={(e) =>
                    updatePassenger(passenger.id, 'ktpNumber', e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27500] focus:border-transparent"
                  placeholder="16 digit KTP number"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {passenger.ktpNumber.length}/16 digits
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={passenger.fullName}
                  onChange={(e) =>
                    updatePassenger(passenger.id, 'fullName', e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27500] focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passenger Type *
              </label>
              <select
                value={passenger.type}
                onChange={(e) =>
                  updatePassenger(passenger.id, 'type', e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27500] focus:border-transparent"
              >
                <option value="Adult">Adult</option>
                <option value="Kids">Kids</option>
              </select>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addPassenger}
          className="w-full mb-6 py-3 border-2 border-[#F27500] text-[#F27500] rounded-lg hover:bg-[#F27500] hover:text-white transition-colors font-medium"
        >
          + Add Another Passenger
        </button>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 bg-[#F27500] text-white rounded-lg hover:bg-[#d96600] transition-colors font-medium"
          >
            Continue to Seat Selection
          </button>
        </div>
      </form>
    </div>
  );
}
