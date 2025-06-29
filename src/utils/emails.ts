import { ExpenseNote, Trip } from '../types';
import { ReceiptAttachment, fetchAllReceipts } from './generatePDF';
import { sendEmailViaAPI, EMAIL_CONFIG, isEmailConfigured } from '../config/resend';

// Types pour les emails
export interface EmailData {
  to: string;
  subject: string;
  body: string;
  attachments?: ReceiptAttachment[];
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

// Interface pour les données d'email de déplacement
export interface TripEmailData {
  trip: Trip;
  expenseNotes: ExpenseNote[];
  totalAmount: number;
  totalVeloce: number;
  totalPersonal: number;
}

// Fonction pour valider un email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Fonction pour formater un email de dépense
export const formatExpenseEmail = (expenseData: {
  title: string;
  amount: number;
  date: string;
  category: string;
}): EmailTemplate => {
  const subject = `Nouvelle dépense : ${expenseData.title}`;
  const body = `
    Bonjour,
    
    Une nouvelle dépense a été enregistrée :
    
    • Titre : ${expenseData.title}
    • Montant : ${expenseData.amount}€
    • Date : ${expenseData.date}
    • Catégorie : ${expenseData.category}
    
    Cordialement,
    Votre gestionnaire de dépenses
  `;

  return { subject, body };
};

// Fonction pour formater un email de rapport mensuel
export const formatMonthlyReportEmail = (reportData: {
  month: string;
  totalExpenses: number;
  expenseCount: number;
  topCategory: string;
}): EmailTemplate => {
  const subject = `Rapport mensuel des dépenses - ${reportData.month}`;
  const body = `
    Bonjour,
    
    Voici votre rapport mensuel des dépenses pour ${reportData.month} :
    
    • Total des dépenses : ${reportData.totalExpenses}€
    • Nombre de dépenses : ${reportData.expenseCount}
    • Catégorie principale : ${reportData.topCategory}
    
    Consultez votre application pour plus de détails.
    
    Cordialement,
    Votre gestionnaire de dépenses
  `;

  return { subject, body };
};

// Fonction pour formater un email de rapport de déplacement
export const formatTripReportEmail = (tripData: TripEmailData): EmailTemplate => {
  const subject = `Rapport de frais - ${tripData.trip.name} (${tripData.trip.destination})`;

  const body = `
    Bonjour,
    
    Veuillez trouver ci-joint le rapport de frais pour le déplacement suivant :
    
    📍 **INFORMATIONS DU DÉPLACEMENT**
    • Destination : ${tripData.trip.destination}
    • Objet : ${tripData.trip.purpose}
    • Dates : du ${new Date(tripData.trip.departureDate).toLocaleDateString('fr-FR')} au ${new Date(tripData.trip.returnDate).toLocaleDateString('fr-FR')}
    • Collaborateur : ${tripData.trip.collaborator.firstName} ${tripData.trip.collaborator.lastName}
    
    💰 **RÉSUMÉ FINANCIER**
    • Nombre de notes de frais : ${tripData.expenseNotes.length}
    • Montant total : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(tripData.totalAmount)}
    • Montant Véloce : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(tripData.totalVeloce)}
    • Montant personnel : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(tripData.totalPersonal)}
    
    📋 **DÉTAIL DES NOTES DE FRAIS**
    ${tripData.expenseNotes.map((note, index) => `
    ${index + 1}. ${note.description}
       • Catégorie : ${note.category}
       • Montant : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(note.amount)}
       • Date : ${new Date(note.date).toLocaleDateString('fr-FR')}
       • Facture : ${note.receiptUrl ? '✓ Disponible' : '✗ Manquante'}${note.receiptUrl ? `
       • Lien : ${note.receiptUrl}` : ''}
    `).join('')}
    
    ${tripData.expenseNotes.filter(note => note.receiptUrl).length > 0 ?
      `🔗 **FACTURES DISPONIBLES** : ${tripData.expenseNotes.filter(note => note.receiptUrl).length} fichier(s) accessible(s) via les liens ci-dessus` :
      '⚠️ **ATTENTION** : Aucune facture jointe à ce rapport'
    }
    
    Cordialement,
    TripFlow - Gestionnaire de Notes de Frais
  `;

