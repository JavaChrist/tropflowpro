import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Trash2,
  Plus,
  Download,
  Send,
  CheckCircle,
  Edit
} from 'lucide-react';
import useTripStore from '../store/tripStore';
import useAuth from '../hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExpenseNote } from '../types';
import ExpenseItemForm from '../components/forms/ExpenseItemForm';
import ConfirmModal from '../components/ConfirmModal';
import TripReportActions from '../components/TripReportActions';
import { generateTripExpenseReport } from '../utils/generatePDF';

// Import du type depuis le store
interface CreateExpenseNoteData {
  category: 'transport_long' | 'transport_short' | 'accommodation' | 'meals' | 'other';
  subcategory: string;
  description: string;
  amount: number;
  date: string;
  receiptUrl?: string;
  receiptName?: string;
  isVeloce: boolean;
  isPersonal: boolean;
}

const TripDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentTrip,
    currentTripNotes,
    loadTrip,
    submitTrip,
    markAsPaid,
    deleteTrip,
    deleteExpenseNote,
    addExpenseNote,
    updateExpenseNote,
    isLoading,
    error
  } = useTripStore();
  const { userProfile } = useAuth();
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingNote, setEditingNote] = useState<ExpenseNote | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    type: 'trip' | 'note';
    tripName?: string;
    noteId?: string;
  }>({
    isOpen: false,
    type: 'trip'
  });
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [reportMessage, setReportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (id) {
      loadTrip(id);
    }
  }, [id, loadTrip]);

  // Mettre à jour le titre de la page pour l'impression
  useEffect(() => {
    if (currentTrip) {
      document.title = `${currentTrip.name} - TropFlow Pro`;
    }
    return () => {
      document.title = 'TropFlow Pro';
    };
  }, [currentTrip]);

  const handleAddExpenseNote = async (noteData: CreateExpenseNoteData) => {
    if (!userProfile || !id) return;

    try {
      if (editingNote) {
        // Mode édition - mettre à jour la note existante
        await updateExpenseNote(editingNote.id, noteData);
        setEditingNote(null);
      } else {
        // Mode ajout - ajouter une nouvelle note
        await addExpenseNote(id, noteData, userProfile);
      }
      setShowExpenseForm(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout/modification:', error);
    }
  };

  const handleEditNoteClick = (note: ExpenseNote) => {
    setEditingNote(note);
    setShowExpenseForm(true);
  };

  const handleCloseExpenseForm = () => {
    setShowExpenseForm(false);
    setEditingNote(null);
  };

  // Grouper les notes par catégorie
  const notesByCategory = currentTripNotes.reduce((acc, note) => {
    if (!acc[note.category]) {
      acc[note.category] = [];
    }
    acc[note.category].push(note);
    return acc;
  }, {} as Record<string, ExpenseNote[]>);

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'transport_long': return 'Transport longue distance';
      case 'transport_short': return 'Transport courte distance';
      case 'accommodation': return 'Hébergement';
      case 'meals': return 'Repas';
      case 'other': return 'Autres';
      default: return category;
    }
  };

  const handleDeleteTripClick = () => {
    setConfirmDelete({
      isOpen: true,
      type: 'trip',
      tripName: currentTrip?.name
    });
  };

  const handleDeleteNoteClick = (noteId: string) => {
    setConfirmDelete({
      isOpen: true,
      type: 'note',
      noteId
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      if (confirmDelete.type === 'trip' && id) {
        await deleteTrip(id);
        navigate('/trips');
      } else if (confirmDelete.type === 'note' && confirmDelete.noteId && id) {
        await deleteExpenseNote(confirmDelete.noteId, id);
      }
      setConfirmDelete({ isOpen: false, type: 'trip' });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDelete({ isOpen: false, type: 'trip' });
  };

  const handleMarkAsPaidClick = () => {
    setConfirmPayment(true);
  };

  const handleMarkAsPaidConfirm = async () => {
    if (id) {
      try {
        await markAsPaid(id);
        setConfirmPayment(false);
      } catch (error) {
        console.error('Erreur lors du marquage:', error);
      }
    }
  };

  const handleMarkAsPaidCancel = () => {
    setConfirmPayment(false);
  };

  const handleReportSuccess = (message: string) => {
    setReportMessage({ type: 'success', text: message });
    setTimeout(() => setReportMessage(null), 5000);
  };

  const handleReportError = (error: string) => {
    setReportMessage({ type: 'error', text: error });
    setTimeout(() => setReportMessage(null), 5000);
  };

  // Fonction pour l'impression simple (PDF sans factures)
  const handleSimplePrint = async () => {
    if (!currentTrip || !id) return;

    try {


      const result = await generateTripExpenseReport(
        id,
        currentTripNotes,
        {
          name: currentTrip.name,
          destination: currentTrip.destination,
          departureDate: currentTrip.departureDate,
          returnDate: currentTrip.returnDate,
          contractNumber: currentTrip.contractNumber || 'N/A',
          collaborator: currentTrip.collaborator,
          remarks: currentTrip.remarks
        },
        {
          filename: `rapport-simple-${currentTrip.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
          downloadReceipts: false // PAS de factures pour l'impression simple
        }
      );

      if (result.success) {
        setReportMessage({
          type: 'success',
          text: '✅ Impression simple générée avec succès ! (PDF sans factures)'
        });
        setTimeout(() => setReportMessage(null), 3000);
      } else {
        setReportMessage({
          type: 'error',
          text: '❌ Erreur lors de l\'impression simple. Vérifiez la console.'
        });
        setTimeout(() => setReportMessage(null), 5000);
      }
    } catch (error) {
      console.error('❌ Erreur impression simple:', error);
      setReportMessage({
        type: 'error',
        text: `❌ Erreur lors de l'impression simple: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
      setTimeout(() => setReportMessage(null), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement du déplacement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-sm text-red-800">{error}</p>
        <Link
          to="/trips"
          className="mt-3 inline-flex items-center text-red-600 hover:text-red-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour aux déplacements
        </Link>
      </div>
    );
  }

  if (!currentTrip || !id) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Déplacement introuvable</h3>
        <p className="mt-1 text-sm text-gray-500">
          Ce déplacement n'existe pas ou a été supprimé.
        </p>
        <div className="mt-6">
          <Link
            to="/trips"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux déplacements
          </Link>
        </div>
      </div>
    );
  }

  const trip = currentTrip;
  const categories = ['transport_long', 'transport_short', 'accommodation', 'meals', 'other'];

  return (
    <div className="space-y-6 print-single-page">
      {/* Header pour l'écran */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-4">
          <Link
            to="/trips"
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {trip.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {trip.destination} • {format(new Date(trip.departureDate), 'dd/MM', { locale: fr })} - {format(new Date(trip.returnDate), 'dd/MM/yyyy', { locale: fr })}
            </p>
          </div>
        </div>
      </div>

      {/* Header pour l'impression */}
      <div className="hidden print:block text-center print-header">
        <div className="flex items-center justify-center mb-2 print:mb-2">
          <div className="relative mr-3">
            {/* Logo TropFlow Pro pour impression */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-12">
              <div className="flex items-center space-x-0.5">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <h1 className="text-3xl font-bold print-logo-text">
            <span className="print-logo-blue">Trip</span>Flow
          </h1>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1 print:text-xl print:mb-1">
          {trip.name}
        </h2>
        <p className="text-gray-600 print:text-sm">
          {trip.destination} • {format(new Date(trip.departureDate), 'dd/MM', { locale: fr })} - {format(new Date(trip.returnDate), 'dd/MM/yyyy', { locale: fr })}
        </p>
      </div>

      {/* Message de notification */}
      {reportMessage && (
        <div className={`p-4 rounded-lg border ${reportMessage.type === 'success'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
          } print:hidden`}>
          <div className="flex items-center">
            {reportMessage.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div className="whitespace-pre-line">{reportMessage.text}</div>
            <button
              onClick={() => setReportMessage(null)}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Actions de rapport avec factures */}
      <TripReportActions
        trip={trip}
        expenseNotes={currentTripNotes}
        onSuccess={handleReportSuccess}
        onError={handleReportError}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6 print:col-span-full print:space-y-3">
          {/* Informations du déplacement - Simplifiées */}
          <div className="bg-gray-800 text-white rounded-lg p-6 print:p-4 print-compact">
            <div className="grid grid-cols-2 gap-4 text-sm print:text-xs print:gap-2">
              <div className="flex">
                <span className="w-32 text-gray-300">Numéro de Contrat</span>
                <span className="text-white">{trip.contractNumber}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-gray-300">Collaborateur</span>
                <span className="text-white">{trip.collaborator?.firstName} {trip.collaborator?.lastName}</span>
              </div>
              {trip.remarks && (
                <div className="flex col-span-2">
                  <span className="w-32 text-gray-300">Remarques</span>
                  <span className="text-white">{trip.remarks}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tableau des frais - Style capture d'écran */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden print-table">
            <div className="p-6 border-b border-gray-200 dark:border-gray-600 print:p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white print:text-base">
                  Frais Prévisionnels
                </h2>
                {(trip.status === 'draft' || !trip.status) && (
                  <button
                    onClick={() => setShowExpenseForm(true)}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 print:hidden"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter une note
                  </button>
                )}
              </div>
            </div>

            {/* Tableau style capture d'écran */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase print:py-2">Frais Prévisionnels</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase print:py-2">Via VELOCE</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase print:py-2">Frais perso</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase print:py-2">Commentaires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categories.map(category => {
                    const categoryNotes = notesByCategory[category] || [];
                    const hasVeloce = categoryNotes.some(note => note.isVeloce);
                    const hasPersonal = categoryNotes.some(note => note.isPersonal);

                    return (
                      <tr key={category} className="bg-gray-50 dark:bg-gray-700">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white print:py-2">
                          {getCategoryName(category)}
                          <br />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({category === 'transport_long' ? 'avion, train, location voiture' :
                              category === 'transport_short' ? 'taxi, métro, bus' :
                                category === 'accommodation' ? 'hôtel, airbnb' :
                                  category === 'meals' ? 'restaurant, repas' : 'autres frais'})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center print:py-2">
                          {hasVeloce ? '☑' : '☐'}
                        </td>
                        <td className="px-4 py-3 text-center print:py-2">
                          {hasPersonal ? '☑' : '☐'}
                        </td>
                        <td className="px-4 py-3 print:py-2">
                          {categoryNotes.length > 0 ? (
                            <div className="space-y-1">
                              {categoryNotes.map(note => {
                                // Nettoyer la description pour éviter la redondance
                                const cleanDescription = note.description
                                  .replace(/^Transport longue distance - /, '')
                                  .replace(/^Transport courte distance - /, '')
                                  .replace(/^Hébergement - /, '')
                                  .replace(/^Repas - /, '')
                                  .replace(/^Autres - /, '');

                                return (
                                  <div key={note.id} className="flex items-center justify-between">
                                    <span className="text-sm dark:text-gray-300">
                                      {cleanDescription} {Number(note.amount || 0).toFixed(2)} €
                                    </span>
                                    {(trip.status === 'draft' || !trip.status) && (
                                      <div className="flex items-center space-x-1 print:hidden">
                                        <button
                                          onClick={() => handleEditNoteClick(note)}
                                          className="text-blue-600 hover:text-blue-800"
                                          title="Modifier"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteNoteClick(note.id)}
                                          className="text-red-600 hover:text-red-800"
                                          title="Supprimer"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-sm">Aucun frais</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total général pour l'impression */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t print:p-3">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-300 print:hidden">
                  Date: {format(new Date(), 'dd/MM/yyyy', { locale: fr })}
                </div>
                {/* Seulement le total général pour l'impression */}
                <div className="hidden print:flex justify-center w-full">
                  <span className="text-lg font-bold text-gray-900">
                    Total général: {Number(trip.totalAmount || 0).toFixed(2)}€
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 print:hidden">
          {/* Résumé financier */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Résumé financier</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Nombre de notes</span>
                <span className="font-medium dark:text-white">{trip.notesCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Total VELOCE</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {Number(trip.totalVeloce || 0).toFixed(2)}€
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Total Personnel</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">
                  {Number(trip.totalPersonal || 0).toFixed(2)}€
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">Total général</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {Number(trip.totalAmount || 0).toFixed(2)}€
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 print:hidden">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
            <div className="space-y-3">
              {/* Actions PDF/Email - Remplacées par TripReportActions */}
              {/* Bouton d'impression basique conservé pour compatibilité */}
              <button
                onClick={handleSimplePrint}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                title="Impression simple (sans factures)"
              >
                <Download className="h-4 w-4 mr-2" />
                Impression simple
              </button>

              {/* Actions de workflow */}
              {(trip.status === 'draft' || !trip.status) && (
                <>
                  <div className="border-t pt-3">
                    <button
                      onClick={() => submitTrip(trip.id)}
                      disabled={currentTripNotes.length === 0}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      title="Soumettre le déplacement"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Soumettre
                    </button>
                  </div>

                  <button
                    onClick={handleDeleteTripClick}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 transition-colors"
                    title="Supprimer le déplacement"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </button>
                </>
              )}

              {/* Bouton pour marquer comme payé */}
              {trip.status === 'submitted' && (
                <div className="border-t pt-3">
                  <button
                    onClick={handleMarkAsPaidClick}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                    title="Marquer comme payé"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marquer comme payé
                  </button>
                </div>
              )}

              {/* Message pour les déplacements payés */}
              {trip.status === 'paid' && (
                <div className="border-t pt-3">
                  <div className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-md">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Déplacement payé
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modal d'ajout/modification de note de frais */}
      {showExpenseForm && (
        <ExpenseItemForm
          onAddExpense={handleAddExpenseNote}
          onClose={handleCloseExpenseForm}
          initialData={editingNote ? {
            category: editingNote.category,
            subcategory: editingNote.subcategory,
            description: editingNote.description,
            amount: editingNote.amount,
            date: editingNote.date,
            isVeloce: editingNote.isVeloce,
            isPersonal: editingNote.isPersonal,
            receiptUrl: editingNote.receiptUrl,
            receiptName: editingNote.receiptName
          } : undefined}
          isEditing={!!editingNote}
        />
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={confirmDelete.type === 'trip' ? 'Supprimer le déplacement' : 'Supprimer la note'}
        message={
          confirmDelete.type === 'trip'
            ? `Êtes-vous sûr de vouloir supprimer le déplacement "${confirmDelete.tripName}" et toutes ses notes ? Cette action est irréversible.`
            : 'Êtes-vous sûr de vouloir supprimer cette note de frais ? Cette action est irréversible.'
        }
        type="danger"
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        isLoading={isLoading}
      />

      {/* Modal de confirmation de paiement */}
      <ConfirmModal
        isOpen={confirmPayment}
        onClose={handleMarkAsPaidCancel}
        onConfirm={handleMarkAsPaidConfirm}
        title="Marquer comme payé"
        message="Confirmer que ce déplacement a été payé ? Il passera au statut 'Payé' et ne pourra plus être modifié."
        type="success"
        confirmText="Marquer comme payé"
        cancelText="Annuler"
        isLoading={isLoading}
      />
    </div>
  );
};

export default TripDetail; 