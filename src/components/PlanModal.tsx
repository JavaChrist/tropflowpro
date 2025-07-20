import React, { useState } from 'react';
import { X, Check, Crown, Users, Zap, Shield, Star } from 'lucide-react';
import { AVAILABLE_PLANS, PlanFeatures, PlanType, UserProfile } from '../types';
import PlanService from '../services/planService';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSelectPlan: (planId: PlanType) => void;
  onOpenContact?: () => void;
}

const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSelectPlan,
  onOpenContact
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectPlan = async (planId: PlanType) => {
    if (planId === userProfile.subscription.planId) return;

    setIsLoading(true);
    try {
      await onSelectPlan(planId);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sélection du plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanIcon = (planId: PlanType) => {
    switch (planId) {
      case 'free':
        return <Shield className="w-6 h-6 text-green-500" />;
      case 'pro_individual':
        return <Crown className="w-6 h-6 text-blue-500" />;
      case 'pro_enterprise':
        return <Users className="w-6 h-6 text-purple-500" />;
      default:
        return <Zap className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planId: PlanType) => {
    switch (planId) {
      case 'free':
        return 'border-2 border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20';
      case 'pro_individual':
        return 'border-2 border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20';
      case 'pro_enterprise':
        return 'border-2 border-purple-300 bg-purple-50 dark:border-purple-600 dark:bg-purple-900/20';
      default:
        return 'border-2 border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800';
    }
  };

  const isCurrentPlan = (planId: PlanType) => {
    return planId === userProfile.subscription.planId;
  };

  const canChangeToPlan = (planId: PlanType) => {
    // On peut toujours changer vers le plan gratuit
    if (planId === 'free') return true;

    // On peut changer vers un plan différent de l'actuel
    return planId !== userProfile.subscription.planId;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Choisissez votre plan
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Sélectionnez le plan qui correspond le mieux à vos besoins
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Plans Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AVAILABLE_PLANS.map((plan: PlanFeatures) => (
              <div
                key={plan.id}
                className={`relative rounded-xl p-6 transition-all duration-200 hover:shadow-lg flex flex-col h-full ${getPlanColor(plan.id)} ${isCurrentPlan(plan.id) ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''} ${plan.popular ? 'ring-2 ring-orange-400' : ''}`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-400 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Populaire
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan(plan.id) && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Plan actuel
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    {getPlanIcon(plan.id)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {plan.price === 0 ? 'Gratuit' :
                      plan.price === -1 ? 'Sur mesure' :
                        `${plan.price}€`}
                    {plan.price > 0 && (
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        /mois
                      </span>
                    )}
                  </div>
                  {plan.price > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Économisez {PlanService.calculateAnnualSavings(plan.price)}€ avec l'abonnement annuel
                    </p>
                  )}
                  {plan.price === -1 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Tarif adapté à votre organisation
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6 flex-grow">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <div className="mt-auto">
                  {isCurrentPlan(plan.id) ? (
                    <div className="space-y-2">
                      <button
                        disabled
                        className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg font-medium cursor-not-allowed min-h-[3rem] flex items-center justify-center"
                      >
                        <span className="flex items-center">
                          <Check className="w-4 h-4 mr-2" />
                          Plan actuel activé
                        </span>
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Vous utilisez actuellement ce plan
                      </p>
                    </div>
                  ) : plan.id === 'pro_enterprise' ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          onClose();
                          onOpenContact?.();
                        }}
                        className="w-full py-3 px-4 rounded-lg font-medium transition-colors min-h-[3rem] flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white"
                      >
                        Nous consulter
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Devis personnalisé • Solutions sur mesure
                      </p>
                    </div>
                  ) : canChangeToPlan(plan.id) ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={isLoading}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors min-h-[3rem] flex items-center justify-center ${plan.id === 'free'
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : plan.popular
                            ? 'bg-orange-400 hover:bg-orange-500 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Chargement...
                          </div>
                        ) : (
                          <>
                            {plan.id === 'free' ? 'Choisir gratuit' : 'Mettre à niveau'}
                          </>
                        )}
                      </button>

                      {/* Plus d'essai gratuit */}

                      {/* Info pour plan gratuit */}
                      {plan.id === 'free' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          Aucun engagement • Toujours gratuit
                        </p>
                      )}

                      {/* Info pour mise à niveau simple */}
                      {plan.id !== 'free' && plan.price > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          {plan.price}€/mois • Annulez à tout moment
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        disabled
                        className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-lg font-medium cursor-not-allowed min-h-[3rem] flex items-center justify-center"
                      >
                        Non disponible
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
              <Shield className="w-4 h-4 mr-2" />
              Paiement sécurisé • Annulation à tout moment • Support client inclus
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanModal; 