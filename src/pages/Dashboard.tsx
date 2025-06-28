import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  Euro,
  Calendar,
  ArrowRight,
  Eye,
  MapPin
} from 'lucide-react';
import useTripStore from '../store/tripStore';
import useAuth from '../hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Dashboard: React.FC = () => {
  const { trips, loadTrips, isLoading } = useTripStore();
  const { userProfile } = useAuth();

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement du tableau de bord...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête avec salutation */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bonjour {userProfile?.firstName} 👋
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

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total déplacements</h2>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTrips}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <FileText className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Brouillons</h2>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{draftTrips}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Soumis</h2>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{submittedTrips}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payés</h2>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{paidTrips}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/trips/new"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900">Nouveau déplacement</p>
              <p className="text-sm text-gray-500">Créer un déplacement</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 ml-auto group-hover:text-gray-600" />
          </Link>

          <Link
            to="/trips"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900">Tous les déplacements</p>
              <p className="text-sm text-gray-500">Gérer vos déplacements</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 ml-auto group-hover:text-gray-600" />
          </Link>

          <Link
            to="/trips?status=draft"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900">Brouillons</p>
              <p className="text-sm text-gray-500">{draftTrips} en cours</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 ml-auto group-hover:text-gray-600" />
          </Link>
        </div>
      </div>

      {/* Déplacements récents */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Déplacements récents</h2>
            {trips.length > 5 && (
              <Link
                to="/trips"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
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
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer mon premier déplacement
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentTrips.map((trip) => (
              <div key={trip.id} className="p-6 hover:bg-gray-50 transition-colors">
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
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
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
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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
    </div>
  );
};

export default Dashboard; 