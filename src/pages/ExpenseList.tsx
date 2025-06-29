import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  FileText,
  Calendar,
  Euro,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import useExpenseStore from '../store/expenseStore';
import useAuth from '../hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ConfirmModal from '../components/ConfirmModal';

const ExpenseList: React.FC = () => {
  const { reports, loadReports, deleteReport, isLoading } = useExpenseStore();
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    reportId: string;
    contractNumber: string;
  }>({
    isOpen: false,
    reportId: '',
    contractNumber: ''
  });

  useEffect(() => {
    if (userProfile?.uid) {
      loadReports(userProfile.uid);
    }
  }, [loadReports, userProfile?.uid]);

  const handleDeleteClick = (id: string, contractNumber: string) => {
    setConfirmDelete({
      isOpen: true,
      reportId: id,
      contractNumber
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteReport(confirmDelete.reportId);
      setConfirmDelete({ isOpen: false, reportId: '', contractNumber: '' });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDelete({ isOpen: false, reportId: '', contractNumber: '' });
  };

  // Filtrage des rapports
  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchTerm ||
      report.travelInfo.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.travelInfo.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.collaborator.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.collaborator.lastName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvée';
      case 'rejected': return 'Rejetée';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des notes de frais...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Mes notes de frais</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez et suivez toutes vos notes de frais de déplacement
          </p>
        </div>
        <div className="flex-shrink-0">
          <Link
            to="/new-expense"
            className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nouvelle note de frais</span>
            <span className="sm:hidden">Nouvelle</span>
          </Link>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par destination, objet ou collaborateur..."
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
                <option value="pending">En attente</option>
                <option value="approved">Approuvées</option>
                <option value="rejected">Rejetées</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des notes de frais */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {reports.length === 0 ? 'Aucune note de frais' : 'Aucun résultat'}
          </h3>
          <p className="text-gray-500 mb-6">
            {reports.length === 0
              ? 'Vous n\'avez encore créé aucune note de frais.'
              : 'Aucune note de frais ne correspond à vos critères de recherche.'
            }
          </p>
          {reports.length === 0 && (
            <Link
              to="/new-expense"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer ma première note de frais
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Destination
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Dates
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Montant
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Statut
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Modif.
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 max-w-32 sm:max-w-none truncate">
                          {report.travelInfo.destination}
                        </div>
                        <div className="text-sm text-gray-500 max-w-32 sm:max-w-none truncate">
                          {report.travelInfo.purpose}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400 flex-shrink-0" />
                          <span className="whitespace-nowrap">{format(new Date(report.travelInfo.departure.date), 'dd/MM', { locale: fr })} - {format(new Date(report.travelInfo.return.date), 'dd/MM/yyyy', { locale: fr })}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 flex items-center">
                        <Euro className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400" />
                        {Number(report.totalAmount || 0).toFixed(2)}€
                      </div>
                      <div className="text-xs text-gray-500">
                        {report.expenses.length} frais
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status || 'draft')}`}>
                        {getStatusIcon(report.status || 'draft')}
                        <span className="ml-1 hidden sm:inline">{getStatusLabel(report.status || 'draft')}</span>
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {format(new Date(report.updatedAt), 'dd/MM/yyyy', { locale: fr })}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                        <Link
                          to={`/expense/${report.id}`}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Voir"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Link>
                        {(report.status === 'draft' || !report.status) && (
                          <Link
                            to={`/expense/${report.id}/edit`}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Modifier"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Link>
                        )}
                        {(report.status === 'draft' || !report.status) && (
                          <button
                            onClick={() => handleDeleteClick(report.id, report.contractNumber)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Résumé */}
      {filteredReports.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredReports.length}
              </div>
              <div className="text-sm text-gray-500">Notes affichées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredReports.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0).toFixed(2)}€
              </div>
              <div className="text-sm text-gray-500">Montant total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredReports.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-500">En attente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredReports.filter(r => r.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-500">Approuvées</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la note de frais"
        message={`Êtes-vous sûr de vouloir supprimer la note de frais "${confirmDelete.contractNumber}" ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        isLoading={isLoading}
      />
    </div>
  );
};

export default ExpenseList; 