'use client';

import { useState } from 'react';

export default function SeatSelector({ passengers, initialData, onNext, onBack, tracker }) {
  const [selectedSeats, setSelectedSeats] = useState(initialData || []);

  // Generate dummy seats (4 rows, 4 seats per row - A, B, C, D)
  const rows = 12;
  const columns = ['A', 'B', 'C', 'D'];

  const toggleSeat = (seatNumber) => {
    // End hesitation when seat is clicked
    if (tracker) {
      tracker.endSeatHover();
    }

    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
    } else {
      if (selectedSeats.length < passengers.length) {
        setSelectedSeats([...selectedSeats, seatNumber]);
      } else {
        alert(`You can only select ${passengers.length} seat(s) for ${passengers.length} passenger(s)`);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedSeats.length !== passengers.length) {
      alert(`Please select exactly ${passengers.length} seat(s) for ${passengers.length} passenger(s)`);
      return;
    }

    onNext({ selectedSeats });
  };

  const isSeatOccupied = (seatNumber) => {
    // Randomly mark some seats as occupied (dummy)
    const occupiedSeats = ['1A', '2B', '3C', '5A', '7D', '8B', '10A'];
    return occupiedSeats.includes(seatNumber);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Seats</h2>
      <p className="text-gray-600 mb-6">
        Select {passengers.length} seat(s) for {passengers.length} passenger(s)
      </p>

      <div className="mb-6 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F27500] rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-400 rounded"></div>
          <span>Occupied</span>
        </div>
      </div>

      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <div className="text-center mb-4 text-sm text-gray-500">Front of Train</div>

        <div className="max-w-md mx-auto">
          {Array.from({ length: rows }, (_, rowIndex) => {
            const rowNumber = rowIndex + 1;
            return (
              <div key={rowNumber} className="flex items-center justify-center gap-2 mb-2">
                <span className="w-6 text-right text-sm text-gray-500">{rowNumber}</span>

                {columns.slice(0, 2).map((col) => {
                  const seatNumber = `${rowNumber}${col}`;
                  const occupied = isSeatOccupied(seatNumber);
                  const selected = selectedSeats.includes(seatNumber);

                  return (
                    <button
                      key={seatNumber}
                      type="button"
                      onClick={() => !occupied && toggleSeat(seatNumber)}
                      onMouseEnter={() => {
                        if (tracker && !occupied) {
                          tracker.startSeatHover();
                        }
                      }}
                      onMouseLeave={() => {
                        if (tracker && !occupied) {
                          tracker.endSeatHover();
                        }
                      }}
                      disabled={occupied}
                      className={`
                        w-10 h-10 rounded text-xs font-semibold transition-colors
                        ${
                          occupied
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : selected
                            ? 'bg-[#F27500] text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }
                      `}
                    >
                      {col}
                    </button>
                  );
                })}

                <div className="w-8"></div>

                {columns.slice(2).map((col) => {
                  const seatNumber = `${rowNumber}${col}`;
                  const occupied = isSeatOccupied(seatNumber);
                  const selected = selectedSeats.includes(seatNumber);

                  return (
                    <button
                      key={seatNumber}
                      type="button"
                      onClick={() => !occupied && toggleSeat(seatNumber)}
                      onMouseEnter={() => {
                        if (tracker && !occupied) {
                          tracker.startSeatHover();
                        }
                      }}
                      onMouseLeave={() => {
                        if (tracker && !occupied) {
                          tracker.endSeatHover();
                        }
                      }}
                      disabled={occupied}
                      className={`
                        w-10 h-10 rounded text-xs font-semibold transition-colors
                        ${
                          occupied
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : selected
                            ? 'bg-[#F27500] text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }
                      `}
                    >
                      {col}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Selected Seats:</strong> {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
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
            Continue to Protection
          </button>
        </div>
      </form>
    </div>
  );
}
