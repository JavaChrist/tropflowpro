import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  FileText,
  Clock,
  CheckCircle
} from 'lucide-react';
import useTripStore from '../store/tripStore';
import useAuth from '../hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ConfirmModal from '../components/ConfirmModal';

const TripList: React.FC = () => {
  const { trips, loadTrips, deleteTrip, isLoading } = useTripStore();
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    tripId: string;
    tripName: string;
  }>({
    isOpen: false,
    tripId: '',
    tripName: ''
  });

  useEffect(() => {
    if (userProfile?.uid) {
      loadTrips(userProfile.uid);
    }
  }, [loadTrips, userProfile?.uid]);

  const handleDeleteClick = (id: string, name: string) => {
    setConfirmDelete({
      isOpen: true,
      tripId: id,
      tripName: name
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteTrip(confirmDelete.tripId);
      setConfirmDelete({ isOpen: false, tripId: '', tripName: '' });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDelete({ isOpen: false, tripId: '', tripName: '' });
  };

  // Filtrage des déplacements
  const filteredTrips = trips.filter(trip => {
    const matchesSearch = !searchTerm ||
      trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'submitted': return 'Soumis';
      case 'paid': return 'Payé';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des déplacements...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">Mes déplacements</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez vos déplacements et leurs notes de frais
          </p>
        </div>
        <div className="flex-shrink-0">
          <Link
            to="/trips/new"
            className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nouveau déplacement</span>
            <span className="sm:hidden">Nouveau</span>
          </Link>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, destination ou objet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Filter className="h-4 w-4 text-gray-400 mr-2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="draft">Brouillons</option>
                <option value="submitted">Soumis</option>
                <option value="paid">Payés</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des déplacements */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {trips.length === 0 ? 'Aucun déplacement' : 'Aucun résultat'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {trips.length === 0
              ? 'Vous n\'avez encore créé aucun déplacement.'
              : 'Aucun déplacement ne correspond à vos critères de recherche.'
            }
          </p>
          {trips.length === 0 && (
            <Link
              to="/trips/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer mon premier déplacement
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredTrips.map((trip) => (
            <div key={trip.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                      {trip.name}
                    </h3>
                    <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">{trip.destination}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${getStatusColor(trip.status || 'draft')}`}>
                    {getStatusIcon(trip.status || 'draft')}
                    <span className="ml-1 hidden sm:inline">{getStatusLabel(trip.status || 'draft')}</span>
                  </span>
                </div>

                <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                  <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{format(new Date(trip.departureDate), 'dd/MM', { locale: fr })} - {format(new Date(trip.returnDate), 'dd/MM/yyyy', { locale: fr })}</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{trip.purpose}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-h-[32px]">
                    <Link
                      to={`/trips/${trip.id}`}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded inline-flex items-center justify-center"
                      title="Voir le déplacement"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Link>
                    {/* Bouton Modifier pour brouillons */}
                    {(trip.status === 'draft' || !trip.status) && (
                      <>
                        <Link
                          to={`/trips/${trip.id}/edit`}
                          className="text-green-600 hover:text-green-900 p-1 rounded inline-flex items-center justify-center"
                          title="Modifier"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(trip.id, trip.name)}
                          className="text-red-600 hover:text-red-900 p-1 rounded inline-flex items-center justify-center"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </>
                    )}
                    {/* Bouton Modifier pour déplacements soumis */}
                    {trip.status === 'submitted' && (
                      <Link
                        to={`/trips/${trip.id}/edit`}
                        className="text-orange-600 hover:text-orange-900 p-1 rounded inline-flex items-center justify-center"
                        title="Modifier (repasse en brouillon)"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Link>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {format(new Date(trip.updatedAt), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Résumé */}
      {filteredTrips.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Résumé</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {filteredTrips.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Déplacements affichés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                {filteredTrips.filter(t => t.status === 'draft').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Brouillons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {filteredTrips.filter(t => t.status === 'submitted').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Soumis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {filteredTrips.filter(t => t.status === 'paid').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Payés</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le déplacement"
        message={`Êtes-vous sûr de vouloir supprimer le déplacement "${confirmDelete.tripName}" et toutes ses notes de frais ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        isLoading={isLoading}
      />
    </div>
  );
};

export default TripList; 