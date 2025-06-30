import { UserProfile, UserSubscription, PlanType, canCreateTrip, getRemainingTrips, getPlanById, AVAILABLE_PLANS, UsageStats } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export class PlanService {
  // Vérifier si l'utilisateur peut créer un nouveau déplacement
  static canUserCreateTrip(userProfile: UserProfile): boolean {
    return canCreateTrip(userProfile.subscription);
  }

  // Obtenir les statistiques d'utilisation de l'utilisateur
  static async getUserUsageStats(userProfile: UserProfile): Promise<UsageStats> {
    const plan = getPlanById(userProfile.subscription.planId);
    const currentTripsCount = userProfile.subscription.tripsUsed;
    const maxTripsAllowed = plan?.maxTrips || -1;
    const remainingTrips = getRemainingTrips(userProfile.subscription);

    return {
      userId: userProfile.uid,
      currentTripsCount,
      maxTripsAllowed,
      isLimitReached: !canCreateTrip(userProfile.subscription),
      planType: userProfile.subscription.planId,
      remainingTrips
    };
  }

  // Compter le nombre de déplacements de l'utilisateur (pour information uniquement)
  static async getUserTripsCount(userId: string): Promise<number> {
    try {
      const tripsQuery = query(
        collection(db, 'trips'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(tripsQuery);
      return querySnapshot.size;
    } catch (error) {
      console.error('Erreur lors du comptage des déplacements:', error);
      return 0;
    }
  }

  // Obtenir le plan par ID
  static getPlan(planId: PlanType) {
    return getPlanById(planId);
  }

  // Obtenir tous les plans disponibles
  static getAvailablePlans() {
    return AVAILABLE_PLANS;
  }

  // Vérifier si un plan est premium
  static isPremiumPlan(planId: PlanType): boolean {
    return planId !== 'free';
  }

  // Obtenir le message de limitation pour l'utilisateur
  static getLimitationMessage(userProfile: UserProfile): string | null {
    const stats = canCreateTrip(userProfile.subscription);

    if (stats) {
      return null; // Pas de limitation
    }

    const plan = getPlanById(userProfile.subscription.planId);
    if (!plan) return 'Plan non reconnu';

    if (plan.maxTrips > 0) {
      return `Limite atteinte: ${plan.maxTrips} déplacements maximum pour le plan ${plan.name}`;
    }

    return 'Limite atteinte pour votre plan actuel';
  }

  // Obtenir le texte d'encouragement à l'upgrade
  static getUpgradeMessage(userProfile: UserProfile): string {
    const plan = getPlanById(userProfile.subscription.planId);

    if (plan?.id === 'free') {
      return 'Passez au plan Pro Individuel pour des déplacements illimités !';
    }

    return 'Découvrez nos plans Pro pour plus de fonctionnalités !';
  }

  // Calculer les économies annuelles (exemple: 10% de réduction pour l'annuel)
  static calculateAnnualSavings(monthlyPrice: number): number {
    const annualPrice = monthlyPrice * 12 * 0.9; // 10% de réduction
    const monthlySavings = (monthlyPrice * 12) - annualPrice;
    return Math.round(monthlySavings * 100) / 100;
  }

  // Formater le prix pour l'affichage
  static formatPrice(price: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(price);
  }

  // Vérifier si l'utilisateur est éligible à une période d'essai
  static isEligibleForTrial(userProfile: UserProfile): boolean {
    // Éligible si nouveau compte (moins de 7 jours) et jamais eu de plan premium
    const accountAge = Date.now() - new Date(userProfile.createdAt).getTime();
    const isNewAccount = accountAge < 7 * 24 * 60 * 60 * 1000; // 7 jours
    const neverHadPremium = userProfile.subscription.planId === 'free';

    return isNewAccount && neverHadPremium;
  }

  // Créer un abonnement d'essai
  static createTrialSubscription(planId: PlanType): UserSubscription {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 jours

    return {
      planId,
      status: 'trialing',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: trialEnd.toISOString(),
      tripsUsed: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
  }

  // Créer un abonnement payant avec Mollie
  static createPaidSubscription(
    planId: PlanType,
    mollieCustomerId: string,
    mollieSubscriptionId: string
  ): UserSubscription {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    return {
      planId,
      status: 'active',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: nextMonth.toISOString(),
      mollieCustomerId,
      mollieSubscriptionId,
      tripsUsed: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
  }

  // Générer un ID Mollie fake pour les tests (format réaliste)
  static generateMollieTestIds() {
    const customerId = `cst_${Math.random().toString(36).substring(2, 15)}`;
    const subscriptionId = `sub_${Math.random().toString(36).substring(2, 15)}`;

    return { customerId, subscriptionId };
  }

  // Obtenir l'URL de checkout Mollie (à implémenter avec l'API)
  static getMollieCheckoutUrl(planId: PlanType, userEmail: string): string {
    // TODO: Implémenter avec l'API Mollie
    const plan = getPlanById(planId);
    console.log('🔗 Création checkout Mollie pour:', {
      plan: plan?.name,
      price: plan?.price,
      email: userEmail
    });

    // Pour l'instant, retourner une URL de test
    return `https://checkout.mollie.com/test?plan=${planId}&email=${encodeURIComponent(userEmail)}`;
  }
}

export default PlanService; 