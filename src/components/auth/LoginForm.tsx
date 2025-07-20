import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

interface LoginFormProps {
  onToggleMode: () => void;
}

interface LoginFormData {
  email: string;
  password: string;
}



const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const { signIn, resetPassword, isLoading, error, clearError } = useAuth();

  const { register, handleSubmit, formState: { errors }, clearErrors, getValues } = useForm<LoginFormData>({
    mode: 'onSubmit', // Évite la validation automatique sur iOS
    reValidateMode: 'onBlur'
  });



  // Détecteur d'auto-complétion - Simple nettoyage des erreurs "obligatoire"
  const handleAutocompleteCheck = (fieldName: keyof LoginFormData) => () => {
    setTimeout(() => {
      const value = getValues(fieldName);
      if (value && value.trim() !== '' && errors[fieldName]) {
        // Si le champ a du contenu et qu'il y a une erreur "obligatoire", la supprimer
        const errorMessage = errors[fieldName]?.message;
        if (errorMessage && errorMessage.includes('obligatoire')) {
          clearErrors(fieldName);
        }
      }
    }, 100);
  };

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

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await signIn(data.email, data.password);
    } catch (error) {
      // L'erreur est gérée par le hook useAuth
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetMessage('Veuillez saisir votre adresse email');
      return;
    }

    try {
      await resetPassword(resetEmail);
      setResetMessage('Email de réinitialisation envoyé ! Vérifiez votre boîte mail.');
      setTimeout(() => {
        setShowResetForm(false);
        setResetMessage('');
        setResetEmail('');
      }, 3000);
    } catch (error) {
      // L'erreur est gérée par le hook useAuth
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="relative mx-auto w-16 h-16 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <LogIn className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Connectez-vous à votre compte TropFlow Pro
        </h2>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 auth-form">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="inline h-4 w-4 mr-2" />
            Adresse email
          </label>
          <input
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
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Adresse email invalide'
              },
              onChange: (e) => {
                // Nettoyer les erreurs quand l'utilisateur tape
                if (errors.email) {
                  clearErrors('email');
                }
              },
              onBlur: (e) => {
                // Détecter l'auto-complétion après un délai
                handleAutocompleteCheck('email')();
              }
            })}
            onFocus={handleInputFocus()}
            className="pwa-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="votre@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Lock className="inline h-4 w-4 mr-2" />
            Mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              inputMode="text"
              autoComplete="current-password"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              data-form-type="password"

              {...register('password', {
                required: 'Le mot de passe est obligatoire',
                minLength: {
                  value: 6,
                  message: 'Le mot de passe doit contenir au moins 6 caractères'
                },
                onChange: (e) => {
                  // Nettoyer les erreurs quand l'utilisateur tape
                  if (errors.password) {
                    clearErrors('password');
                  }
                },
                onBlur: (e) => {
                  // Détecter l'auto-complétion après un délai
                  handleAutocompleteCheck('password')();
                }
              })}
              onFocus={handleInputFocus()}
              className="pwa-input w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Connexion...
            </div>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>

      {/* Mot de passe oublié */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setShowResetForm(!showResetForm)}
          className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Mot de passe oublié ?
        </button>
      </div>

      {/* Formulaire de reset */}
      {showResetForm && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Réinitialiser votre mot de passe
          </h4>
          <form onSubmit={handleResetPassword}>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Votre adresse email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {isLoading ? 'Envoi...' : 'Envoyer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetForm(false);
                  setResetMessage('');
                  setResetEmail('');
                }}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
          {resetMessage && (
            <p className={`mt-2 text-sm ${resetMessage.includes('envoyé') ? 'text-green-600' : 'text-red-600'}`}>
              {resetMessage}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Pas encore de compte ?{' '}
          <button
            onClick={onToggleMode}
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Créer un compte
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm; 