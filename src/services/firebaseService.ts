import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { ExpenseReport } from '../store/expenseStore';

export class FirebaseService {
  private expenseReportsCollection = 'expenseReports';
  private receiptsPath = 'receipts';

  // Créer une nouvelle note de frais
  async createExpenseReport(reportData: Omit<ExpenseReport, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.expenseReportsCollection), {
        ...reportData,
        createdAt: Timestamp.fromDate(new Date(reportData.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(reportData.updatedAt))
      });
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création de la note de frais:', error);
      throw error;
    }
  }

  // Mettre à jour une note de frais
  async updateExpenseReport(reportId: string, updates: Partial<ExpenseReport>): Promise<void> {
    try {
      const reportRef = doc(db, this.expenseReportsCollection, reportId);
      const updateData = { ...updates };

      if (updateData.updatedAt) {
        updateData.updatedAt = Timestamp.fromDate(new Date(updateData.updatedAt)) as any;
      }
      if (updateData.createdAt) {
        updateData.createdAt = Timestamp.fromDate(new Date(updateData.createdAt)) as any;
      }

      await updateDoc(reportRef, updateData);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la note de frais:', error);
      throw error;
    }
  }

  // Récupérer une note de frais par ID
  async getExpenseReport(reportId: string): Promise<ExpenseReport | null> {
    try {
      const reportRef = doc(db, this.expenseReportsCollection, reportId);
      const reportSnap = await getDoc(reportRef);

      if (reportSnap.exists()) {
        const data = reportSnap.data();
        return {
          id: reportSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as ExpenseReport;
      }

      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la note de frais:', error);
      throw error;
    }
  }

  // Récupérer toutes les notes de frais d'un utilisateur
  async getUserExpenseReports(userId: string): Promise<ExpenseReport[]> {
    try {
      // Requête simple sans orderBy pour éviter l'erreur d'index
      const q = query(
        collection(db, this.expenseReportsCollection),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as ExpenseReport;
      });

      console.log('📋 Rapports trouvés:', reports.length);
      // Tri côté client par date de mise à jour
      return reports.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des notes de frais:', error);
      return []; // Retourner un tableau vide en cas d'erreur
    }
  }

  // Supprimer une note de frais
  async deleteExpenseReport(reportId: string): Promise<void> {
    try {
      // Récupérer d'abord les données pour supprimer les fichiers associés
      const report = await this.getExpenseReport(reportId);

      if (report) {
        // Supprimer les fichiers de reçus associés
        for (const expense of report.expenses || []) {
          if (expense.receiptUrl) {
            try {
              await this.deleteReceiptFile(expense.receiptUrl);
            } catch (fileError) {
              console.warn('Erreur lors de la suppression du fichier:', fileError);
            }
          }
        }
      }

      // Supprimer le document
      const reportRef = doc(db, this.expenseReportsCollection, reportId);
      await deleteDoc(reportRef);
    } catch (error) {
      console.error('Erreur lors de la suppression de la note de frais:', error);
      throw error;
    }
  }

  // Upload d'un fichier de reçu
  async uploadReceiptFile(file: File, reportId: string, expenseId: string): Promise<string> {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${reportId}_${expenseId}_${Date.now()}.${fileExtension}`;
      const fileRef = ref(storage, `${this.receiptsPath}/${fileName}`);

      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      throw error;
    }
  }

  // Supprimer un fichier de reçu
  async deleteReceiptFile(fileUrl: string): Promise<void> {
    try {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      throw error;
    }
  }

  // Rechercher des notes de frais
  async searchExpenseReports(userId: string, searchTerm: string): Promise<ExpenseReport[]> {
    try {
      const allReports = await this.getUserExpenseReports(userId);
      const searchLower = searchTerm.toLowerCase();

      return allReports.filter(report =>
        report.travelInfo.destination.toLowerCase().includes(searchLower) ||
        report.travelInfo.purpose.toLowerCase().includes(searchLower) ||
        report.collaborator.firstName.toLowerCase().includes(searchLower) ||
        report.collaborator.lastName.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      throw error;
    }
  }

  // Récupérer les statistiques d'un utilisateur
  async getUserStats(userId: string): Promise<{
    totalReports: number;
    totalAmount: number;
    pendingReports: number;
    approvedReports: number;
  }> {
    try {
      const reports = await this.getUserExpenseReports(userId);

      return {
        totalReports: reports.length,
        totalAmount: reports.reduce((sum, report) => sum + report.totalAmount, 0),
        pendingReports: reports.filter(r => r.status === 'pending').length,
        approvedReports: reports.filter(r => r.status === 'approved').length
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
}

// Fonction utilitaire pour gérer les erreurs de connexion
export const handleFirestoreError = (error: any, operation: string) => {
  console.warn(`⚠️ Erreur Firestore ${operation}:`, error);

  // Erreurs de blocage par extension/bloqueur
  if (error.message?.includes('ERR_BLOCKED_BY_CLIENT') ||
    error.code === 'unavailable' ||
    error.message?.includes('network')) {
    console.log('🔍 Possible blocage par extension de navigateur ou problème réseau');
    console.log('💡 Solutions : Désactiver bloqueur de pub ou vérifier la connexion');
    return {
      type: 'network',
      message: 'Problème de connexion détecté. Vérifiez votre réseau ou désactivez les bloqueurs de contenu.'
    };
  }

  return {
    type: 'unknown',
    message: error.message || 'Erreur inconnue'
  };
};

export default FirebaseService; 