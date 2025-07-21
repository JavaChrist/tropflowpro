import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Hash, Save, AlertCircle, Shield, Trash2, CreditCard } from 'lucide-react';
import useAuth from '../hooks/useAuth';


interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSettingsFormData {
  firstName: string;
  lastName: string;
  contractNumber: string;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { userProfile, updateUserProfile, cancelSubscription, deleteAccount, isLoading, error } = useAuth();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<UserSettingsFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      contractNumber: '',
    }
  });

  // Charger les données utilisateur quand le modal s'ouvre ET quand le profil change
  React.useEffect(() => {
    if (isOpen && userProfile) {
      // Force les valeurs dans les champs
      setValue('firstName', userProfile.firstName || '');
      setValue('lastName', userProfile.lastName || '');
      setValue('contractNumber', userProfile.contractNumber || '');

      // Reset aussi pour la cohérence
      reset({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        contractNumber: userProfile.contractNumber || '',
      });
    }
  }, [isOpen, userProfile, reset, setValue]);

  const onSubmit = async (data: UserSettingsFormData) => {
    try {
      await updateUserProfile(data);
      setSaveMessage('Informations mises à jour avec succès !');
      setTimeout(() => {
        setSaveMessage(null);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription();
      setSaveMessage('Abonnement annulé avec succès. Vous restez en version gratuite.');
      setShowCancelConfirm(false);
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'SUPPRIMER') {
      return;
    }

    try {
      await deleteAccount();
      // L'utilisateur sera automatiquement déconnecté
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setShowDeleteConfirm(false);
      setConfirmText('');
    }
  };

  const isPremiumUser = userProfile?.subscription.planId !== 'free';
  const hasActiveSubscription = userProfile?.subscription.mollieSubscriptionId;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Mes informations
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body avec scroll */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {saveMessage && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
              <div className="flex">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800 dark:text-green-300">{saveMessage}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Prénom et Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <User className="inline h-4 w-4 mr-1" />
                  Prénom
                </label>
                <input
                  type="text"
                  {...register('firstName', {
                    required: 'Le prénom est obligatoire'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Jean"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  {...register('lastName', {
                    required: 'Le nom est obligatoire'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Dupont"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Numéro de contrat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Hash className="inline h-4 w-4 mr-1" />
                Numéro de contrat
              </label>
              <input
                type="text"
                {...register('contractNumber', {
                  required: 'Le numéro de contrat est obligatoire'
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="CNT-2024-001"
              />
              {errors.contractNumber && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contractNumber.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Ce numéro apparaîtra sur toutes vos notes de frais
              </p>
            </div>

            {/* Email (lecture seule) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Adresse email
              </label>
              <input
                type="email"
                value={userProfile?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                L'adresse email ne peut pas être modifiée
              </p>
            </div>

            {/* Danger Zone */}
            <div className="mt-8 pt-6 border-t border-red-200 dark:border-red-800">
              <h3 className="text-lg font-medium text-red-900 dark:text-red-400 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Zone de danger
              </h3>

              {/* Annuler l'abonnement */}
              {isPremiumUser && hasActiveSubscription && (
                <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-orange-900 dark:text-orange-400 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Annuler l'abonnement
                      </h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        Vous repasserez automatiquement en version gratuite. Vos données seront conservées.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(true)}
                      className="ml-4 px-3 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors"
                    >
                      Annuler l'abonnement
                    </button>
                  </div>
                </div>
              )}

              {/* Supprimer le compte */}
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900 dark:text-red-400 flex items-center">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer définitivement le compte
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="ml-4 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                  >
                    Supprimer le compte
                  </button>
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de confirmation annulation abonnement */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Confirmer l'annulation
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Êtes-vous sûr de vouloir annuler votre abonnement ? Vous repasserez en version gratuite mais conserverez vos données.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md transition-colors"
              >
                Garder l'abonnement
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Annulation...' : 'Confirmer l\'annulation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation suppression compte */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-medium text-red-900 dark:text-red-400 mb-4">
              ⚠️ Supprimer définitivement le compte
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Cette action supprimera <strong>définitivement</strong> votre compte et toutes vos données. Cette action est <strong>irréversible</strong>.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Pour confirmer, tapez <strong>SUPPRIMER</strong> dans le champ ci-dessous :
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Tapez SUPPRIMER"
              className="w-full px-3 py-2 border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent mb-6"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConfirmText('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading || confirmText !== 'SUPPRIMER'}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSettingsModal; 