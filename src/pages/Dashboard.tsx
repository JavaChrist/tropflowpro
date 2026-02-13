import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  Calendar,
  ArrowRight,
  Eye,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import useTripStore from '../store/tripStore';
import useAuth from '../hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import UsageStats from '../components/UsageStats';
import PlanModal from '../components/PlanModal';
import ContactModal from '../components/ContactModal';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import { PlanType } from '../types';
import PlanService from '../services/planService';

const Dashboard: React.FC = () => {
  const { trips, loadTrips, isLoading } = useTripStore();
  const { userProfile, updateUserSubscription, cancelSubscription } = useAuth();
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [downgradeConfirm, setDowngradeConfirm] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  // Charger les déplacements au montage
  useEffect(() => {
    if (userProfile?.uid) {
      loadTrips(userProfile.uid);
    }
  }, [loadTrips, userProfile?.uid]);

  // Statistiques des déplacements
  const totalTrips = trips.length;
  const draftTrips = trips.filter(t => t.status === 'draft').length;
  const submittedTrips = trips.filter(t => t.status === 'submitted').length;
  const paidTrips = trips.filter(t => t.status === 'paid').length;

  // Déplacements récents (5 derniers)
  const recentTrips = [...trips]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const handleUpgradeClick = () => {
    setIsPlanModalOpen(true);
  };

  const handleSelectPlan = async (planId: PlanType) => {
    if (!userProfile) return;

    try {
      if (planId === 'free') {
        // Vérifier si l'utilisateur a un abonnement payant
        const isPaidUser = userProfile.subscription.planId !== 'free';

        if (isPaidUser) {
          // Demander confirmation pour la rétrogradation
          setIsPlanModalOpen(false);
          setDowngradeConfirm(true);
          return;
        }

        // Utilisateur déjà gratuit, pas de changement nécessaire
        setIsPlanModalOpen(false);
      } else {
        // Upgrade vers un plan premium

        try {
          const response = await fetch('/api/mollie-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'create-checkout',
              planId: planId,
              userEmail: userProfile.email,
              userId: userProfile.uid,
              returnUrl: `${window.location.origin}/payment/success?plan=${planId}`,
              webhookUrl: `${window.location.origin}/api/mollie-payment?webhook=true`
            })
          });

          const result = await response.json();

          if (result.success) {
            window.location.href = result.checkoutUrl;
          } else {
            console.error('Échec API Mollie:', result);
            throw new Error(result.error || 'Erreur lors de la création du checkout');
          }
        } catch (error) {
          console.error('Erreur checkout Mollie:', error);

          if (error instanceof Error && error.message.includes('Failed to fetch')) {
            setAlertModal({
              isOpen: true,
              title: '🌐 Erreur de connexion',
              message: 'Impossible de se connecter au serveur de paiement.\n\nVérifiez votre connexion internet et réessayez.',
              type: 'error'
            });
          } else {
            setAlertModal({
              isOpen: true,
              title: '💳 Erreur de paiement',
              message: 'Une erreur est survenue lors de la création du paiement.\n\nVeuillez réessayer dans quelques instants.',
              type: 'error'
            });
          }
          return;
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du plan:', error);
    }
  };

  const handleDowngradeConfirm = async () => {
    try {
      // Annuler l'abonnement Mollie si il existe
      if (userProfile?.subscription.mollieSubscriptionId) {
        await cancelSubscription();
      } else {
        // Si pas d'abonnement Mollie, juste changer localement
        const freeSubscription = PlanService.createFreeSubscription();
        await updateUserSubscription(freeSubscription);
      }

      setDowngradeConfirm(false);
      console.log('✅ Rétrogradation vers plan gratuit confirmée');
    } catch (error) {
      console.error('❌ Erreur lors de la rétrogradation:', error);
    }
  };

  const handleDowngradeCancel = () => {
    setDowngradeConfirm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'submitted': return 'Soumis';
      case 'paid': return 'Payé';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'submitted': return <Clock className="h-4 w-4" />;
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading || !userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement du tableau de bord...</span>
      </div>
    );
  }



  return (
    <div className="space-y-8">
      {/* Message de correction pour les profils sans abonnement */}
      {userProfile && !userProfile.subscription && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-orange-800 mb-2">
                Mise à jour du profil nécessaire
              </h3>
              <p className="text-orange-700 mb-4">
                Votre profil doit être mis à jour pour accéder aux nouvelles fonctionnalités de TropFlow Pro.
                Cliquez sur le bouton ci-dessous pour effectuer cette mise à jour.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Mettre à jour mon profil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête avec salutation */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Bonjour {userProfile?.firstName}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Voici un aperçu de vos déplacements et notes de frais
          </p>
        </div>
        <Link
          to="/trips/new"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-medium shadow-sm"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouveau déplacement
        </Link>
      </div>

      {/* Grid principal avec statistiques et usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Statistiques des déplacements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              to="/trips"
              className="bg-blue-100 dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg border border-blue-200 dark:border-gray-700 p-6 hover:bg-gray-200 dark:hover:bg-gray-700 hover:-translate-y-1 transition-all duration-200 block cursor-pointer"
            >
              <div className="flex items-center min-w-0">
                <div className="p-2 bg-blue-200 dark:bg-blue-900 rounded-lg flex-shrink-0">
                  <MapPin className="h-6 w-6 text-blue-700 dark:text-blue-400" />
                </div>
                <div className="ml-4 min-w-0 flex-1 overflow-hidden">
                  <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 break-words">Total déplacements</h2>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTrips}</p>
                </div>
              </div>
            </Link>

            <Link
              to="/trips?status=draft"
              className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg border border-gray-300 dark:border-gray-700 p-6 hover:bg-gray-200 dark:hover:bg-gray-700 hover:-translate-y-1 transition-all duration-200 block cursor-pointer"
            >
              <div className="flex items-center">
                <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                  <FileText className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">Brouillons</h2>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{draftTrips}</p>
                </div>
              </div>
            </Link>

            <Link
              to="/trips?status=submitted"
              className="bg-yellow-100 dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg border border-yellow-200 dark:border-gray-700 p-6 hover:bg-gray-200 dark:hover:bg-gray-700 hover:-translate-y-1 transition-all duration-200 block cursor-pointer"
            >
              <div className="flex items-center">
                <div className="p-2 bg-yellow-200 dark:bg-yellow-900 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-700 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">Soumis</h2>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{submittedTrips}</p>
                </div>
              </div>
            </Link>

            <Link
              to="/trips?status=paid"
              className="bg-green-100 dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg border border-green-200 dark:border-gray-700 p-6 hover:bg-gray-200 dark:hover:bg-gray-700 hover:-translate-y-1 transition-all duration-200 block cursor-pointer"
            >
              <div className="flex items-center">
                <div className="p-2 bg-green-200 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-700 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">Payés</h2>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{paidTrips}</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Statistiques d'usage et plan */}
        <div className="lg:col-span-1">
          <UsageStats
            userProfile={userProfile}
            onUpgradeClick={handleUpgradeClick}
          />
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg border border-gray-300 dark:border-gray-700 p-6 hover:bg-gray-200 dark:hover:bg-gray-700 hover:-translate-y-1 transition-all duration-200">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/trips/new"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group hover:-translate-y-1"
          >
            <div className="p-2 bg-blue-200 dark:bg-blue-900 rounded-lg group-hover:bg-blue-300 dark:group-hover:bg-blue-800 transition-colors">
              <Plus className="h-5 w-5 text-blue-700 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900 dark:text-white">Nouveau déplacement</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Créer un déplacement</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 ml-auto group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </Link>

          <Link
            to="/trips"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group hover:-translate-y-1"
          >
            <div className="p-2 bg-green-200 dark:bg-green-900 rounded-lg group-hover:bg-green-300 dark:group-hover:bg-green-800 transition-colors">
              <MapPin className="h-5 w-5 text-green-700 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900 dark:text-white">Tous les déplacements</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gérer vos déplacements</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 ml-auto group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </Link>

          <Link
            to="/trips?status=draft"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group hover:-translate-y-1"
          >
            <div className="p-2 bg-orange-200 dark:bg-orange-900 rounded-lg group-hover:bg-orange-300 dark:group-hover:bg-orange-800 transition-colors">
              <TrendingUp className="h-5 w-5 text-orange-700 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900 dark:text-white">Brouillons</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{draftTrips} en cours</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 ml-auto group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </Link>
        </div>
      </div>

      {/* Déplacements récents */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 hover:-translate-y-1 transition-all duration-200">
        <div className="p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Déplacements récents</h2>
            {trips.length > 5 && (
              <Link
                to="/trips"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center"
              >
                Voir tout
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            )}
          </div>
        </div>

        {recentTrips.length === 0 ? (
          <div className="p-8 text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Aucun déplacement</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Commencez par créer votre premier déplacement.
            </p>
            <div className="mt-6">
              <Link
                to="/trips/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer mon premier déplacement
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-600">
            {recentTrips.map((trip) => (
              <div key={trip.id} className="p-6 hover:shadow-[inset_4px_0_0_0_rgb(59_130_246)] dark:hover:shadow-[inset_4px_0_0_0_rgb(96_165_250)] hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {trip.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status || 'draft')}`}>
                        {getStatusIcon(trip.status || 'draft')}
                        <span className="ml-1">{getStatusLabel(trip.status || 'draft')}</span>
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {trip.destination}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(trip.updatedAt), 'dd MMM yyyy', { locale: fr })}
                      </span>
                      <span>{trip.purpose}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/trips/${trip.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:-translate-y-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal des plans */}
      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        userProfile={userProfile}
        onSelectPlan={handleSelectPlan}
        onOpenContact={() => setIsContactModalOpen(true)}
      />

      {/* Modal de contact */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {/* Confirmation de rétrogradation */}
      <ConfirmModal
        isOpen={downgradeConfirm}
        onClose={handleDowngradeCancel}
        onConfirm={handleDowngradeConfirm}
        title="⚠️ Passer au plan gratuit"
        message={
          <>
            <p className="mb-3">
              <strong>Attention !</strong> Vous allez perdre votre abonnement Pro ({userProfile?.subscription.planId === 'pro_individual' ? 'Individuel' : 'Entreprise'}).
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Conséquences :</strong>
              </p>
              <ul className="text-sm text-red-700 dark:text-red-300 mt-1 space-y-1">
                <li>• Votre abonnement sera <strong>annulé immédiatement</strong></li>
                <li>• Vous serez limité à <strong>10 déplacements maximum</strong></li>
                <li>• Pour repasser au Pro, vous devrez <strong>payer à nouveau</strong></li>
              </ul>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cette action est irréversible. Êtes-vous certain de vouloir continuer ?
            </p>
          </>
        }
        type="danger"
        confirmText="Oui, passer au gratuit"
        cancelText="Non, garder mon abonnement Pro"
      />

      {/* Modal d'alerte moderne */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        buttonText="Compris"
      />
    </div>
  );
};

export default Dashboard; 