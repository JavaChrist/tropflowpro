// Types centralisés pour l'application TripFlow

// Déplacement (container principal)
export interface Trip {
  id: string;
  userId: string;
  name: string; // "PI Planning Lyon"
  destination: string; // "Lyon"
  purpose: string; // "PI Planning"
  departureDate: string;
  returnDate: string;
  contractNumber: string; // Du profil utilisateur
  collaborator: {
    firstName: string;
    lastName: string;
  };
  remarks?: string;
  status: 'draft' | 'submitted' | 'paid';
  createdAt: string;
  updatedAt: string;
}

// Note de frais (rattachée à un déplacement)
export interface ExpenseNote {
  id: string;
  tripId: string; // Rattachée au déplacement
  userId: string;
  category: 'transport_long' | 'transport_short' | 'accommodation' | 'meals' | 'other';
  subcategory: string;
  description: string;
  amount: number;
  date: string;
  receiptUrl?: string;
  receiptName?: string;
  isVeloce: boolean;
  isPersonal: boolean;
  createdAt: string;
  updatedAt: string;
}

// Résumé d'un déplacement avec totaux
export interface TripSummary extends Trip {
  notes: ExpenseNote[];
  totalAmount: number;
  totalVeloce: number;
  totalPersonal: number;
  notesCount: number;
} 