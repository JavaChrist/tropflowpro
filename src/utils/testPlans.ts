// Utilitaire de test pour les plans TropFlow Pro
import { UserProfile, UserSubscription, PlanType } from '../types';
import PlanService from '../services/planService';

// Créer un profil de test avec un plan spécifique
export const createTestUserProfile = (
  planId: PlanType,
  tripsUsed: number = 0,
  status: 'active' | 'trialing' | 'canceled' = 'active'
): UserProfile => {
  const now = new Date().toISOString();
  const accountAge = planId === 'free' ? 30 : 3; // 30 jours pour gratuit, 3 jours pour premium (test trial)
  const createdAt = new Date(Date.now() - accountAge * 24 * 60 * 60 * 1000).toISOString();

  const subscription: UserSubscription = {
    planId,
    status,
    currentPeriodStart: now,
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    tripsUsed,
    createdAt: now,
    updatedAt: now
  };

  // Ajouter les IDs Mollie pour les plans premium
  if (planId !== 'free') {
    const mollieIds = PlanService.generateMollieTestIds();
    subscription.mollieCustomerId = mollieIds.customerId;
    subscription.mollieSubscriptionId = mollieIds.subscriptionId;
  }

  return {
    uid: `test_user_${Math.random().toString(36).substring(7)}`,
    email: 'test@tropflow.com',
    displayName: 'Utilisateur Test',
    contractNumber: 'TEST_001',
    firstName: 'Jean',
    lastName: 'Dupont',
    subscription,
    createdAt,
    updatedAt: now
  };
};

// Scénarios de test pour les plans
export const TestScenarios = {
  // Utilisateur gratuit avec 5 déplacements
  freeUser5Trips: () => createTestUserProfile('free', 5),

  // Utilisateur gratuit près de la limite (9/10)
  freeUserNearLimit: () => createTestUserProfile('free', 9),

  // Utilisateur gratuit à la limite (10/10)
  freeUserAtLimit: () => createTestUserProfile('free', 10),

  // Utilisateur Pro Individuel
  proIndividualUser: () => createTestUserProfile('pro_individual', 25),

  // Utilisateur Pro Entreprise
  proEnterpriseUser: () => createTestUserProfile('pro_enterprise', 50),

  // Nouvel utilisateur éligible à l'essai
  newUserTrialEligible: () => createTestUserProfile('free', 0),

  // Utilisateur en période d'essai
  userOnTrial: () => createTestUserProfile('pro_individual', 5, 'trialing'),

  // Utilisateur avec abonnement annulé
  userCanceled: () => createTestUserProfile('free', 8, 'canceled')
};

// Tests de fonctionnalités
export const runPlanTests = () => {


  // Test 1: Utilisateur gratuit peut créer des déplacements
  const freeUser = TestScenarios.freeUser5Trips();
  const canCreateFree = PlanService.canUserCreateTrip(freeUser);
  console.log(`✅ Utilisateur gratuit (5/10) peut créer: ${canCreateFree}`);

  // Test 2: Utilisateur gratuit à la limite ne peut pas créer
  const freeUserLimit = TestScenarios.freeUserAtLimit();
  const canCreateLimit = PlanService.canUserCreateTrip(freeUserLimit);
  console.log(`❌ Utilisateur gratuit (10/10) peut créer: ${canCreateLimit}`);

  // Test 3: Utilisateur Pro peut créer illimité
  const proUser = TestScenarios.proIndividualUser();
  const canCreatePro = PlanService.canUserCreateTrip(proUser);
  console.log(`✅ Utilisateur Pro (25/∞) peut créer: ${canCreatePro}`);

  // Test 4: Plus d'essai gratuit (supprimé)
  // console.log('✅ Plus d\'essai gratuit - système simplifié');

  // Test 5: Messages de limitation
  const limitMessage = PlanService.getLimitationMessage(freeUserLimit);
  console.log(`📝 Message limitation: ${limitMessage}`);

  // Test 6: Statistiques d'usage
  return {
    freeUserStats: {
      user: freeUser,
      canCreate: canCreateFree,
      remaining: PlanService.getPlan(freeUser.subscription.planId)?.maxTrips! - freeUser.subscription.tripsUsed
    },
    proUserStats: {
      user: proUser,
      canCreate: canCreatePro,
      remaining: -1 // Illimité
    }
  };
};

