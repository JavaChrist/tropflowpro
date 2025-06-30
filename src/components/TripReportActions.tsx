import React, { useState } from 'react';
import { Trip, ExpenseNote } from '../types';
import { generateTripExpenseReport } from '../utils/generatePDF';
import { sendTripReport, TripEmailData } from '../utils/emails';
import { Receipt, X, Download, ExternalLink, Info } from 'lucide-react';
import AlertModal from './AlertModal';

interface TripReportActionsProps {
  trip: Trip;
  expenseNotes: ExpenseNote[];
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

const TripReportActions: React.FC<TripReportActionsProps> = ({
  trip,
  expenseNotes,
  onSuccess,
  onError
}) => {

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [showReceiptsModal, setShowReceiptsModal] = useState(false);
  const [alert, setAlert] = useState({ isOpen: false, title: '', message: '' });

  // Calculer les totaux
  const totalAmount = expenseNotes.reduce((sum, note) => sum + note.amount, 0);
  const totalVeloce = expenseNotes.filter(note => note.isVeloce).reduce((sum, note) => sum + note.amount, 0);
  const totalPersonal = expenseNotes.filter(note => note.isPersonal).reduce((sum, note) => sum + note.amount, 0);
  const notesWithReceipts = expenseNotes.filter(note => note.receiptUrl).length;

  // Envoyer email avec factures
  const handleSendEmail = async () => {
    if (!recipientEmail) {
      onError?.('Veuillez saisir une adresse email');
      return;
    }

    setIsSendingEmail(true);
    try {
      const tripData: TripEmailData = {
        trip,
        expenseNotes,
        totalAmount,
        totalVeloce,
        totalPersonal
      };

      const success = await sendTripReport(recipientEmail, tripData);

      if (success) {
        // Email envoyé avec succès - pas de message de confirmation
        setRecipientEmail('');
      } else {
        onError?.('❌ Erreur lors de l\'envoi de l\'email');
      }
    } catch (error) {
      console.error('Erreur email:', error);
      onError?.('❌ Erreur lors de l\'envoi de l\'email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Générer PDF seulement (pour débugger)
  const handleGeneratePDFOnly = async () => {
    setIsGeneratingPDF(true);
    try {
      const result = await generateTripExpenseReport(
        trip.id,
        expenseNotes,
        {
          name: trip.name,
          destination: trip.destination,
          departureDate: trip.departureDate,
          returnDate: trip.returnDate,
          contractNumber: trip.contractNumber,
          collaborator: trip.collaborator,
          remarks: trip.remarks
        },
        {
          title: `Rapport de frais - ${trip.name}`,
          filename: `rapport-${trip.name.replace(/\s+/g, '-')}.pdf`,
          downloadReceipts: false // PAS de factures
        }
      );

      if (result.success) {
        onSuccess?.('✅ PDF généré avec succès (sans factures)');
      } else {
        onError?.('❌ Erreur lors de la génération du PDF');
      }
    } catch (error) {
      console.error('Erreur PDF seulement:', error);
      onError?.('❌ Erreur lors de la génération du PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Télécharger factures seulement (nouvelle modale harmonisée)
  const handleDownloadReceipts = () => {
    setShowReceiptsModal(true);
  };

  const handleDownloadPDF = async () => {
    if (!trip || expenseNotes.length === 0) {
      setAlert({
        isOpen: true,
        title: 'Aucune donnée',
        message: 'Aucun déplacement ou note de frais à exporter.'
      });
      return;
    }

    setIsGeneratingPDF(true);
    setAlert({ isOpen: false, title: '', message: '' });

    try {
      console.log('🚀 Génération du rapport PDF...');

      const result = await generateTripExpenseReport(
        trip.id,
        expenseNotes,
        {
          name: trip.name,
          destination: trip.destination,
          departureDate: trip.departureDate,
          returnDate: trip.returnDate,
          contractNumber: trip.contractNumber || 'N/A',
          collaborator: trip.collaborator,
          remarks: trip.remarks
        },
        {
          filename: `rapport-frais-${trip.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
          downloadReceipts: true
        }
      );

      if (result.success) {
        const message = result.receipts.length > 0
          ? `✅ Rapport PDF généré avec succès !\n\n📎 ${result.receipts.length} facture(s) ont été ouvertes dans de nouveaux onglets.\n\n💡 Conseil : Dans chaque onglet, utilisez "Enregistrer sous" (Ctrl+S) pour télécharger la facture avec le bon nom.`
          : '✅ Rapport PDF généré avec succès !';

        setAlert({
          isOpen: true,
          title: 'Export réussi',
          message
        });
      } else {
        setAlert({
          isOpen: true,
          title: 'Erreur d\'export',
          message: '❌ Une erreur est survenue lors de la génération du rapport. Vérifiez la console pour plus de détails.'
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la génération:', error);
      setAlert({
        isOpen: true,
        title: 'Erreur d\'export',
        message: `❌ Erreur lors de la génération du rapport: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Actions du rapport de frais
        </h3>

        {/* Résumé */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400">Notes de frais</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {expenseNotes.length}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400">Montant total</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalAmount)}
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <div className="text-sm text-orange-600 dark:text-orange-400">Factures</div>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {notesWithReceipts}/{expenseNotes.length}
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="text-sm text-purple-600 dark:text-purple-400">Véloce</div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalVeloce)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Générer PDF */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {/* Boutons séparés pour débugger */}
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-600">
              <div className="flex gap-3">
                <button
                  onClick={() => handleGeneratePDFOnly()}
                  disabled={isGeneratingPDF || expenseNotes.length === 0}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  PDF Rapport
                </button>
                <button
                  onClick={() => handleDownloadReceipts()}
                  disabled={isGeneratingPDF || notesWithReceipts === 0}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Télécharge les vraies factures (PDF/PNG)"
                >
                  Factures
                </button>
              </div>
            </div>
          </div>

          {/* Envoyer par email */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Envoyer par email avec factures
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {window.location.hostname === 'localhost'
                  ? `Mode développement : Simulation avec liens vers les factures (${notesWithReceipts} fichiers)`
                  : `Email professionnel avec rapport PDF + toutes les factures en pièces jointes (${notesWithReceipts} fichiers)`
                }
              </p>
            </div>

            <div className="flex gap-3">
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="adresse@email.com"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail || !recipientEmail || expenseNotes.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSendingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Envoi...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Informations */}
          {expenseNotes.length === 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="font-medium">Aucune note de frais</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Ajoutez des notes de frais pour pouvoir générer un rapport.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modale des factures harmonisée */}
      <ReceiptsModal
        isOpen={showReceiptsModal}
        onClose={() => setShowReceiptsModal(false)}
        trip={trip}
        expenseNotes={expenseNotes}
      />

      {/* Alert Modal pour les notifications */}
      <AlertModal
        isOpen={alert.isOpen}
        onClose={() => setAlert({ isOpen: false, title: '', message: '' })}
        title={alert.title}
        message={alert.message}
        type={alert.title.includes('réussi') ? 'success' : 'error'}
      />
    </>
  );
};

// Composant modal pour les factures (style harmonisé)
const ReceiptsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  expenseNotes: ExpenseNote[];
}> = ({ isOpen, onClose, trip, expenseNotes }) => {
  if (!isOpen) return null;

  // Filtrer les notes avec factures
  const notesWithFiles = expenseNotes.filter(note => note.receiptUrl);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const downloadReceipt = async (url: string, fileName: string) => {
    try {
      const { forceDownloadWithName } = await import('../utils/generatePDF');
      await forceDownloadWithName(url, fileName);
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Factures de "{trip.name}"
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Info */}
          <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                  {notesWithFiles.length} facture(s) trouvée(s)
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  🔵 <strong>"Ouvrir"</strong> pour visualiser dans un nouvel onglet<br />
                  🟢 <strong>"Télécharger"</strong> pour sauvegarder avec le bon nom<br />
                  ⌨️ <strong>Ctrl+S</strong> dans l'onglet pour sauvegarder manuellement
                </p>
              </div>
            </div>
          </div>

          {/* Liste des factures */}
          {notesWithFiles.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Aucune facture trouvée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notesWithFiles.map((note, index) => {
                const cleanDescription = note.description.replace(/[^a-zA-Z0-9\-_]/g, '');
                let extension = 'pdf';
                if (note.receiptUrl!.includes('.png')) extension = 'png';
                if (note.receiptUrl!.includes('.jpg') || note.receiptUrl!.includes('.jpeg')) extension = 'jpg';

                const fileName = `${trip.name}-${cleanDescription}-${index + 1}.${extension}`;

                return (
                  <div key={note.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {note.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {fileName}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(note.amount)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <a
                        href={note.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ouvrir
                      </a>
                      <button
                        onClick={() => downloadReceipt(note.receiptUrl!, fileName)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-md transition-colors"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Télécharger
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripReportActions; 