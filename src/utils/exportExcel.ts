import * as XLSX from 'xlsx';
import TripService from '../services/tripService';
import { Trip, ExpenseNote } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CATEGORY_LABELS: Record<string, string> = {
  transport_long: 'Transport longue distance',
  transport_short: 'Transport courte distance',
  accommodation: 'Hébergement',
  meals: 'Repas',
  other: 'Autres'
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  submitted: 'Soumis',
  paid: 'Payé'
};

export async function exportTripsToExcel(trips: Trip[]): Promise<void> {
  const tripService = new TripService();

  // Feuille 1 : Déplacements
  const tripsData = [];
  const tripsWithTotals: { trip: Trip; totalAmount: number; notes: ExpenseNote[] }[] = [];

  for (const trip of trips) {
    const notes = await tripService.getTripNotes(trip.id);
    const totalAmount = notes.reduce((sum, n) => sum + Number(n.amount || 0), 0);
    tripsWithTotals.push({ trip, totalAmount, notes });

    tripsData.push({
      'Nom': trip.name,
      'Destination': trip.destination,
      'Objet': trip.purpose,
      'Date départ': format(new Date(trip.departureDate), 'dd/MM/yyyy', { locale: fr }),
      'Date retour': format(new Date(trip.returnDate), 'dd/MM/yyyy', { locale: fr }),
      'Collaborateur': `${trip.collaborator?.firstName || ''} ${trip.collaborator?.lastName || ''}`.trim(),
      'Statut': STATUS_LABELS[trip.status || 'draft'],
      'Total (€)': totalAmount.toFixed(2),
      'Observations': trip.remarks || ''
    });
  }

  // Feuille 2 : Notes de frais
  const expensesData: Record<string, string | number>[] = [];
  for (const { trip, notes } of tripsWithTotals) {
    for (const note of notes) {
      expensesData.push({
        'Déplacement': trip.name,
        'Catégorie': CATEGORY_LABELS[note.category] || note.category,
        'Sous-catégorie': note.subcategory,
        'Description': note.description,
        'Montant (€)': Number(note.amount).toFixed(2),
        'Date': format(new Date(note.date), 'dd/MM/yyyy', { locale: fr }),
        'Véloce': note.isVeloce ? 'Oui' : 'Non',
        'Personnel': note.isPersonal ? 'Oui' : 'Non'
      });
    }
  }

  const wb = XLSX.utils.book_new();
  const wsTrips = XLSX.utils.json_to_sheet(tripsData);
  const wsExpenses = XLSX.utils.json_to_sheet(expensesData);

  XLSX.utils.book_append_sheet(wb, wsTrips, 'Déplacements');
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Notes de frais');

  const fileName = `TropFlow_Export_${format(new Date(), 'yyyy-MM-dd_HHmm', { locale: fr })}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
