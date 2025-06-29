import { create } from 'zustand';
import { FirebaseService } from '../services/firebaseService';
import { UserProfile } from '../hooks/useAuth';

export interface ExpenseItem {
  id: string;
  category: 'transport_long' | 'transport_short' | 'accommodation' | 'meals' | 'other';
  subcategory: string;
  description: string;
  amount: number;
  date: string;
  receiptUrl?: string;
  receiptName?: string;
  isVeloce: boolean;
  isPersonal: boolean;
}

// Interface simplifiée pour les infos de voyage (sans contrat et collaborateur)
export interface SimplifiedTravelInfo {
  departure: {
    date: string;
  };
  return: {
    date: string;
  };
  destination: string;
  purpose: string; // Nom du déplacement / identifiant principal
  remarks: string;
}

// Interface complète incluant les infos du profil utilisateur
export interface ExpenseReport {
  id: string;
  contractNumber: string; // Vient du profil utilisateur
  collaborator: {          // Vient du profil utilisateur
    firstName: string;
    lastName: string;
  };
  travelInfo: SimplifiedTravelInfo;
  expenses: ExpenseItem[];
  totalAmount: number;
  totalVeloce: number;
  totalPersonal: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  userId: string; // ID de l'utilisateur connecté
}

interface ExpenseStore {
  // État
  currentReport: Partial<ExpenseReport>;
  reports: ExpenseReport[];
  isLoading: boolean;
  error: string | null;

  // Actions pour la note de frais courante
  setTravelInfo: (travelInfo: SimplifiedTravelInfo, userProfile: UserProfile) => void;
  addExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<ExpenseItem>) => void;
  deleteExpense: (id: string) => void;

  // Actions pour sauvegarder
  saveReport: (userId: string) => Promise<string>;
  updateReport: (reportId: string) => Promise<void>;
  submitReport: (reportId: string) => Promise<void>;

  // Actions pour gérer les notes
  loadReports: (userId: string) => Promise<void>;
  loadReport: (reportId: string) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;

  // Utilitaires
  clearCurrentReport: () => void;
  calculateTotals: () => void;
  setError: (error: string | null) => void;
}

const firebaseService = new FirebaseService();