  return { subject, body };
};

// Fonction pour formater un email de note de frais individuelle
export const formatExpenseNoteEmail = (expenseNote: ExpenseNote, trip: Trip): EmailTemplate => {
  const subject = `Note de frais - ${expenseNote.description} (${trip.destination})`;

  const body = `
    Bonjour,
    
    Une nouvelle note de frais a été enregistrée pour le déplacement "${trip.name}" :
    
    📍 **DÉPLACEMENT**
    • Destination : ${trip.destination}
    • Objet : ${trip.purpose}
    
    💰 **DÉTAIL DE LA NOTE**
    • Description : ${expenseNote.description}
    • Catégorie : ${expenseNote.category}
    • Sous-catégorie : ${expenseNote.subcategory}
    • Montant : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(expenseNote.amount)}
    • Date : ${new Date(expenseNote.date).toLocaleDateString('fr-FR')}
    • Véloce : ${expenseNote.isVeloce ? 'Oui' : 'Non'}
    • Personnel : ${expenseNote.isPersonal ? 'Oui' : 'Non'}
    
    📄 **FACTURE** : ${expenseNote.receiptUrl ? '✓ Jointe en pièce jointe' : '✗ Aucune facture'}
    
    Cordialement,
    TripFlow - Gestionnaire de Notes de Frais
  `;

  return { subject, body };
};

// Fonction pour créer un email avec un reçu en pièce jointe
export const createReceiptEmail = (
  recipientEmail: string,
  expenseData: {
    title: string;
    amount: number;
    date: string;
    category: string;
  },
  receiptAttachment?: ReceiptAttachment
): EmailData => {
  const template = formatExpenseEmail(expenseData);

  return {
    to: recipientEmail,
    subject: template.subject,
    body: template.body,
    attachments: receiptAttachment ? [receiptAttachment] : undefined
  };
};

// Fonction pour créer un email de rapport de déplacement avec factures
export const createTripReportEmail = async (
  recipientEmail: string,
  tripData: TripEmailData
): Promise<EmailData> => {
  const template = formatTripReportEmail(tripData);

  // SOLUTION CORS: Ne pas télécharger les factures, juste envoyer les liens
  // Les factures sont accessibles via leurs URLs Firebase publiques
  console.log('📧 Email sans pièces jointes (problème CORS contourné)');
  console.log('🔗 Les factures seront accessibles via leurs liens dans l\'email');

  return {
    to: recipientEmail,
    subject: template.subject,
    body: template.body,
    attachments: [] // Pas de pièces jointes à cause des problèmes CORS
  };
};

// Fonction pour créer un email de note de frais individuelle avec facture
export const createExpenseNoteEmail = async (
  recipientEmail: string,
  expenseNote: ExpenseNote,
  trip: Trip
): Promise<EmailData> => {
  const template = formatExpenseNoteEmail(expenseNote, trip);

  // Récupérer la facture si elle existe
  const receipts = expenseNote.receiptUrl ? await fetchAllReceipts([expenseNote]) : [];

  return {
    to: recipientEmail,
    subject: template.subject,
    body: template.body,
    attachments: receipts
  };
};

