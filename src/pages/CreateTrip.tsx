import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import useTripStore from '../store/tripStore';
import useAuth from '../hooks/useAuth';
import PlanService from '../services/planService';
import { PlanLimitError } from '../services/tripService';

interface CreateTripFormData {
  name: string;
  destination: string;
  purpose: string;
  departureDate: string;
  returnDate: string;
  remarks?: string;
}

const CreateTrip: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canCreateTrip, setCanCreateTrip] = useState(true);
  const [limitationMessage, setLimitationMessage] = useState<string | null>(null);
  // const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const { createTrip, isLoading, error, clearError } = useTripStore();
  const { userProfile, incrementTripsUsed } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<CreateTripFormData>({
    defaultValues: {
      name: '',
      destination: '',
      purpose: '',
      departureDate: '',
      returnDate: '',
      remarks: ''
    }
  });

  const departureDate = watch('departureDate');

  // Vérifier les limites au chargement
  useEffect(() => {
    const checkLimits = async () => {
      if (!userProfile) return;

      try {
        const canCreate = PlanService.canUserCreateTrip(userProfile);
        setCanCreateTrip(canCreate);

        if (!canCreate) {
          const message = PlanService.getLimitationMessage(userProfile);
          setLimitationMessage(message);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des limites:', error);
      }
    };

    checkLimits();
  }, [userProfile]);

  // handleSelectPlan moved to Dashboard.tsx - not needed here
  // const handleSelectPlan = async (planId: PlanType) => { ... }

  const onSubmit = async (data: CreateTripFormData) => {
    if (!userProfile) {
      console.error('Profil utilisateur non disponible');
      return;
    }

    try {
      setIsSubmitting(true);
      clearError();

      const tripId = await createTrip(data, userProfile);

      // ✅ IMPORTANT: Incrémenter le compteur cumulatif après création réussie
      await incrementTripsUsed();

      navigate(`/trips/${tripId}`);
    } catch (error) {
      console.error('Erreur lors de la création du déplacement:', error);

      if (error instanceof PlanLimitError) {
        setCanCreateTrip(false);
        setLimitationMessage(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nouveau déplacement
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Créez un nouveau déplacement professionnel
          </p>
        </div>

        {/* Vérification des limites */}
        {!canCreateTrip && limitationMessage && (
          <div className="m-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Limite atteinte
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {limitationMessage}
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Voir les plans premium
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire */}
        {canCreateTrip && (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Nom du déplacement */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom du déplacement *
              </label>
              <input
                {...register('name', {
                  required: 'Le nom du déplacement est requis'
                })}
                type="text"
                id="name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="ex: Mission Paris - Janvier 2024"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
              )}
            </div>

            {/* Destination */}
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destination *
              </label>
              <input
                {...register('destination', {
                  required: 'La destination est requise'
                })}
                type="text"
                id="destination"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="ex: Paris, France"
              />
              {errors.destination && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.destination.message}</p>
              )}
            </div>

            {/* Objet */}
            <div>
              <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Objet du déplacement *
              </label>
              <input
                {...register('purpose', {
                  required: "L'objet du déplacement est requis"
                })}
                type="text"
                id="purpose"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="ex: Réunion client, Formation, Conférence..."
              />
              {errors.purpose && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.purpose.message}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date de départ *
                </label>
                <input
                  {...register('departureDate', {
                    required: 'La date de départ est requise'
                  })}
                  type="date"
                  id="departureDate"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.departureDate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.departureDate.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date de retour *
                </label>
                <input
                  {...register('returnDate', {
                    required: 'La date de retour est requise'
                  })}
                  type="date"
                  id="returnDate"
                  min={departureDate}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.returnDate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.returnDate.message}</p>
                )}
              </div>
            </div>

            {/* Remarques */}
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Remarques
              </label>
              <textarea
                {...register('remarks')}
                id="remarks"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Informations complémentaires (optionnel)"
              />
            </div>

            {/* Erreur */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/trips')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting || isLoading ? 'Création...' : 'Créer le déplacement'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateTrip; 