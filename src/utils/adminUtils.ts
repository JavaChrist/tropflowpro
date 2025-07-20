/**
 * Utilitaires pour la gestion des comptes administrateur
 * TropFlow Pro - Accès propriétaire/admin
 */

import { isAdminUser } from '../types';

// Messages de logs pour les accès admin
export const logAdminAccess = (email: string, action: string) => {
  if (isAdminUser(email)) {
    console.log(`👑 [ADMIN ACCESS] ${email} - ${action}`);
  }
};

// Afficher un badge admin dans l'interface si souhaité
export const getAdminBadge = (email: string): string | null => {
  return isAdminUser(email) ? '👑 Admin' : null;
};

// Obtenir le plan effectif (admin = toujours Pro)
export const getEffectivePlan = (userEmail: string, originalPlan: string): string => {
  if (isAdminUser(userEmail)) {
    return 'Admin (Pro Unlimited)';
  }
  return originalPlan;
};

// Instructions pour ajouter un nouvel admin
export const adminInstructions = () => {
  console.log('📝 Pour ajouter un nouvel admin:');
  console.log('1. Modifier ADMIN_EMAILS dans src/types/index.ts');
  console.log('2. Ajouter l\'email dans la liste');
  console.log('3. Redéployer l\'application');
  console.log('4. L\'utilisateur aura accès illimité automatiquement');
};

export default {
  logAdminAccess,
  getAdminBadge,
  getEffectivePlan,
  adminInstructions
}; 