import React from 'react';
import { MapPin } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mx-auto w-20 h-20 mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <MapPin className="h-10 w-10 text-white" />
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          <span className="text-blue-600">Trip</span>Flow
        </h1>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Chargement de votre espace...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 