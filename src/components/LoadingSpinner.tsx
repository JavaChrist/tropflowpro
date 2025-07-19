import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mx-auto w-20 h-20 mb-8">
          <img
            src="/logo192.png"
            alt="TropFlow Pro"
            className="w-20 h-20 rounded-xl shadow-lg animate-pulse"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          <span className="text-orange-600">Trop</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Flow Pro</span>
        </h1>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
          <p className="text-gray-600">Chargement de votre espace...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 