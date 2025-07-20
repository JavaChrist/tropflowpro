// Types centralisés pour l'application TropFlow Pro

// Plans disponibles
export type PlanType = 'free' | 'pro_individual' | 'pro_enterprise';

export interface PlanFeatures {
  id: PlanType;
  name: string;
  price: number; // Prix en euros par mois
  maxTrips: number; // -1 pour illimité
  maxUsers: number; // -1 pour illimité
  features: string[];
  popular?: boolean;
}

// Informations d'abonnement utilisateur
export interface UserSubscription {
  planId: PlanType;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  mollieCustomerId?: string;
  mollieSubscriptionId?: string;
  tripsUsed: number; // Nombre total de déplacements créés (cumulatif, ne diminue jamais)
  createdAt: string;
  updatedAt: string;
}

// Profil utilisateur étendu avec abonnement
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  contractNumber: string;
  firstName: string;
  lastName: string;
  subscription: UserSubscription;
  createdAt: string;
  updatedAt: string;
}

// Déplacement (container principal)
export interface Trip {
  id: string;
  userId: string;
  name: string; // "PI Planning Lyon"
  destination: string; // "Lyon"
  purpose: string; // "PI Planning"
  departureDate: string;
  returnDate: string;
  contractNumber: string; // Du profil utilisateur
  collaborator: {
    firstName: string;
    lastName: string;
  };
  remarks?: string;
  status: 'draft' | 'submitted' | 'paid';
  createdAt: string;
  updatedAt: string;
}

// Note de frais (rattachée à un déplacement)
export interface ExpenseNote {
  id: string;
  tripId: string; // Rattachée au déplacement
  userId: string;
  category: 'transport_long' | 'transport_short' | 'accommodation' | 'meals' | 'other';
  subcategory: string;
  description: string;
  amount: number;
  date: string;
  receiptUrl?: string;
  receiptName?: string;
  isVeloce: boolean;
  isPersonal: boolean;
  createdAt: string;
  updatedAt: string;
}

// Résumé d'un déplacement avec totaux
export interface TripSummary extends Trip {
  notes: ExpenseNote[];
  totalAmount: number;
  totalVeloce: number;
  totalPersonal: number;
  notesCount: number;
}

// Configuration des plans
export const AVAILABLE_PLANS: PlanFeatures[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    maxTrips: 10,
    maxUsers: 1,
    features: [
      '10 déplacements maximum',
      'Notes de frais illimitées',
      'Export PDF',
      'Gestion des factures',
      'Support communautaire'
    ]
  },
  {
    id: 'pro_individual',
    name: 'Pro Individuel',
    price: 9.99,
    maxTrips: -1,
    maxUsers: 1,
    features: [
      'Déplacements illimités',
      'Notes de frais illimitées',
      'Export PDF avancé',
      'Gestion des factures',
      'Rapports détaillés',
      'Support prioritaire',
      'Sauvegarde cloud'
    ],
    popular: true
  },
  {
    id: 'pro_enterprise',
    name: 'Pro Entreprise',
    price: -1, // Prix sur mesure
    maxTrips: -1,
    maxUsers: -1,
    features: [
      'Tout du Pro Individuel',
      'Multi-utilisateurs (jusqu\'à 10)',
      'Gestion d\'équipe',
      'Rapports consolidés',
      'API d\'intégration',
      'Support dédié',
      'Facturation centralisée',
      'Offre sur mesure adaptée à vos besoins'
    ]
  }
];

// Helpers pour les plans
export const getPlanById = (planId: PlanType): PlanFeatures | undefined => {
  return AVAILABLE_PLANS.find(plan => plan.id === planId);
};

// Liste des emails autorisés pour l'accès admin/propriétaire
const ADMIN_EMAILS = [
  'contact@javachrist.fr',    // Propriétaire principal
  'admin@javachrist.fr',      // Compte admin supplémentaire
  // Ajoutez d'autres emails admin ici si besoin
];

// Vérifier si un utilisateur est administrateur/propriétaire
export const isAdminUser = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

// Vérifier si l'utilisateur peut créer un déplacement (avec bypass admin)
export const canCreateTrip = (subscription: UserSubscription, userEmail?: string): boolean => {
  // 🔑 BYPASS ADMIN : Les propriétaires/admins ont toujours accès illimité
  if (userEmail && isAdminUser(userEmail)) {
    console.log('👑 Accès admin détecté - bypass des limites');
    return true;
  }

  // Logique normale pour les autres utilisateurs
  const plan = getPlanById(subscription.planId);
  if (!plan) return false;

  return plan.maxTrips === -1 || subscription.tripsUsed < plan.maxTrips;
};

export const getRemainingTrips = (subscription: UserSubscription): number => {
  const plan = getPlanById(subscription.planId);
  if (!plan || plan.maxTrips === -1) return -1; // Illimité

  return Math.max(0, plan.maxTrips - subscription.tripsUsed);
};

// Statistiques d'utilisation pour l'UI
export interface UsageStats {
  userId: string;
  currentTripsCount: number;
  maxTripsAllowed: number; // -1 pour illimité
  isLimitReached: boolean;
  planType: PlanType;
  remainingTrips: number; // -1 pour illimité
} 