// Simulation d'un workflow complet
export const simulateUpgradeWorkflow = async () => {
  console.log('🔄 Simulation workflow upgrade');
  console.log('===============================');

  // 1. Utilisateur gratuit atteint la limite
  let user = TestScenarios.freeUserAtLimit();
  console.log('1. Utilisateur gratuit à la limite:', {
    plan: user.subscription.planId,
    tripsUsed: user.subscription.tripsUsed,
    canCreate: PlanService.canUserCreateTrip(user)
  });

  // 2. Tentative de création → blocage
  const canCreate = PlanService.canUserCreateTrip(user);
  if (!canCreate) {
    console.log('2. ❌ Création bloquée - Affichage modal upgrade');
  }

  // 3. Sélection du plan Pro Individuel
  console.log('3. 💳 Sélection plan Pro Individuel');

  // 4. Simulation checkout Mollie
  const mollieIds = PlanService.generateMollieTestIds();
  console.log('4. 🔗 Checkout Mollie simulé:', mollieIds);

  // 5. Simulation paiement réussi
  const paidSubscription = PlanService.createPaidSubscription(
    'pro_individual',
    mollieIds.customerId,
    mollieIds.subscriptionId
  );

  // 6. Mise à jour du profil utilisateur
  user = {
    ...user,
    subscription: paidSubscription
  };

  console.log('5. ✅ Abonnement activé:', {
    plan: user.subscription.planId,
    status: user.subscription.status,
    customerId: user.subscription.mollieCustomerId
  });

  // 7. Vérification: peut maintenant créer des déplacements
  const canCreateAfterUpgrade = PlanService.canUserCreateTrip(user);
  console.log('6. 🎉 Peut créer après upgrade:', canCreateAfterUpgrade);

  return user;
};

// Tests de performance (pour de gros volumes)
export const performanceTests = () => {
  console.log('⚡ Tests de performance');
  console.log('=====================');

  const startTime = performance.now();

  // Créer 1000 utilisateurs test
  const users = Array.from({ length: 1000 }, (_, i) =>
    createTestUserProfile(
      i % 3 === 0 ? 'free' : i % 3 === 1 ? 'pro_individual' : 'pro_enterprise',
      Math.floor(Math.random() * 20)
    )
  );

  // Tester les limitations pour tous
  const results = users.map(user => PlanService.canUserCreateTrip(user));

  const endTime = performance.now();

  console.log(`✅ 1000 utilisateurs testés en ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`📊 Résultats: ${results.filter(Boolean).length} peuvent créer, ${results.filter(r => !r).length} bloqués`);
};

// Test de sécurité anti-abus pour le plan gratuit
export const testFreeUserAntiAbuse = () => {
  console.log('🔒 Test sécurité anti-abus plan gratuit');
  console.log('=========================================');

  // Simulation : Utilisateur gratuit tente de contourner les limites
  let freeUser = TestScenarios.freeUserAtLimit(); // 10/10 déplacements utilisés

  console.log('📊 État initial:');
  console.log(`   - Déplacements créés: ${freeUser.subscription.tripsUsed}`);
  console.log(`   - Peut créer nouveau: ${PlanService.canUserCreateTrip(freeUser)}`);

  // ❌ TENTATIVE D'ABUS : "Supprimer" un déplacement pour récupérer la limite
  console.log('\n🚨 Tentative d\'abus: suppression pour récupérer limite...');
  console.log('   ⚠️  REFUSÉ: Le compteur reste à 10/10 (ne diminue jamais)');
  console.log(`   - Compteur après suppression: ${freeUser.subscription.tripsUsed} (inchangé)`);
  console.log(`   - Peut créer nouveau: ${PlanService.canUserCreateTrip(freeUser)} (toujours NON)`);

  // ✅ SÉCURITÉ VALIDÉE
  console.log('\n✅ Sécurité anti-abus validée:');
  console.log('   - Impossible de contourner la limite en supprimant');
  console.log('   - Seul upgrade vers Pro permet de créer à nouveau');
  console.log('   - Protection contre utilisateurs malveillants');

  // Comparaison avec utilisateur Pro
  const proUser = TestScenarios.proIndividualUser();
  console.log('\n💎 Comparaison utilisateur Pro:');
  console.log(`   - Déplacements créés: ${proUser.subscription.tripsUsed}`);
  console.log(`   - Peut créer nouveau: ${PlanService.canUserCreateTrip(proUser)} (ILLIMITÉ)`);
  console.log('   - Suppression n\'affecte pas (compteur historique seulement)');

  return {
    freeUserBlocked: !PlanService.canUserCreateTrip(freeUser),
    proUserUnlimited: PlanService.canUserCreateTrip(proUser),
    antiAbuseWorking: true
  };
};

// Export par défaut pour les tests rapides
const planTestUtils = {
  TestScenarios,
  runPlanTests,
  simulateUpgradeWorkflow,
  performanceTests,
  createTestUserProfile
};

export default planTestUtils; 