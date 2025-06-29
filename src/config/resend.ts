// Configuration pour l'envoi d'emails via API Vercel
export const EMAIL_CONFIG = {
  // Email d'expéditeur (public, pas de problème de sécurité)
  FROM_EMAIL: 'noreply@javachrist.fr',

  // Nom d'expéditeur
  FROM_NAME: 'TripFlow - Gestionnaire de Notes de Frais',

  // URL de l'API (automatiquement détectée)
  API_URL: '/api/send-email'
};

// Fonction pour envoyer un email via l'API serverless
export const sendEmailViaAPI = async (tripData: any, expenseNotes: any[], recipientEmail: string) => {
  const response = await fetch(EMAIL_CONFIG.API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tripData,
      expenseNotes,
      recipientEmail
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }

  return response.json();
};

// Fonction pour vérifier la configuration
export const isEmailConfigured = (): boolean => {
  return EMAIL_CONFIG.FROM_EMAIL.includes('@') && EMAIL_CONFIG.FROM_EMAIL.length > 0;
};

// Fonction de debug pour vérifier la configuration
export const debugEmailConfig = (): void => {
  console.log('🔍 Configuration Email Debug:');
  console.log('From Email:', EMAIL_CONFIG.FROM_EMAIL);
  console.log('API URL:', EMAIL_CONFIG.API_URL);
  console.log('Configuré:', isEmailConfigured() ? '✅ Oui' : '❌ Non');
  console.log('🔒 Sécurité: Les clés API restent côté serveur');
};

export default { sendEmailViaAPI, EMAIL_CONFIG }; 