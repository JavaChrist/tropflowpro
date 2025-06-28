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
import { Trip, ExpenseNote, TripSummary } from '../types';

export class TripService {
  private tripsCollection = 'trips';
  private notesCollection = 'expenseNotes';

  // Créer un nouveau déplacement
  async createTrip(tripData: Omit<Trip, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.tripsCollection), {
        ...tripData,
        createdAt: Timestamp.fromDate(new Date(tripData.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(tripData.updatedAt))
      });
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création du déplacement:', error);
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

  // Récupérer tous les déplacements d'un utilisateur
  async getUserTrips(userId: string): Promise<Trip[]> {
    try {
      const q = query(
        collection(db, this.tripsCollection),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const trips = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as Trip;
      });

      // Tri côté client par date de mise à jour
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
}

export default TripService; 