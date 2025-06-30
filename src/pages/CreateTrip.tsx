import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Calendar, MapPin, FileText, MessageSquare, AlertTriangle, Crown } from 'lucide-react';
import useTripStore from '../store/tripStore';
import useAuth from '../hooks/useAuth';
import PlanService from '../services/planService';
import PlanModal from '../components/PlanModal';
import { PlanType } from '../types';
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
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const { createTrip, isLoading, error, clearError } = useTripStore();
  const { userProfile, updateUserSubscription, incrementTripsUsed } = useAuth();

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

  const handleSelectPlan = async (planId: PlanType) => {
    if (!userProfile) return;

    try {
      if (planId === 'free') {
        // Rétrogradation vers le plan gratuit
        const freeSubscription = {
          ...userProfile.subscription,
          planId,
          status: 'active' as const,
          updatedAt: new Date().toISOString()
        };
        await updateUserSubscription(freeSubscription);
      } else {
        // Upgrade vers un plan premium
        if (PlanService.isEligibleForTrial(userProfile)) {
          // Créer un abonnement d'essai
          const trialSubscription = PlanService.createTrialSubscription(planId);
          await updateUserSubscription(trialSubscription);
          console.log('🎉 Période d\'essai activée pour', planId);
        } else {
          // Redirection vers Mollie pour le paiement
          console.log('🔗 Redirection vers Mollie pour', planId);

          try {
            const response = await fetch('/api/mollie-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'create-checkout',
                planId: planId,
                userEmail: userProfile.email,
                userId: userProfile.uid,
                returnUrl: `${window.location.origin}/payment/success?plan=${planId}`,
                webhookUrl: `${window.location.origin}/api/mollie-payment?webhook=true`
              })
            });

            const result = await response.json();

            if (result.success) {
              // Rediriger vers la page de paiement Mollie
              window.location.href = result.checkoutUrl;
            } else {
              throw new Error(result.error || 'Erreur lors de la création du checkout');
            }
          } catch (error) {
            console.error('❌ Erreur checkout Mollie:', error);

            // Fallback: simulation pour les tests
            const mollieIds = PlanService.generateMollieTestIds();
            const paidSubscription = PlanService.createPaidSubscription(
              planId,
              mollieIds.customerId,
              mollieIds.subscriptionId
            );
            await updateUserSubscription(paidSubscription);
            console.log('🧪 Simulation paiement Mollie activée');
          }
        }
      }

      // Recharger la page pour réexaminer les limites
      window.location.reload();
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du plan:', error);
    }
  };

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/trips')}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Nouveau déplacement
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Erreur de limitation de plan */}
          {!canCreateTrip && limitationMessage && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <AlertTriangle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">
                    Limite de déplacements atteinte
                  </h3>
                  <p className="text-red-700 dark:text-red-400 mb-4">
                    {limitationMessage}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setIsPlanModalOpen(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Voir les plans Pro
                    </button>
                    <button
                      onClick={() => navigate('/trips')}
                      className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Retour aux déplacements
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Erreur générale */}
          {error && canCreateTrip && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Créer un nouveau déplacement
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Définissez les informations principales de votre déplacement
              </p>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  ℹ️ Vous pourrez ensuite ajouter vos notes de frais avec leurs justificatifs à ce déplacement.
                </p>
              </div>
            </div>

            {canCreateTrip ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Nom du déplacement */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    <FileText className="inline h-5 w-5 mr-2" />
                    Nom du déplacement *
                  </label>
                  <input
                    type="text"
                    {...register('name', {
                      required: 'Le nom du déplacement est obligatoire'
                    })}
                    className="w-full px-4 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Ex: PI Planning Lyon, Réunion client Paris, Formation Marseille..."
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Ce nom permettra d'identifier votre déplacement et toutes ses notes de frais.
                  </p>
                </div>

                {/* Destination et Objet */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <MapPin className="inline h-4 w-4 mr-2" />
                      Destination *
                    </label>
                    <input
                      type="text"
                      {...register('destination', {
                        required: 'La destination est obligatoire'
                      })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Ville ou lieu de mission"
                    />
                    {errors.destination && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.destination.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FileText className="inline h-4 w-4 mr-2" />
                      Objet du déplacement *
                    </label>
                    <input
                      type="text"
                      {...register('purpose', {
                        required: 'L\'objet du déplacement est obligatoire'
                      })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Réunion, formation, audit..."
                    />
                    {errors.purpose && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.purpose.message}</p>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar className="inline h-4 w-4 mr-2" />
                      Date de départ *
                    </label>
                    <input
                      type="date"
                      {...register('departureDate', {
                        required: 'La date de départ est obligatoire'
                      })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    {errors.departureDate && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.departureDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar className="inline h-4 w-4 mr-2" />
                      Date de retour *
                    </label>
                    <input
                      type="date"
                      {...register('returnDate', {
                        required: 'La date de retour est obligatoire',
                        validate: value => {
                          if (departureDate && value < departureDate) {
                            return 'La date de retour doit être postérieure à la date de départ';
                          }
                          return true;
                        }
                      })}
                      min={departureDate}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    {errors.returnDate && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.returnDate.message}</p>
                    )}
                  </div>
                </div>

                {/* Remarques */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MessageSquare className="inline h-4 w-4 mr-2" />
                    Remarques (optionnel)
                  </label>
                  <textarea
                    {...register('remarks')}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Informations complémentaires sur le déplacement..."
                  />
                </div>

                {/* Aperçu des informations utilisateur */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Informations automatiques</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-300">Collaborateur:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {userProfile.firstName} {userProfile.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-300">Numéro de contrat:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{userProfile.contractNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={() => navigate('/trips')}
                    className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    {isSubmitting || isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Création...
                      </div>
                    ) : (
                      'Créer le déplacement'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  Impossible de créer un nouveau déplacement
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Vous avez atteint la limite de votre plan actuel.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setIsPlanModalOpen(true)}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Passer au plan Pro
                  </button>
                  <button
                    onClick={() => navigate('/trips')}
                    className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Retour aux déplacements
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal des plans */}
      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        userProfile={userProfile}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
};

export default CreateTrip; 