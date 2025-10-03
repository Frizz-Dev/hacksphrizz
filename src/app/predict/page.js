'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PredictRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /simulation dashboard
    router.push('/simulation');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Prediction Dashboard...</p>
        <p className="text-sm text-gray-500 mt-2">
          Enhanced ML Model with Islamic Calendar Features
        </p>
      </div>
    </div>
  );
}