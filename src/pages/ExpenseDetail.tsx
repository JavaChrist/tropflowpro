import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  FileText,
  Euro,
  Download,
  Send,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Hash,
  Receipt
} from 'lucide-react';
import useExpenseStore from '../store/expenseStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ConfirmModal from '../components/ConfirmModal';

const ExpenseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentReport, loadReport, submitReport, deleteReport, isLoading, error } = useExpenseStore();
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (id) {
      loadReport(id);
    }
  }, [id, loadReport]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement de la note de frais...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-sm text-red-800">{error}</p>
        <Link
          to="/expenses"
          className="mt-3 inline-flex items-center text-red-600 hover:text-red-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à la liste
        </Link>
      </div>
    );
  }

  if (!currentReport || !id) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Note de frais introuvable</h3>
        <p className="mt-1 text-sm text-gray-500">
          Cette note de frais n'existe pas ou a été supprimée.
        </p>
        <div className="mt-6">
          <Link
            to="/expenses"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const report = currentReport;

  const handleSubmitClick = () => {
    setConfirmSubmit(true);
  };

  const handleSubmitConfirm = async () => {
    if (id) {
      try {
        await submitReport(id);
        setConfirmSubmit(false);
      } catch (error) {
        console.error('Erreur lors de la soumission:', error);
      }
    }
  };

  const handleSubmitCancel = () => {
    setConfirmSubmit(false);
  };

  const handleDeleteClick = () => {
    setConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (id) {
      try {
        await deleteReport(id);
        navigate('/expenses');
        setConfirmDelete(false);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(false);
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/expenses"
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Note de frais - {report.travelInfo?.destination}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Créée le {report.createdAt ? format(new Date(report.createdAt), 'dd MMMM yyyy', { locale: fr }) : 'Date inconnue'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status || 'draft')}`}>
            {getStatusIcon(report.status || 'draft')}
            <span className="ml-1">
              {(report.status === 'draft' || !report.status) && 'Brouillon'}
              {report.status === 'pending' && 'En attente'}
              {report.status === 'approved' && 'Approuvée'}
              {report.status === 'rejected' && 'Rejetée'}
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations du déplacement */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations du déplacement</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  <Hash className="inline h-4 w-4 mr-1" />
                  Numéro de contrat
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {report.contractNumber || 'Non renseigné'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Collaborateur
                </label>
                <p className="mt-1 text-sm text-gray-900 flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  {`${report.collaborator?.firstName} ${report.collaborator?.lastName}` || 'Non renseigné'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Destination
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {report.travelInfo?.destination || 'Non renseignée'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Objet du déplacement
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {report.travelInfo?.purpose || 'Non renseigné'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Départ
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {report.travelInfo?.departure.date ? format(new Date(report.travelInfo.departure.date), 'dd/MM/yyyy', { locale: fr }) : 'Non renseigné'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Retour
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {report.travelInfo?.return.date ? format(new Date(report.travelInfo.return.date), 'dd/MM/yyyy', { locale: fr }) : 'Non renseigné'}
                </p>
              </div>
            </div>
            {report.travelInfo?.remarks && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Remarques
                </label>
                <p className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                  {report.travelInfo.remarks}
                </p>
              </div>
            )}
          </div>

          {/* Liste des frais */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Frais de déplacement ({report.expenses?.length || 0})
                </h2>
                {(report.status === 'draft' || !report.status) && (
                  <Link
                    to={`/expense/${id}/edit`}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Link>
                )}
              </div>
            </div>

            {!report.expenses || report.expenses.length === 0 ? (
              <div className="p-8 text-center">
                <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun frais ajouté</h3>
                <p className="mt-2 text-gray-500">
                  Cette note de frais ne contient encore aucun frais.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {report.expenses.map((expense) => (
                  <div key={expense.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">{expense.description}</h4>
                          <span className="text-sm text-gray-500">
                            {getCategoryName(expense.category)}
                          </span>
                          {expense.isVeloce && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
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
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(new Date(expense.date), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                          <span className="flex items-center">
                            <Euro className="h-4 w-4 mr-1" />
                            {Number(expense.amount || 0).toFixed(2)}€
                          </span>
                          {expense.receiptName && (
                            <span className="flex items-center text-blue-600">
                              <Receipt className="h-4 w-4 mr-1" />
                              {expense.receiptName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Résumé financier */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé financier</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Nombre de frais</span>
                <span className="font-medium">{report.expenses?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total VELOCE</span>
                <span className="font-medium text-blue-600">
                  {Number(report.totalVeloce || 0).toFixed(2)}€
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Personnel</span>
                <span className="font-medium text-orange-600">
                  {Number(report.totalPersonal || 0).toFixed(2)}€
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">Total général</span>
                  <span className="text-xl font-bold text-gray-900">
                    {Number(report.totalAmount || 0).toFixed(2)}€
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              {(report.status === 'draft' || !report.status) && (
                <>
                  <Link
                    to={`/expense/${id}/edit`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Link>
                  <button
                    onClick={handleSubmitClick}
                    disabled={!report.expenses || report.expenses.length === 0}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Soumettre
                  </button>
                </>
              )}

              <button
                onClick={() => window.print()}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </button>

              {(report.status === 'draft' || !report.status) && (
                <button
                  onClick={handleDeleteClick}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </button>
              )}
            </div>
          </div>

          {/* Informations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Statut :</span>
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                  {(report.status === 'draft' || !report.status) && 'Brouillon'}
                  {report.status === 'pending' && 'En attente'}
                  {report.status === 'approved' && 'Approuvée'}
                  {report.status === 'rejected' && 'Rejetée'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Créée le :</span>
                <span className="ml-2 text-gray-900">
                  {report.createdAt ? format(new Date(report.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr }) : 'Date inconnue'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Modifiée le :</span>
                <span className="ml-2 text-gray-900">
                  {report.updatedAt ? format(new Date(report.updatedAt), 'dd/MM/yyyy à HH:mm', { locale: fr }) : 'Date inconnue'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de soumission */}
      <ConfirmModal
        isOpen={confirmSubmit}
        onClose={handleSubmitCancel}
        onConfirm={handleSubmitConfirm}
        title="Soumettre la note de frais"
        message="Êtes-vous sûr de vouloir soumettre cette note de frais ? Une fois soumise, elle ne pourra plus être modifiée."
        type="info"
        confirmText="Soumettre"
        cancelText="Annuler"
        isLoading={isLoading}
      />

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={confirmDelete}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la note de frais"
        message="Êtes-vous sûr de vouloir supprimer cette note de frais ? Cette action est irréversible."
        type="danger"
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        isLoading={isLoading}
      />
    </div>
  );
};

export default ExpenseDetail; 