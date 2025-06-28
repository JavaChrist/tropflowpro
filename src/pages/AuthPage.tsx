import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import LoginForm from '../components/auth/LoginForm';
import SignUpForm from '../components/auth/SignUpForm';

const AuthPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Section gauche - Présentation */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-8">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-12">
                  <div className="flex items-center space-x-1">
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                </div>
              </div>
              <h1 className="ml-4 text-4xl font-bold text-gray-900">
                <span className="text-blue-600">Trip</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Flow</span>
              </h1>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Gérez vos frais de
              <span className="text-blue-600"> déplacement</span>
              simplement
            </h2>

            <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
              TripFlow vous permet de créer, suivre et soumettre vos notes de frais
              professionnelles en quelques clics.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-gray-700">Formulaires simplifiés</span>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
                <span className="text-gray-700">Upload de reçus</span>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                </div>
                <span className="text-gray-700">Export PDF</span>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                </div>
                <span className="text-gray-700">Envoi par email</span>
              </div>
            </div>
          </div>

          {/* Section droite - Formulaires */}
          <div className="w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {isLoginMode ? (
                <LoginForm onToggleMode={toggleMode} />
              ) : (
                <SignUpForm onToggleMode={toggleMode} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 