import React, { useEffect, useState } from 'react';
import { Crown, TrendingUp, AlertTriangle, Zap, Shield } from 'lucide-react';
import { UserProfile, UsageStats as UsageStatsType } from '../types';
import PlanService from '../services/planService';

interface UsageStatsProps {
  userProfile: UserProfile;
  onUpgradeClick: () => void;
  showUpgradePrompt?: boolean;
}

const UsageStats: React.FC<UsageStatsProps> = ({
  userProfile,
  onUpgradeClick,
  showUpgradePrompt = true
}) => {
  const [stats, setStats] = useState<UsageStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        // Vérifier si le profil a un abonnement, sinon en créer un
        if (!userProfile.subscription) {
          console.warn('⚠️ Profil sans abonnement détecté, initialisation...');
          // Créer un abonnement gratuit par défaut
          const defaultSubscription = {
            planId: 'free' as const,
            status: 'active' as const,
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            tripsUsed: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Créer un profil temporaire avec abonnement pour l'affichage
          const tempProfile = {
            ...userProfile,
            subscription: defaultSubscription
          };

          const usageStats = await PlanService.getUserUsageStats(tempProfile);
          setStats(usageStats);
        } else {
          const usageStats = await PlanService.getUserUsageStats(userProfile);
          setStats(usageStats);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        // En cas d'erreur, créer des stats par défaut
        setStats({
          userId: userProfile.uid,
          currentTripsCount: 0,
          maxTripsAllowed: 10,
          isLimitReached: false,
          planType: 'free',
          remainingTrips: 10
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userProfile) {
      loadStats();
    }
  }, [userProfile]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const plan = PlanService.getPlan(stats.planType);
  const limitationMessage = PlanService.getLimitationMessage(userProfile);
  const upgradeMessage = PlanService.getUpgradeMessage(userProfile);

  const getProgressColor = () => {
    if (stats.isLimitReached) return 'bg-red-500';
    if (stats.remainingTrips <= 2 && stats.remainingTrips > 0) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  const getProgressPercentage = () => {
    if (stats.maxTripsAllowed === -1) return 100; // Illimité
    return Math.min((stats.currentTripsCount / stats.maxTripsAllowed) * 100, 100);
  };

  const isPremium = PlanService.isPremiumPlan(stats.planType);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header avec statut du plan */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          {isPremium ? (
            <Crown className="w-6 h-6 text-yellow-500" />
          ) : (
            <Shield className="w-6 h-6 text-green-500" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Plan {plan?.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isPremium ? 'Plan premium actif' : 'Plan gratuit'}
            </p>
          </div>
        </div>

        {!isPremium && showUpgradePrompt && (
          <button
            onClick={onUpgradeClick}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <Crown className="w-4 h-4" />
            <span>Mettre à niveau</span>
          </button>
        )}
      </div>

      {/* Statistiques d'utilisation */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Déplacements créés
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {stats.currentTripsCount}
              {stats.maxTripsAllowed === -1 ? ' (Illimité)' : ` / ${stats.maxTripsAllowed}`}
            </span>
          </div>

          {stats.maxTripsAllowed !== -1 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          )}

          {stats.maxTripsAllowed !== -1 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.remainingTrips > 0
                ? `${stats.remainingTrips} déplacement${stats.remainingTrips > 1 ? 's' : ''} restant${stats.remainingTrips > 1 ? 's' : ''}`
                : 'Limite atteinte'
              }
            </p>
          )}

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">
            ℹ️ Compteur cumulatif - ne diminue pas lors de suppressions
          </p>
        </div>

        {/* Messages d'alerte ou d'encouragement */}
        {stats.isLimitReached && limitationMessage && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  Limite atteinte
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {limitationMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {!isPremium && !stats.isLimitReached && stats.remainingTrips <= 2 && stats.remainingTrips > 0 && (
          <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                  Bientôt à la limite
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  Plus que {stats.remainingTrips} déplacement{stats.remainingTrips > 1 ? 's' : ''} restant{stats.remainingTrips > 1 ? 's' : ''}.
                  Pensez à passer au plan Pro !
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Encouragement à l'upgrade pour les utilisateurs gratuits */}
        {!isPremium && !stats.isLimitReached && showUpgradePrompt && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <Zap className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  Débloquez plus de fonctionnalités
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 mb-3">
                  {upgradeMessage}
                </p>
                <button
                  onClick={onUpgradeClick}
                  className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md transition-colors"
                >
                  Voir les plans Pro
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Avantages du plan premium */}
        {isPremium && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <Crown className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  Plan Premium actif
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Profitez de tous les avantages : déplacements illimités, rapports avancés et support prioritaire.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageStats; 