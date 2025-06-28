import { create } from 'zustand';
import TripService from '../services/tripService';
import { Trip, ExpenseNote, TripSummary } from '../types';
import { UserProfile } from '../hooks/useAuth';

interface TripStore {
  // État
  trips: Trip[];
  currentTrip: TripSummary | null;
  currentTripNotes: ExpenseNote[];
  isLoading: boolean;
  error: string | null;

  // Actions pour les déplacements
  loadTrips: (userId: string) => Promise<void>;
  loadTrip: (tripId: string) => Promise<void>;
  createTrip: (tripData: CreateTripData, userProfile: UserProfile) => Promise<string>;
  updateTrip: (tripId: string, updates: Partial<Trip>) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  submitTrip: (tripId: string) => Promise<void>;
  markAsPaid: (tripId: string) => Promise<void>;

  // Actions pour les notes de frais
  loadTripNotes: (tripId: string) => Promise<void>;
  addExpenseNote: (tripId: string, noteData: CreateExpenseNoteData, userProfile: UserProfile) => Promise<void>;
  updateExpenseNote: (noteId: string, updates: Partial<ExpenseNote>) => Promise<void>;
  deleteExpenseNote: (noteId: string, tripId: string) => Promise<void>;

  // Utilitaires
  clearCurrentTrip: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Interfaces pour la création
interface CreateTripData {
  name: string;
  destination: string;
  purpose: string;
  departureDate: string;
  returnDate: string;
  remarks?: string;
}

interface CreateExpenseNoteData {
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

const tripService = new TripService();

const useTripStore = create<TripStore>((set, get) => ({
  // État initial
  trips: [],
  currentTrip: null,
  currentTripNotes: [],
  isLoading: false,
  error: null,

  // Charger tous les déplacements de l'utilisateur
  loadTrips: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const trips = await tripService.getUserTrips(userId);
      set({ trips, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des déplacements';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // Charger un déplacement avec ses notes
  loadTrip: async (tripId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tripSummary = await tripService.getTripSummary(tripId);
      if (tripSummary) {
        set({
          currentTrip: tripSummary,
          currentTripNotes: tripSummary.notes,
          isLoading: false
        });
      } else {
        throw new Error('Déplacement non trouvé');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement du déplacement';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // Créer un nouveau déplacement
  createTrip: async (tripData: CreateTripData, userProfile: UserProfile): Promise<string> => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date().toISOString();
      const fullTripData: Omit<Trip, 'id'> = {
        ...tripData,
        userId: userProfile.uid,
        contractNumber: userProfile.contractNumber,
        collaborator: {
          firstName: userProfile.firstName,
          lastName: userProfile.lastName
        },
        status: 'draft',
        createdAt: now,
        updatedAt: now
      };

      const tripId = await tripService.createTrip(fullTripData);

      // Recharger la liste des déplacements
      await get().loadTrips(userProfile.uid);

      set({ isLoading: false });
      return tripId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du déplacement';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // Mettre à jour un déplacement
  updateTrip: async (tripId: string, updates: Partial<Trip>) => {
    set({ isLoading: true, error: null });
    try {
      await tripService.updateTrip(tripId, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      // Mettre à jour l'état local
      set(state => ({
        trips: state.trips.map(trip =>
          trip.id === tripId ? { ...trip, ...updates, updatedAt: new Date().toISOString() } : trip
        ),
        currentTrip: state.currentTrip?.id === tripId
          ? { ...state.currentTrip, ...updates, updatedAt: new Date().toISOString() }
          : state.currentTrip,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du déplacement';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // Supprimer un déplacement
  deleteTrip: async (tripId: string) => {
    set({ isLoading: true, error: null });
    try {
      await tripService.deleteTrip(tripId);

      set(state => ({
        trips: state.trips.filter(trip => trip.id !== tripId),
        currentTrip: state.currentTrip?.id === tripId ? null : state.currentTrip,
        currentTripNotes: state.currentTrip?.id === tripId ? [] : state.currentTripNotes,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression du déplacement';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // Soumettre un déplacement
  submitTrip: async (tripId: string) => {
    set({ isLoading: true, error: null });
    try {
      await tripService.updateTrip(tripId, {
        status: 'submitted',
        updatedAt: new Date().toISOString()
      });

      // Mettre à jour l'état local
      set(state => ({
        trips: state.trips.map(trip =>
          trip.id === tripId
            ? { ...trip, status: 'submitted' as const, updatedAt: new Date().toISOString() }
            : trip
        ),
        currentTrip: state.currentTrip?.id === tripId
          ? { ...state.currentTrip, status: 'submitted' as const, updatedAt: new Date().toISOString() }
          : state.currentTrip,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la soumission du déplacement';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // Marquer un déplacement comme payé
  markAsPaid: async (tripId: string) => {
    set({ isLoading: true, error: null });
    try {
      await tripService.updateTrip(tripId, {
        status: 'paid',
        updatedAt: new Date().toISOString()
      });

      // Mettre à jour l'état local
      set(state => ({
        trips: state.trips.map(trip =>
          trip.id === tripId
            ? { ...trip, status: 'paid' as const, updatedAt: new Date().toISOString() }
            : trip
        ),
        currentTrip: state.currentTrip?.id === tripId
          ? { ...state.currentTrip, status: 'paid' as const, updatedAt: new Date().toISOString() }
          : state.currentTrip,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du marquage comme payé';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // Charger les notes d'un déplacement
  loadTripNotes: async (tripId: string) => {
    set({ isLoading: true, error: null });
    try {
      const notes = await tripService.getTripNotes(tripId);
      set({ currentTripNotes: notes, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des notes';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // Ajouter une note de frais au déplacement
  addExpenseNote: async (tripId: string, noteData: CreateExpenseNoteData, userProfile: UserProfile) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date().toISOString();
      const fullNoteData: Omit<ExpenseNote, 'id'> = {
        ...noteData,
        tripId,
        userId: userProfile.uid,
        createdAt: now,
        updatedAt: now
      };

      const noteId = await tripService.createExpenseNote(fullNoteData);

      // Recharger le déplacement avec ses notes
      await get().loadTrip(tripId);

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout de la note';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // Mettre à jour une note de frais
  updateExpenseNote: async (noteId: string, updates: Partial<ExpenseNote>) => {
    set({ isLoading: true, error: null });
    try {
      await tripService.updateExpenseNote(noteId, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      // Mettre à jour l'état local
      set(state => ({
        currentTripNotes: state.currentTripNotes.map(note =>
          note.id === noteId ? { ...note, ...updates, updatedAt: new Date().toISOString() } : note
        ),
        isLoading: false
      }));

      // Recalculer les totaux du déplacement actuel
      const state = get();
      if (state.currentTrip) {
        await get().loadTrip(state.currentTrip.id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la note';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // Supprimer une note de frais
  deleteExpenseNote: async (noteId: string, tripId: string) => {
    set({ isLoading: true, error: null });
    try {
      await tripService.deleteExpenseNote(noteId);

      // Recharger le déplacement pour recalculer les totaux
      await get().loadTrip(tripId);

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression de la note';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // Effacer le déplacement courant
  clearCurrentTrip: () => {
    set({
      currentTrip: null,
      currentTripNotes: []
    });
  },

  // Définir une erreur
  setError: (error: string | null) => {
    set({ error });
  },

  // Effacer l'erreur
  clearError: () => {
    set({ error: null });
  }
}));

export default useTripStore; 