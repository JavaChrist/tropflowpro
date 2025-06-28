import React, { useState } from 'react';
import ExpenseForm from '../components/ExpenseForm';
import { ExpenseData } from '../components/ExpenseForm';
import AlertModal from '../components/AlertModal';

const Home: React.FC = () => {
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const handleExpenseSubmit = (expense: ExpenseData) => {
    console.log('Nouvelle dépense:', expense);
    // Ici vous pourrez ajouter la logique pour sauvegarder la dépense
    setAlertModal({
      isOpen: true,
      title: 'Dépense ajoutée',
      message: `La dépense "${expense.title}" d'un montant de ${expense.amount}€ a été ajoutée avec succès.`
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Gestionnaire de Dépenses
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Suivez facilement vos dépenses quotidiennes avec notre application simple et intuitive.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulaire de nouvelle dépense */}
            <div>
              <ExpenseForm onSubmit={handleExpenseSubmit} />
            </div>

            {/* Section statistiques rapides */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Statistiques</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Dépenses ce mois</p>
                    <p className="text-2xl font-bold text-green-600">0€</p>
                  </div>
                  <div className="text-green-500">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Nombre de dépenses</p>
                    <p className="text-2xl font-bold text-blue-600">0</p>
                  </div>
                  <div className="text-blue-500">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Catégorie principale</p>
                    <p className="text-lg font-semibold text-purple-600">Aucune</p>
                  </div>
                  <div className="text-purple-500">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button className="w-full bg-gray-800 text-white py-3 px-4 rounded-md hover:bg-gray-900 transition duration-300 font-medium">
                  Voir toutes les dépenses
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de notification */}
        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={() => setAlertModal({ isOpen: false, title: '', message: '' })}
          title={alertModal.title}
          message={alertModal.message}
          type="success"
        />
      </div>
    </div>
  );
};

export default Home;
