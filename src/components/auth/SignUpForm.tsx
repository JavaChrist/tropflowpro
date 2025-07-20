import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, User, Hash, UserPlus, AlertCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

interface SignUpFormProps {
  onToggleMode: () => void;
}

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  contractNumber: string;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onToggleMode }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<SignUpFormData>({
    mode: 'onTouched', // Validation seulement après interaction
    reValidateMode: 'onChange'
  });

  const password = watch('password');

  // Gestionnaire de focus pour iOS PWA - active le clavier sans validation
  const handleInputFocus = () => (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.currentTarget;

    // Force l'activation du clavier iOS avec setSelectionRange seulement si supporté
    setTimeout(() => {
      if (input.type === 'text' || input.type === 'password' || input.type === 'search' || input.type === 'url' || input.type === 'tel') {
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    }, 50);
  };

  const onSubmit = async (data: SignUpFormData) => {
    if (data.password !== data.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.firstName, data.lastName, data.contractNumber);
      reset();
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      alert(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Création de votre compte...</p>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="text-center mb-8">
          <UserPlus className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h2>
          <p className="text-gray-600">Rejoignez TropFlow Pro dès aujourd'hui</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 mr-2" />
              Prénom
            </label>
            <input
              id="firstName"
              type="text"
              inputMode="text"
              autoComplete="given-name"
              spellCheck={false}
              autoCapitalize="words"
              autoCorrect="on"
              data-form-type="text"
              {...register('firstName', {
                required: 'Le prénom est obligatoire'
              })}
              onFocus={handleInputFocus()}
              className="pwa-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              placeholder="Jean"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 mr-2" />
              Nom
            </label>
            <input
              id="lastName"
              type="text"
              inputMode="text"
              autoComplete="family-name"
              spellCheck={false}
              autoCapitalize="words"
              autoCorrect="on"
              data-form-type="text"
              {...register('lastName', {
                required: 'Le nom est obligatoire'
              })}
              onFocus={handleInputFocus()}
              className="pwa-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              placeholder="Dupont"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="contractNumber" className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Hash className="h-4 w-4 mr-2" />
            Numéro de contrat
          </label>
          <input
            id="contractNumber"
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="characters"
            autoCorrect="off"
            data-form-type="text"
            {...register('contractNumber', {
              required: 'Le numéro de contrat est obligatoire'
            })}
            onFocus={handleInputFocus()}
            className="pwa-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            placeholder="CNT-2024-001"
          />
          {errors.contractNumber && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.contractNumber.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Mail className="h-4 w-4 mr-2" />
            Email professionnel
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            data-form-type="email"
            {...register('email', {
              required: 'L\'email est obligatoire',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email invalide'
              }
            })}
            onFocus={handleInputFocus()}
            className="pwa-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            placeholder="votre@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Lock className="h-4 w-4 mr-2" />
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              inputMode="text"
              autoComplete="new-password"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              data-form-type="password"
              {...register('password', {
                required: 'Le mot de passe est obligatoire',
                minLength: {
                  value: 6,
                  message: 'Le mot de passe doit contenir au moins 6 caractères'
                }
              })}
              onFocus={handleInputFocus()}
              className="pwa-input w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Lock className="h-4 w-4 mr-2" />
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('confirmPassword', {
              required: 'Veuillez confirmer votre mot de passe',
              validate: (value) => value === password || 'Les mots de passe ne correspondent pas'
            })}
            onFocus={handleInputFocus()}
            className="pwa-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            placeholder="••••••••"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="pwa-input w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium flex items-center justify-center"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Créer mon compte
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={onToggleMode}
            className="text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            Déjà un compte ? Se connecter
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignUpForm; 