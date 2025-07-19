import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Crown, XCircle, Loader } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import PlanService from '../services/planService';
import { PlanType } from '../types';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile, updateUserSubscription } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const simulatePaymentVerification = async (paymentId: string, planId: PlanType) => {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const mollieIds = PlanService.generateMollieTestIds();
        const paidSubscription = PlanService.createPaidSubscription(
          planId,
          mollieIds.customerId,
          mollieIds.subscriptionId
        );

        await updateUserSubscription(paidSubscription);

        setStatus('success');
        setMessage(`Votre abonnement ${planId === 'pro_individual' ? 'Pro Individuel' : 'Pro Entreprise'} a été activé avec succès !`);

        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);

      } catch (error) {
        console.error('Erreur lors de la création de l\'abonnement:', error);
        setStatus('error');
        setMessage('Erreur lors de l\'activation de votre abonnement');
      }
    };

        const processPayment = async () => {
      if (isProcessing) return;

      try {
        setIsProcessing(true);
        
        const paymentId = searchParams.get('id') || searchParams.get('payment_id');
        const planId = searchParams.get('plan') as PlanType;

        if (!paymentId && !planId) {
          setStatus('error');
          setMessage('Accès direct non autorisé. Veuillez effectuer un paiement d\'abord.');
          return;
        }

        if (!userProfile) return;

        if (!paymentId || !planId) {
          console.error('Paramètres Mollie manquants');
          setStatus('error');
          setMessage('Retour de paiement invalide. Paramètres manquants.');
          return;
        }

        await simulatePaymentVerification(paymentId, planId);

      } catch (error) {
        console.error('Erreur traitement paiement:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Erreur lors du traitement du paiement');
      } finally {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [searchParams, userProfile, updateUserSubscription, navigate, isProcessing]); // Toutes les dépendances incluses

  const handleContinue = () => {
    navigate('/');
  };

  const handleRetryPayment = () => {
    navigate('/');
  };

  const getPlanName = () => {
    const planId = searchParams.get('plan') as PlanType;
    return PlanService.getPlan(planId)?.name || 'Plan Premium';
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <Loader className="mx-auto h-16 w-16 text-blue-500 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Traitement du paiement...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Nous vérifions votre paiement et activons votre abonnement.
              Veuillez patienter quelques instants.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Erreur de paiement
            </h2>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-300 font-medium mb-2">
                {message}
              </p>
              {message.includes('Paramètres de paiement manquants') && (
                <p className="text-red-700 dark:text-red-400 text-sm">
                  Il semble que le processus de paiement Mollie n'ait pas été complété correctement.
                  Veuillez réessayer ou contacter le support.
                </p>
              )}
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retour au tableau de bord
              </button>
              <button
                onClick={handleRetryPayment}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Réessayer le paiement
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="relative mb-6">
            <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-4" />
            <Crown className="absolute top-0 right-1/2 transform translate-x-6 -translate-y-2 h-8 w-8 text-yellow-500" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Paiement réussi ! 🎉
          </h2>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <p className="text-green-800 dark:text-green-300 font-medium">
              {message}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
              Vos nouveaux avantages :
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>✅ Déplacements illimités</li>
              <li>✅ Export PDF avancé</li>
              <li>✅ Rapports détaillés</li>
              <li>✅ Support prioritaire</li>
              <li>✅ Sauvegarde cloud</li>
            </ul>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Commencer à utiliser {getPlanName()}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Un email de confirmation a été envoyé à votre adresse.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 