// Fonction pour envoyer un email (intelligent: API Vercel ou simulation)
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    console.log('📧 Envoi d\'email en cours...', {
      to: emailData.to,
      subject: emailData.subject,
      attachments: emailData.attachments?.length || 0
    });

    // Détecter l'environnement de production
    const hostname = window.location.hostname;
    const isProduction = hostname.includes('vercel.app') ||
      hostname.includes('tropflow') ||
      (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.'));

    if (isProduction) {
      console.log('🌐 Environnement de production détecté - Utilisation de l\'API Vercel');
      // En production, on utilisera l'API Vercel (implémenté dans sendTripReport)
      return false; // Cette fonction n'est pas utilisée directement en production
    } else {
      console.log('🔧 Environnement de développement détecté - Mode simulation');

      // Mode simulation pour le développement local
      console.warn('🔄 Mode simulation activé pour le développement local');
      console.log('✉️ Email qui serait envoyé:');
      console.log(`  📤 De: ${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`);
      console.log(`  📥 À: ${emailData.to}`);
      console.log(`  📋 Sujet: ${emailData.subject}`);
      console.log(`  📎 Pièces jointes: ${emailData.attachments?.length || 0}`);
      console.log('📧 Corps de l\'email:');
      console.log(emailData.body);

      // Simulation d'envoi
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Email simulé envoyé avec succès (mode développement)');
      return true;
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    return false;
  }
};

// Fonction pour envoyer un rapport complet de déplacement
export const sendTripReport = async (
  recipientEmail: string,
  tripData: TripEmailData
): Promise<boolean> => {
  try {
    // Détecter l'environnement de production (Vercel ou autre domaine de production)
    const hostname = window.location.hostname;
    const isProduction = hostname.includes('vercel.app') ||
      hostname.includes('tropflow') ||
      (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.'));

    if (isProduction) {
      console.log('🌐 Envoi via API Vercel (production)');

      // Préparer les données pour l'API Vercel
      const apiData = {
        tripData,
        expenseNotes: tripData.expenseNotes,
        recipientEmail
      };

      // Appeler l'API Vercel
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Erreur API Vercel:', result);
        return false;
      }

      console.log('✅ Email envoyé via API Vercel. ID:', result.emailId);
      console.log(`📎 ${result.receiptsCount} factures jointes`);
      return true;

    } else {
      console.log('🔧 Mode développement - Simulation détaillée');

      // Mode simulation détaillé pour le développement
      const emailData = await createTripReportEmail(recipientEmail, tripData);
      return await sendEmail(emailData);
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi du rapport de déplacement:', error);
    return false;
  }
};

// Fonction pour envoyer une notification de note de frais
export const sendExpenseNoteNotification = async (
  recipientEmail: string,
  expenseNote: ExpenseNote,
  trip: Trip
): Promise<boolean> => {
  try {
    const emailData = await createExpenseNoteEmail(recipientEmail, expenseNote, trip);
    return await sendEmail(emailData);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
    return false;
  }
};

// Fonction de test pour vérifier la configuration Email
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    console.log('🧪 Test de connexion Email...');

    if (!isEmailConfigured()) {
      console.error('❌ Configuration email manquante');
      return false;
    }

    console.log('✅ Configuration email valide');
    console.log('📧 Email configuré:', EMAIL_CONFIG.FROM_EMAIL);
    console.log('🔒 Les clés API sont sécurisées côté serveur');

    // Détecter l'environnement de production
    const hostname = window.location.hostname;
    const isProduction = hostname.includes('vercel.app') ||
      hostname.includes('tropflow') ||
      (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.'));

    if (!isProduction) {
      console.log('🔧 Mode développement - Test simulé');
      console.log('✅ Configuration validée : Prêt pour l\'envoi via API serverless');
      return true;
    }

    // En production, on pourrait faire un test réel via l'API
    console.log('🌐 Production - Configuration prête');
    return true;

  } catch (error) {
    console.error('❌ Erreur test Email:', error);
    return false;
  }
};

const emailUtils = {
  validateEmail,
  formatExpenseEmail,
  formatMonthlyReportEmail,
  formatTripReportEmail,
  formatExpenseNoteEmail,
  sendEmail,
  createReceiptEmail,
  createTripReportEmail,
  createExpenseNoteEmail,
  sendTripReport,
  sendExpenseNoteNotification,
  testEmailConnection
};

export default emailUtils;