const useExpenseStore = create<ExpenseStore>((set, get) => ({
  // État initial
  currentReport: {
    expenses: [],
    totalAmount: 0,
    totalVeloce: 0,
    totalPersonal: 0,
  },
  reports: [],
  isLoading: false,
  error: null,

  // Définir les informations de voyage avec le profil utilisateur
  setTravelInfo: (travelInfo: SimplifiedTravelInfo, userProfile: UserProfile) => {
    set((state) => ({
      currentReport: {
        ...state.currentReport,
        contractNumber: userProfile.contractNumber,
        collaborator: {
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
        },
        travelInfo,
        userId: userProfile.uid,
      }
    }));
  },

  // Ajouter une dépense
  addExpense: (expense: Omit<ExpenseItem, 'id'>) => {
    const newExpense: ExpenseItem = {
      ...expense,
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    set((state) => ({
      currentReport: {
        ...state.currentReport,
        expenses: [...(state.currentReport.expenses || []), newExpense],
      }
    }));

    get().calculateTotals();
  },

  // Mettre à jour une dépense
  updateExpense: (id: string, expense: Partial<ExpenseItem>) => {
    set((state) => ({
      currentReport: {
        ...state.currentReport,
        expenses: (state.currentReport.expenses || []).map(item =>
          item.id === id ? { ...item, ...expense } : item
        ),
      }
    }));

    get().calculateTotals();
  },

  // Supprimer une dépense
  deleteExpense: (id: string) => {
    set((state) => ({
      currentReport: {
        ...state.currentReport,
        expenses: (state.currentReport.expenses || []).filter(item => item.id !== id),
      }
    }));

    get().calculateTotals();
  },

  // Calculer les totaux
  calculateTotals: () => {
    set((state) => {
      const expenses = state.currentReport.expenses || [];
      const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      const totalVeloce = expenses.filter(e => e.isVeloce).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      const totalPersonal = expenses.filter(e => e.isPersonal).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

      return {
        currentReport: {
          ...state.currentReport,
          totalAmount,
          totalVeloce,
          totalPersonal,
        }
      };
    });
  },

  // Sauvegarder le rapport
  saveReport: async (userId: string): Promise<string> => {
    const state = get();
    set({ isLoading: true, error: null });

    try {
      const currentReport = state.currentReport;

      if (!currentReport.travelInfo || !currentReport.contractNumber) {
        throw new Error('Informations de voyage manquantes');
      }

      const reportData: Omit<ExpenseReport, 'id'> = {
        contractNumber: currentReport.contractNumber,
        collaborator: currentReport.collaborator!,
        travelInfo: currentReport.travelInfo,
        expenses: currentReport.expenses || [],
        totalAmount: currentReport.totalAmount || 0,
        totalVeloce: currentReport.totalVeloce || 0,
        totalPersonal: currentReport.totalPersonal || 0,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId,
      };

      let reportId: string;

      if (currentReport.id) {
        // Mise à jour d'un rapport existant
        reportId = currentReport.id;
        await firebaseService.updateExpenseReport(reportId, {
          ...reportData,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Création d'un nouveau rapport
        reportId = await firebaseService.createExpenseReport(reportData);
      }

      // Recharger les rapports
      await get().loadReports(userId);

      set({ isLoading: false });
      return reportId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // Mettre à jour un rapport existant
  updateReport: async (reportId: string) => {
    const state = get();
    set({ isLoading: true, error: null });

    try {
      const currentReport = state.currentReport;

      if (!currentReport.travelInfo || !currentReport.contractNumber) {
        throw new Error('Informations de voyage manquantes');
      }

      const updateData = {
        contractNumber: currentReport.contractNumber,
        collaborator: currentReport.collaborator!,
        travelInfo: currentReport.travelInfo,
        expenses: currentReport.expenses || [],
        totalAmount: currentReport.totalAmount || 0,
        totalVeloce: currentReport.totalVeloce || 0,
        totalPersonal: currentReport.totalPersonal || 0,
        updatedAt: new Date().toISOString(),
      };

      await firebaseService.updateExpenseReport(reportId, updateData);

      // Mettre à jour le rapport local
      set((state) => ({
        reports: state.reports.map(report =>
          report.id === reportId
            ? { ...report, ...updateData }
            : report
        ),
        currentReport: {
          ...state.currentReport,
          ...updateData,
        },
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // Soumettre le rapport
  submitReport: async (reportId: string) => {
    set({ isLoading: true, error: null });

    try {
      await firebaseService.updateExpenseReport(reportId, {
        status: 'pending',
        updatedAt: new Date().toISOString(),
      });

      // Mettre à jour le statut local
      set((state) => ({
        reports: state.reports.map(report =>
          report.id === reportId
            ? { ...report, status: 'pending' as const, updatedAt: new Date().toISOString() }
            : report
        ),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la soumission';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // Charger tous les rapports de l'utilisateur
  loadReports: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const reports = await firebaseService.getUserExpenseReports(userId);
      set({ reports, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des rapports';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // Charger un rapport spécifique
  loadReport: async (reportId: string) => {
    set({ isLoading: true, error: null });

    try {
      const report = await firebaseService.getExpenseReport(reportId);
      if (report) {
        set({
          currentReport: report,
          isLoading: false
        });
      } else {
        throw new Error('Rapport non trouvé');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement du rapport';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // Supprimer un rapport
  deleteReport: async (reportId: string) => {
    set({ isLoading: true, error: null });

    try {
      await firebaseService.deleteExpenseReport(reportId);

      set((state) => ({
        reports: state.reports.filter(report => report.id !== reportId),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // Effacer le rapport courant
  clearCurrentReport: () => {
    set({
      currentReport: {
        expenses: [],
        totalAmount: 0,
        totalVeloce: 0,
        totalPersonal: 0,
      }
    });
  },

  // Définir une erreur
  setError: (error: string | null) => {
    set({ error });
  },
}));

export default useExpenseStore; 