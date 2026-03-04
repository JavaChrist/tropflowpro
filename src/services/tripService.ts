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
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Trip, ExpenseNote, TripSummary, UserProfile, canCreateTrip } from '../types';

// Erreur personnalisée pour les limitations de plan
export class PlanLimitError extends Error {
  constructor(message: string, public remainingTrips: number, public maxTrips: number) {
    super(message);
    this.name = 'PlanLimitError';
  }
}

export class TripService {
  private tripsCollection = 'trips';
  private notesCollection = 'expenseNotes';

  // Vérifier si l'utilisateur peut créer un nouveau déplacement
  private async checkTripCreationLimit(userProfile: UserProfile): Promise<void> {
    const canCreate = canCreateTrip(userProfile.subscription, userProfile.email);

    if (!canCreate) {
      const plan = userProfile.subscription.planId === 'free' ? 10 : -1;
      const tripsUsed = userProfile.subscription.tripsUsed;

      throw new PlanLimitError(
        `Limite de déplacements atteinte (${tripsUsed}/${plan}). Passez au plan Pro pour des déplacements illimités.`,
        Math.max(0, plan - tripsUsed),
        plan
      );
    }
  }

  // Compter le nombre de déplacements de l'utilisateur
  private async getUserTripsCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.tripsCollection),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Erreur lors du comptage des déplacements:', error);
      return 0;
    }
  }

  // Créer un nouveau déplacement avec vérification des limites
  async createTrip(tripData: Omit<Trip, 'id'>, userProfile: UserProfile): Promise<string> {
    try {
      // 1. Vérifier les limites du plan
      await this.checkTripCreationLimit(userProfile);

      // 2. Créer le déplacement (Firestore n'accepte pas undefined)
      const { createdAt, updatedAt, ...rest } = tripData;
      const cleanData = Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v !== undefined)
      );
      const docRef = await addDoc(collection(db, this.tripsCollection), {
        ...cleanData,
        createdAt: Timestamp.fromDate(new Date(createdAt)),
        updatedAt: Timestamp.fromDate(new Date(updatedAt))
      });



      return docRef.id;
    } catch (error) {
      if (error instanceof PlanLimitError) {
        console.warn('🚫 Limite de plan atteinte:', error.message);
        throw error;
      }

      console.error('❌ Erreur lors de la création du déplacement:', error);
      throw error;
    }
  }

  // Dupliquer un déplacement avec ses notes de frais
  async duplicateTrip(tripId: string, userProfile: UserProfile): Promise<string> {
    try {
      await this.checkTripCreationLimit(userProfile);

      const trip = await this.getTrip(tripId);
      if (!trip) throw new Error('Déplacement non trouvé');

      const notes = await this.getTripNotes(tripId);
      const now = new Date().toISOString();

      const newTripData: Record<string, unknown> = {
        ...trip,
        name: `${trip.name} (copie)`,
        status: 'draft',
        userId: userProfile.uid,
        contractNumber: userProfile.contractNumber,
        createdAt: Timestamp.fromDate(new Date(now)),
        updatedAt: Timestamp.fromDate(new Date(now))
      };
      if (userProfile.organizationId) {
        newTripData.organizationId = userProfile.organizationId;
      } else {
        delete newTripData.organizationId;
      }

      const newTripRef = await addDoc(collection(db, this.tripsCollection), newTripData);

      for (const note of notes) {
        const cleanData: Record<string, unknown> = {
          tripId: newTripRef.id,
          userId: userProfile.uid,
          category: note.category,
          subcategory: note.subcategory,
          description: note.description,
          amount: note.amount,
          date: note.date,
          isVeloce: note.isVeloce,
          isPersonal: note.isPersonal,
          createdAt: Timestamp.fromDate(new Date(now)),
          updatedAt: Timestamp.fromDate(new Date(now))
        };
        if (note.receiptUrl) cleanData.receiptUrl = note.receiptUrl;
        if (note.receiptName) cleanData.receiptName = note.receiptName;

        await addDoc(collection(db, this.notesCollection), cleanData);
      }

      return newTripRef.id;
    } catch (error) {
      if (error instanceof PlanLimitError) throw error;
      console.error('Erreur lors de la duplication du déplacement:', error);
      throw error;
    }
  }

  // Mettre à jour un déplacement
  async updateTrip(tripId: string, updates: Partial<Trip>): Promise<void> {
    try {
      const tripRef = doc(db, this.tripsCollection, tripId);
      const updateData = { ...updates };

      if (updateData.updatedAt) {
        updateData.updatedAt = Timestamp.fromDate(new Date(updateData.updatedAt)) as any;
      }
      if (updateData.createdAt) {
        updateData.createdAt = Timestamp.fromDate(new Date(updateData.createdAt)) as any;
      }

      await updateDoc(tripRef, updateData);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du déplacement:', error);
      throw error;
    }
  }

  // Récupérer un déplacement par ID
  async getTrip(tripId: string): Promise<Trip | null> {
    try {
      const tripRef = doc(db, this.tripsCollection, tripId);
      const tripSnap = await getDoc(tripRef);

      if (tripSnap.exists()) {
        const data = tripSnap.data();
        return {
          id: tripSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as Trip;
      }

      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération du déplacement:', error);
      throw error;
    }
  }

  // Récupérer tous les déplacements d'un utilisateur (ou de son équipe si Pro Entreprise)
  async getUserTrips(userId: string, organizationId?: string): Promise<Trip[]> {
    try {
      let trips: Trip[];

      if (organizationId) {
        // Pro Entreprise : récupérer les déplacements de l'équipe (userId ou organizationId)
        const qUser = query(
          collection(db, this.tripsCollection),
          where('userId', '==', userId)
        );
        const qOrg = query(
          collection(db, this.tripsCollection),
          where('organizationId', '==', organizationId)
        );

        const [userSnap, orgSnap] = await Promise.all([
          getDocs(qUser),
          getDocs(qOrg)
        ]);

        const tripIds = new Set<string>();
        const allTrips: Trip[] = [];

        [...userSnap.docs, ...orgSnap.docs].forEach(docSnap => {
          if (tripIds.has(docSnap.id)) return;
          tripIds.add(docSnap.id);
          const data = docSnap.data();
          allTrips.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
          } as Trip);
        });
        trips = allTrips;
      } else {
        const q = query(
          collection(db, this.tripsCollection),
          where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        trips = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
          } as Trip;
        });
      }

      return trips.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des déplacements:', error);
      throw error;
    }
  }

  // Récupérer les notes d'un déplacement
  async getTripNotes(tripId: string): Promise<ExpenseNote[]> {
    try {
      const q = query(
        collection(db, this.notesCollection),
        where('tripId', '==', tripId)
      );

      const querySnapshot = await getDocs(q);
      const notes = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as ExpenseNote;
      });

      // Tri par date de création
      return notes.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des notes:', error);
      throw error;
    }
  }

  // Récupérer un déplacement avec ses notes et totaux
  async getTripSummary(tripId: string): Promise<TripSummary | null> {
    try {
      const trip = await this.getTrip(tripId);
      if (!trip) return null;

      const notes = await this.getTripNotes(tripId);

      const totalAmount = notes.reduce((sum, note) => sum + Number(note.amount || 0), 0);
      const totalVeloce = notes.filter(n => n.isVeloce).reduce((sum, note) => sum + Number(note.amount || 0), 0);
      const totalPersonal = notes.filter(n => n.isPersonal).reduce((sum, note) => sum + Number(note.amount || 0), 0);

      return {
        ...trip,
        notes,
        totalAmount,
        totalVeloce,
        totalPersonal,
        notesCount: notes.length
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du résumé:', error);
      throw error;
    }
  }

  // Supprimer un déplacement et toutes ses notes
  async deleteTrip(tripId: string): Promise<void> {
    try {
      // Supprimer toutes les notes du déplacement
      const notes = await this.getTripNotes(tripId);
      const deletePromises = notes.map(note =>
        deleteDoc(doc(db, this.notesCollection, note.id))
      );
      await Promise.all(deletePromises);

      // Supprimer le déplacement
      const tripRef = doc(db, this.tripsCollection, tripId);
      await deleteDoc(tripRef);

      console.log('🗑️ Déplacement supprimé:', tripId);
    } catch (error) {
      console.error('Erreur lors de la suppression du déplacement:', error);
      throw error;
    }
  }

  // Créer une note de frais pour un déplacement
  async createExpenseNote(noteData: Omit<ExpenseNote, 'id'>): Promise<string> {
    try {
      // Nettoyer les données pour Firebase (supprimer les undefined)
      const cleanData: any = {
        tripId: noteData.tripId,
        userId: noteData.userId,
        category: noteData.category,
        subcategory: noteData.subcategory,
        description: noteData.description,
        amount: noteData.amount,
        date: noteData.date,
        isVeloce: noteData.isVeloce,
        isPersonal: noteData.isPersonal,
        createdAt: Timestamp.fromDate(new Date(noteData.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(noteData.updatedAt))
      };

      // Ajouter les champs optionnels seulement s'ils ne sont pas undefined
      if (noteData.receiptUrl) {
        cleanData.receiptUrl = noteData.receiptUrl;
      }
      if (noteData.receiptName) {
        cleanData.receiptName = noteData.receiptName;
      }

      const docRef = await addDoc(collection(db, this.notesCollection), cleanData);
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création de la note:', error);
      throw error;
    }
  }

  // Mettre à jour une note de frais
  async updateExpenseNote(noteId: string, updates: Partial<ExpenseNote>): Promise<void> {
    try {
      const noteRef = doc(db, this.notesCollection, noteId);
      const updateData = { ...updates };

      if (updateData.updatedAt) {
        updateData.updatedAt = Timestamp.fromDate(new Date(updateData.updatedAt)) as any;
      }
      if (updateData.createdAt) {
        updateData.createdAt = Timestamp.fromDate(new Date(updateData.createdAt)) as any;
      }

      await updateDoc(noteRef, updateData);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la note:', error);
      throw error;
    }
  }

  // Supprimer une note de frais
  async deleteExpenseNote(noteId: string): Promise<void> {
    try {
      const noteRef = doc(db, this.notesCollection, noteId);
      await deleteDoc(noteRef);
    } catch (error) {
      console.error('Erreur lors de la suppression de la note:', error);
      throw error;
    }
  }

  // Méthodes utilitaires pour les statistiques d'usage
  async getUserTripsCountForStats(userId: string): Promise<number> {
    return this.getUserTripsCount(userId);
  }

  // Vérifier si l'utilisateur peut créer un déplacement (méthode publique)
  async canUserCreateTrip(userProfile: UserProfile): Promise<boolean> {
    try {
      await this.checkTripCreationLimit(userProfile);
      return true;
    } catch (error) {
      if (error instanceof PlanLimitError) {
        return false;
      }
      throw error;
    }
  }
}

export default TripService; 