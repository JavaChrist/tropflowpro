import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import TravelInfoForm from '../components/forms/TravelInfoForm';
import ExpenseItemForm from '../components/forms/ExpenseItemForm';
import useExpenseStore, { SimplifiedTravelInfo, ExpenseItem } from '../store/expenseStore';
import useAuth from '../hooks/useAuth';
import ConfirmModal from '../components/ConfirmModal';

const NewExpense: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    expenseId: string;
    description: string;
  }>({
    isOpen: false,
    expenseId: '',
    description: ''
  });

  const { userProfile, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    currentReport,
    setTravelInfo,
    addExpense,
    deleteExpense,
    saveReport,
    clearCurrentReport,
    isLoading,
    error
  } = useExpenseStore();

  // Rediriger si non authentifié (mais seulement après le chargement)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Effacer le rapport au montage du composant
  useEffect(() => {
    clearCurrentReport();
  }, [clearCurrentReport]);

  const handleTravelInfoSubmit = (travelInfo: SimplifiedTravelInfo) => {
    if (!userProfile) {
      console.error('Profil utilisateur non disponible');
      return;
    }

    setTravelInfo(travelInfo, userProfile);
    setCurrentStep(2);
  };

  const handleAddExpense = (expense: Omit<ExpenseItem, 'id'>) => {
    addExpense(expense);
    setShowExpenseForm(false);
  };

  const handleDeleteExpenseClick = (id: string, description: string) => {
    setConfirmDelete({
      isOpen: true,
      expenseId: id,
      description
    });
  };

  const handleDeleteConfirm = () => {
    deleteExpense(confirmDelete.expenseId);
    setConfirmDelete({ isOpen: false, expenseId: '', description: '' });
  };

  const handleDeleteCancel = () => {
    setConfirmDelete({ isOpen: false, expenseId: '', description: '' });
  };

  const handleSaveReport = async () => {
    if (!userProfile) {
      console.error('Profil utilisateur non disponible');
      return;
    }

    try {
      setIsSaving(true);
      const reportId = await saveReport(userProfile.uid);
      navigate(`/expense/${reportId}`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const totalAmount = currentReport.totalAmount || 0;
  const totalVeloce = currentReport.totalVeloce || 0;
  const totalPersonal = currentReport.totalPersonal || 0;
  const expenses = currentReport.expenses || [];

  // Afficher un spinner pendant le chargement de l'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Rediriger si non authentifié
  if (!isAuthenticated) {
    return null; // Le useEffect redirigera
  }

  // Afficher un spinner si le profil n'est pas encore chargé
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Nouvelle note de frais
              </h1>
            </div>

            {/* Indicateurs d'étapes */}
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                  {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:block">Informations</span>
              </div>

              <div className="w-8 h-0.5 bg-gray-200"></div>

              <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:block">Dépenses</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {currentStep === 1 && (
            <TravelInfoForm
              initialData={currentReport.travelInfo}
              onSubmit={handleTravelInfoSubmit}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Gestion des dépenses
                  </h2>
                  <p className="text-gray-600">
                    Ajoutez vos frais de déplacement et téléchargez vos justificatifs
                  </p>

                  {/* Informations du rapport */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-900">Collaborateur:</span>
                        <span className="ml-2 text-blue-800">
                          {currentReport.collaborator?.firstName} {currentReport.collaborator?.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-900">Contrat:</span>
                        <span className="ml-2 text-blue-800">{currentReport.contractNumber}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-900">Destination:</span>
                        <span className="ml-2 text-blue-800">{currentReport.travelInfo?.destination}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-900">Période:</span>
                        <span className="ml-2 text-blue-800">
                          {currentReport.travelInfo?.departure.date} au {currentReport.travelInfo?.return.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liste des dépenses */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dépenses ({expenses.length})
                    </h3>
                    <button
                      onClick={() => setShowExpenseForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200"
                    >
                      Ajouter une dépense
                    </button>
                  </div>

                  {expenses.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg mb-2">Aucune dépense ajoutée</p>
                      <p className="text-sm">Cliquez sur "Ajouter une dépense" pour commencer</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {expenses.map((expense: ExpenseItem) => (
                        <div key={expense.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-medium text-gray-900">{expense.description}</h4>
                                <span className="text-sm text-gray-500">
                                  {expense.subcategory}
                                </span>
                                {expense.isVeloce && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    VELOCE
                                  </span>
                                )}
                                {expense.isPersonal && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                    Personnel
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>Date: {expense.date}</span>
                                <span className="font-medium text-gray-900">{Number(expense.amount || 0).toFixed(2)} €</span>
                                {expense.receiptName && (
                                  <span className="text-blue-600">📎 {expense.receiptName}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleDeleteExpenseClick(expense.id, expense.description)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totaux */}
                {expenses.length > 0 && (
                  <div className="border-t border-gray-200 pt-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 mb-1">Total général</p>
                        <p className="text-2xl font-bold text-blue-900">{Number(totalAmount || 0).toFixed(2)} €</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 mb-1">VELOCE</p>
                        <p className="text-2xl font-bold text-green-900">{Number(totalVeloce || 0).toFixed(2)} €</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-sm text-orange-600 mb-1">Personnel</p>
                        <p className="text-2xl font-bold text-orange-900">{Number(totalPersonal || 0).toFixed(2)} €</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between pt-6">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Retour aux informations
                  </button>

                  <button
                    onClick={handleSaveReport}
                    disabled={expenses.length === 0 || isSaving || isLoading}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    {isSaving || isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sauvegarde...
                      </div>
                    ) : (
                      'Enregistrer la note de frais'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'ajout de dépense */}
      {showExpenseForm && (
        <ExpenseItemForm
          onAddExpense={handleAddExpense}
          onClose={() => setShowExpenseForm(false)}
        />
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la dépense"
        message={`Êtes-vous sûr de vouloir supprimer la dépense "${confirmDelete.description}" ?`}
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
};

export default NewExpense; 