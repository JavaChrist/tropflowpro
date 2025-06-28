import { Resend } from 'resend';

// Configuration Resend
export const RESEND_CONFIG = {
  // Clé API Resend - À définir dans les variables d'environnement
  // ou remplacer directement par votre clé API
  API_KEY: process.env.REACT_APP_RESEND_API_KEY || 'your-resend-api-key-here',

  // Email d'expéditeur vérifié sur Resend
  FROM_EMAIL: process.env.REACT_APP_FROM_EMAIL || 'noreply@votre-domaine.com',

  // Nom d'expéditeur
  FROM_NAME: 'TripFlow - Gestionnaire de Notes de Frais'
};

// Instance Resend
export const resend = new Resend(RESEND_CONFIG.API_KEY);

// Fonction pour vérifier la configuration
export const isResendConfigured = (): boolean => {
  return (
    RESEND_CONFIG.API_KEY !== 'your-resend-api-key-here' &&
    RESEND_CONFIG.API_KEY.length > 0 &&
    RESEND_CONFIG.FROM_EMAIL !== 'noreply@votre-domaine.com'
  );
};

// Fonction de debug pour vérifier la configuration
export const debugResendConfig = (): void => {
  console.log('🔍 Configuration Resend Debug:');
  console.log('API Key présente:', RESEND_CONFIG.API_KEY ? '✅ Oui' : '❌ Non');
  console.log('API Key format:', RESEND_CONFIG.API_KEY?.startsWith('re_') ? '✅ Correct' : '❌ Incorrect');
  console.log('From Email:', RESEND_CONFIG.FROM_EMAIL);
  console.log('Configuré:', isResendConfigured() ? '✅ Oui' : '❌ Non');

  if (!isResendConfigured()) {
    console.log('📝 Actions requises:');
    if (RESEND_CONFIG.API_KEY === 'your-resend-api-key-here') {
      console.log('  1. Remplacez la clé API dans .env.local');
    }
    if (RESEND_CONFIG.FROM_EMAIL === 'noreply@votre-domaine.com') {
      console.log('  2. Configurez un email expéditeur valide');
    }
  }
};

export default resend; 