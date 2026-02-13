import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  ArrowLeft,
  MapPin,
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useTripStore from '../store/tripStore';
import TripService from '../services/tripService';
import { TripSummary, ExpenseNote } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CATEGORY_LABELS: Record<string, string> = {
  transport_long: 'Transport longue distance',
  transport_short: 'Transport courte distance',
  accommodation: 'Hébergement',
  meals: 'Repas',
  other: 'Autres'
};

const ConsolidatedReports: React.FC = () => {
  const { userProfile } = useAuth();
  const { trips, loadTrips } = useTripStore();
  const [summaries, setSummaries] = useState<(TripSummary & { collaboratorName: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!userProfile?.uid) return;
      setIsLoading(true);
      try {
        await loadTrips(userProfile.uid, userProfile.organizationId);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [userProfile?.uid, userProfile?.organizationId, loadTrips]);

  useEffect(() => {
    const loadSummaries = async () => {
      if (!trips.length) {
        setSummaries([]);
        return;
      }
      const tripService = new TripService();
      const results = await Promise.all(
        trips.map(async (trip) => {
          const summary = await tripService.getTripSummary(trip.id);
          if (!summary) return null;
          const collaboratorName = `${summary.collaborator?.firstName || ''} ${summary.collaborator?.lastName || ''}`.trim() || 'Inconnu';
          return { ...summary, collaboratorName };
        })
      );
      setSummaries(results.filter((r): r is TripSummary & { collaboratorName: string } => r !== null));
    };
    loadSummaries();
  }, [trips]);

  if (!userProfile) return null;

  const hasOrganization = !!userProfile.organizationId;

  if (!hasOrganization) {
    return (
      <div className="space-y-6">
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8 text-center">
          <BarChart3 className="mx-auto h-16 w-16 text-purple-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Rapports consolidés - Pro Entreprise
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
            Les rapports consolidés regroupent les déplacements et notes de frais de toute votre équipe.
            Rejoignez une équipe ou créez-en une avec le plan Pro Entreprise.
          </p>
          <Link
            to="/team"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Users className="h-4 w-4 mr-2" />
            Gestion d'équipe
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Chargement des rapports...</span>
      </div>
    );
  }

  // Agrégations
  const totalTrips = summaries.length;
  const draftCount = summaries.filter(s => s.status === 'draft').length;
  const submittedCount = summaries.filter(s => s.status === 'submitted').length;
  const paidCount = summaries.filter(s => s.status === 'paid').length;

  const allNotes: (ExpenseNote & { collaboratorName: string })[] = summaries.flatMap(s =>
    s.notes.map(n => ({ ...n, collaboratorName: s.collaboratorName }))
  );

  const totalAmount = allNotes.reduce((sum, n) => sum + Number(n.amount || 0), 0);
  const totalVeloce = allNotes.filter(n => n.isVeloce).reduce((sum, n) => sum + Number(n.amount || 0), 0);
  const totalPersonal = allNotes.filter(n => n.isPersonal).reduce((sum, n) => sum + Number(n.amount || 0), 0);

  const byCategory = allNotes.reduce<Record<string, number>>((acc, n) => {
    const cat = n.category || 'other';
    acc[cat] = (acc[cat] || 0) + Number(n.amount || 0);
    return acc;
  }, {});

  const byCollaborator = summaries.reduce<Record<string, { count: number; amount: number }>>((acc, s) => {
    const name = s.collaboratorName;
    if (!acc[name]) acc[name] = { count: 0, amount: 0 };
    acc[name].count += 1;
    acc[name].amount += s.totalAmount || 0;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-400 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Rapports consolidés
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Vue d'ensemble des déplacements et dépenses de l'équipe
          </p>
        </div>
      </div>

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-100 dark:bg-gray-800 rounded-lg p-6 border border-blue-200 dark:border-gray-700">
          <div className="flex items-center">
            <MapPin className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total déplacements</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTrips}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-gray-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Brouillons</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{draftCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-100 dark:bg-gray-800 rounded-lg p-6 border border-yellow-200 dark:border-gray-700">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Soumis</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{submittedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-100 dark:bg-gray-800 rounded-lg p-6 border border-green-200 dark:border-gray-700">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Payés</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{paidCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Totaux financiers */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Totaux financiers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total général</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalAmount.toFixed(2)} €
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Véloce</p>
            <p className="text-2xl font-bold text-blue-600">{totalVeloce.toFixed(2)} €</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Personnel</p>
            <p className="text-2xl font-bold text-gray-600">{totalPersonal.toFixed(2)} €</p>
          </div>
        </div>
      </div>

      {/* Par catégorie */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Dépenses par catégorie
        </h2>
        <div className="space-y-3">
          {Object.entries(byCategory).map(([cat, amount]) => (
            <div key={cat} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <span className="text-gray-700 dark:text-gray-300">
                {CATEGORY_LABELS[cat] || cat}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {amount.toFixed(2)} €
              </span>
            </div>
          ))}
          {Object.keys(byCategory).length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">Aucune dépense enregistrée</p>
          )}
        </div>
      </div>

      {/* Par collaborateur */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Par collaborateur
        </h2>
        <div className="space-y-3">
          {Object.entries(byCollaborator).map(([name, data]) => (
            <div key={name} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <span className="text-gray-700 dark:text-gray-300">
                {name} <span className="text-sm text-gray-500">({data.count} déplacement{data.count > 1 ? 's' : ''})</span>
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {data.amount.toFixed(2)} €
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Liste des déplacements */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tous les déplacements
        </h2>
        {summaries.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Aucun déplacement dans l'équipe</p>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-600">
            {summaries.map((trip) => (
              <Link
                key={trip.id}
                to={`/trips/${trip.id}`}
                className="flex items-center justify-between py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{trip.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {trip.collaboratorName} • {trip.destination} • {format(new Date(trip.updatedAt), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    trip.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    trip.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {trip.status === 'draft' ? 'Brouillon' : trip.status === 'submitted' ? 'Soumis' : 'Payé'}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {trip.totalAmount?.toFixed(2) || '0.00'} €
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsolidatedReports;
