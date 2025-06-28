import { ExpenseNote } from '../types';
import { storage } from '../config/firebase';
import { ref, getBlob } from 'firebase/storage';

// Types pour la génération de PDF
export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  receiptUrl?: string;
  receiptName?: string;
  isVeloce?: boolean;
  isPersonal?: boolean;
}

export interface PDFOptions {
  title?: string;
  includeDate?: boolean;
  includeTotal?: boolean;
  logoUrl?: string;
  includeReceipts?: boolean;
}

export interface ReportData {
  expenses: ExpenseItem[];
  period: string;
  totalAmount: number;
  expenseCount: number;
  topCategory?: string;
}

// Interface pour les pièces jointes
export interface ReceiptAttachment {
  name: string;
  url: string;
  blob: Blob;
  type: string;
}

// Fonction pour récupérer une facture depuis Firebase Storage avec timeout
export const fetchReceiptFromFirebase = async (receiptUrl: string): Promise<ReceiptAttachment | null> => {
  try {
    if (receiptUrl.startsWith('blob:')) {
      // URL blob temporaire (probablement expirée)
      const response = await fetch(receiptUrl);
      const blob = await response.blob();
      const fileName = `facture-${Date.now()}.${blob.type.includes('pdf') ? 'pdf' : 'jpg'}`;

      return {
        name: fileName,
        url: receiptUrl,
        blob,
        type: blob.type
      };
    } else if (receiptUrl.includes('firebasestorage.googleapis.com')) {
      // URL Firebase Storage - essayer SDK Firebase avec timeout, puis fetch direct

      // MÉTHODE 1: SDK Firebase avec timeout de 10 secondes
      try {
        const urlParts = receiptUrl.split('/o/')[1];
        if (!urlParts) {
          throw new Error('URL Firebase Storage invalide');
        }

        const filePath = decodeURIComponent(urlParts.split('?')[0]);
        const fileRef = ref(storage, filePath);

        // Créer une promesse avec timeout de 10 secondes
        const downloadPromise = getBlob(fileRef);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Firebase SDK timeout après 10 secondes'));
          }, 10000);
        });

        const blob = await Promise.race([downloadPromise, timeoutPromise]);
        const fileName = filePath.split('/').pop() || 'facture.pdf';

        return {
          name: fileName,
          url: receiptUrl,
          blob,
          type: blob.type
        };
      } catch (firebaseError) {
        // MÉTHODE 2: Fetch direct (contournement robuste)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 15000); // 15 secondes

        try {
          const response = await fetch(receiptUrl, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            headers: {
              'Accept': '*/*',
              'Cache-Control': 'no-cache'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const blob = await response.blob();
          const fileName = receiptUrl.split('/receipts%2F')[1]?.split('?')[0] || 'facture.pdf';

          return {
            name: decodeURIComponent(fileName),
            url: receiptUrl,
            blob,
            type: blob.type
          };
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      }
    } else {
      // Autre type d'URL externe
      const response = await fetch(receiptUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const fileName = receiptUrl.split('/').pop()?.split('?')[0] || 'facture.pdf';

      return {
        name: fileName,
        url: receiptUrl,
        blob,
        type: blob.type
      };
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la facture:', receiptUrl, error);
    return null; // Plus de placeholders - retourne null si échec
  }
};

// Fonction pour récupérer toutes les factures d'une liste de notes de frais
export const fetchAllReceipts = async (expenseNotes: ExpenseNote[]): Promise<ReceiptAttachment[]> => {
  const notesWithReceipts = expenseNotes.filter(note => note.receiptUrl);

  if (notesWithReceipts.length === 0) {
    return [];
  }

  const receiptPromises = notesWithReceipts.map(async (note) => {
    try {
      const result = await fetchReceiptFromFirebase(note.receiptUrl!);
      return result;
    } catch (error) {
      console.error(`❌ Erreur pour "${note.description}":`, error);
      return null;
    }
  });

  const receipts = await Promise.all(receiptPromises);
  const validReceipts = receipts.filter(receipt => receipt !== null) as ReceiptAttachment[];

  return validReceipts;
};

// Fonction pour formater une date pour le PDF
export const formatDateForPDF = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Fonction pour formater un montant pour le PDF
export const formatAmountForPDF = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

// Fonction pour générer le contenu HTML d'un PDF style TripFlow (ex-Oktra)
export const generateExpensePDFContent = (
  expenses: ExpenseItem[],
  options: PDFOptions & {
    tripName?: string;
    destination?: string;
    dates?: string;
    contractNumber?: string;
    collaborator?: string;
    remarks?: string;
  } = {}
): string => {
  const {
    tripName = 'Déplacement',
    destination = '',
    dates = '',
    contractNumber = '',
    collaborator = '',
    remarks = ''
  } = options;

  // Calculer le total général
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Grouper les dépenses par catégorie
  const categories = {
    'transport_long': { name: 'Transport longue distance', subtitle: '(avion, train, location voiture)', expenses: [] as ExpenseItem[] },
    'transport_short': { name: 'Transport courte distance', subtitle: '(taxi, métro, bus)', expenses: [] as ExpenseItem[] },
    'accommodation': { name: 'Hébergement', subtitle: '(hôtel, airbnb)', expenses: [] as ExpenseItem[] },
    'meals': { name: 'Repas', subtitle: '(restaurant, repas)', expenses: [] as ExpenseItem[] },
    'other': { name: 'Autres', subtitle: '(autres frais)', expenses: [] as ExpenseItem[] }
  };

  expenses.forEach(expense => {
    const category = expense.category as keyof typeof categories;
    if (categories[category]) {
      categories[category].expenses.push(expense);
    }
  });

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background: white;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .logo-icon {
          width: 24px;
          height: 24px;
          background: #2563eb;
          border-radius: 4px;
          margin-right: 8px;
          display: inline-block;
        }
        .logo-text {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
        }
        .trip-title {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin: 20px 0 10px 0;
        }
        .trip-info {
          font-size: 16px;
          color: #6b7280;
          margin-bottom: 30px;
        }
        .details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 40px;
          font-size: 14px;
        }
        .detail-item {
          display: flex;
        }
        .detail-label {
          width: 140px;
          font-weight: normal;
          color: #6b7280;
        }
        .detail-value {
          font-weight: bold;
          color: #1f2937;
        }
        .expenses-title {
          font-size: 18px;
          font-weight: bold;
          margin: 30px 0 20px 0;
          color: #1f2937;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .table th {
          background-color: #1f2937;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: bold;
          border: 1px solid #374151;
        }
        .table td {
          padding: 12px;
          border: 1px solid #d1d5db;
          vertical-align: top;
        }
        .table tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .category-name {
          font-weight: bold;
          color: #1f2937;
        }
        .category-subtitle {
          font-size: 11px;
          color: #6b7280;
          display: block;
          margin-top: 2px;
        }
        .checkbox {
          text-align: center;
          font-size: 16px;
        }
        .comments {
          font-size: 12px;
        }
        .expense-item {
          margin-bottom: 4px;
        }
        .no-expenses {
          color: #6b7280;
          font-style: italic;
        }
                 .totals {
           margin-top: 30px;
           display: flex;
           justify-content: flex-end;
           align-items: center;
           padding: 15px;
           background-color: #f3f4f6;
           border-radius: 8px;
         }
         .total-general {
           color: #1f2937;
           font-size: 18px;
           font-weight: bold;
         }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">
          <div class="logo-icon"></div>
          <span class="logo-text">TripFlow</span>
        </div>
        <div class="trip-title">${tripName}</div>
        <div class="trip-info">${destination}${dates ? ` • ${dates}` : ''}</div>
      </div>

      <div class="details">
        <div class="detail-item">
          <span class="detail-label">Numéro de Contrat</span>
          <span class="detail-value">${contractNumber}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Collaborateur</span>
          <span class="detail-value">${collaborator}</span>
        </div>
        ${remarks ? `
        <div class="detail-item">
          <span class="detail-label">Remarques</span>
          <span class="detail-value">${remarks}</span>
        </div>
        ` : ''}
      </div>

      <div class="expenses-title">Frais Prévisionnels</div>

      <table class="table">
        <thead>
          <tr>
            <th style="width: 25%;">FRAIS PRÉVISIONNELS</th>
            <th style="width: 15%; text-align: center;">VIA VELOCE</th>
            <th style="width: 15%; text-align: center;">FRAIS PERSO</th>
            <th style="width: 45%;">COMMENTAIRES</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Générer les lignes du tableau
  Object.entries(categories).forEach(([key, category]) => {
    const categoryExpenses = category.expenses;
    const hasVeloce = categoryExpenses.some(e => (e as any).isVeloce);
    const hasPersonal = categoryExpenses.some(e => (e as any).isPersonal);

    htmlContent += `
      <tr>
        <td>
          <div class="category-name">${category.name}</div>
          <span class="category-subtitle">${category.subtitle}</span>
        </td>
        <td class="checkbox">${hasVeloce ? '☑' : '☐'}</td>
        <td class="checkbox">${hasPersonal ? '☑' : '☐'}</td>
        <td class="comments">
          ${categoryExpenses.length > 0 ?
        categoryExpenses.map(expense => `
              <div class="expense-item">
                ${expense.title} ${formatAmountForPDF(expense.amount)}
              </div>
            `).join('') :
        '<span class="no-expenses">Aucun frais</span>'
      }
        </td>
      </tr>
    `;
  });

  htmlContent += `
        </tbody>
      </table>

      <div class="totals">
        <div class="total-general">Total général: ${formatAmountForPDF(totalAmount)}</div>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
};

// Fonction pour générer un PDF de rapport mensuel
export const generateMonthlyReportPDF = (reportData: ReportData): string => {
  const title = `Rapport Mensuel - ${reportData.period}`;

  let htmlContent = generateExpensePDFContent(reportData.expenses, {
    title,
    includeDate: true,
    includeTotal: true
  });

  // Ajouter des statistiques supplémentaires
  const statsSection = `
    <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
      <h3 style="color: #333; margin-bottom: 15px;">Statistiques du mois</h3>
      <p><strong>Nombre total de dépenses :</strong> ${reportData.expenseCount}</p>
      <p><strong>Montant total :</strong> ${formatAmountForPDF(reportData.totalAmount)}</p>
      <p><strong>Dépense moyenne :</strong> ${formatAmountForPDF(reportData.totalAmount / reportData.expenseCount || 0)}</p>
      ${reportData.topCategory ? `<p><strong>Catégorie principale :</strong> ${reportData.topCategory}</p>` : ''}
    </div>
  `;

  // Insérer les statistiques avant le footer
  htmlContent = htmlContent.replace('<div class="footer">', statsSection + '<div class="footer">');

  return htmlContent;
};

// Fonction pour télécharger un vrai PDF avec jsPDF
export const downloadPDF = async (
  htmlContent: string,
  filename: string = 'rapport-depenses.pdf'
): Promise<boolean> => {
  try {
    console.log(`📄 Génération du PDF: ${filename}`);

    // Importer jsPDF dynamiquement
    const { default: jsPDF } = await import('jspdf');

    // Créer un élément HTML temporaire pour le rendu
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    document.body.appendChild(tempDiv);

    // Importer html2canvas pour convertir HTML en image
    const html2canvas = (await import('html2canvas')).default;

    // Capturer le HTML en image
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123 // A4 height in pixels at 96 DPI
    });

    // Nettoyer l'élément temporaire
    document.body.removeChild(tempDiv);

    // Créer le PDF
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Ajouter l'image au PDF
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Ajouter la première page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Ajouter des pages supplémentaires si nécessaire
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Télécharger le PDF
    pdf.save(filename);

    console.log(`✅ PDF téléchargé: ${filename}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF:', error);
    return false;
  }
};

// Fonction principale pour générer et télécharger un rapport PDF
export const generateExpenseReport = async (
  expenses: ExpenseItem[],
  options: PDFOptions & { filename?: string } = {}
): Promise<boolean> => {
  const { filename = 'rapport-depenses.pdf', ...pdfOptions } = options;

  const htmlContent = generateExpensePDFContent(expenses, pdfOptions);
  return await downloadPDF(htmlContent, filename);
};

// Fonction pour télécharger les factures séparément
export const downloadReceiptsAsZip = async (
  receipts: ReceiptAttachment[],
  tripName: string
): Promise<boolean> => {
  try {
    console.log(`📦 Début du téléchargement de ${receipts.length} factures pour "${tripName}"`);

    if (receipts.length === 0) {
      console.log('⚠️ Aucune facture à télécharger');
      return true;
    }

    // Simulation du téléchargement des factures individuelles
    for (let i = 0; i < receipts.length; i++) {
      const receipt = receipts[i];
      console.log(`📄 Téléchargement facture ${i + 1}/${receipts.length}: ${receipt.name} (${receipt.blob.size} octets)`);

      const url = URL.createObjectURL(receipt.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tripName}-facture-${i + 1}-${receipt.name}`;
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`✅ Facture ${i + 1} téléchargée: ${a.download}`);

      // Petit délai entre les téléchargements
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('🎉 Toutes les factures ont été téléchargées avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement des factures:', error);
    return false;
  }
};

// Fonction complète pour générer un PDF avec factures séparées
export const generateTripExpenseReport = async (
  tripId: string,
  expenseNotes: ExpenseNote[],
  tripData: {
    name: string;
    destination: string;
    departureDate: string;
    returnDate: string;
    contractNumber: string;
    collaborator: { firstName: string; lastName: string };
    remarks?: string;
  },
  options: PDFOptions & { filename?: string; downloadReceipts?: boolean } = {}
): Promise<{ success: boolean; receipts: ReceiptAttachment[] }> => {
  try {
    const { filename = `rapport-frais-${tripId}.pdf`, downloadReceipts = true, ...pdfOptions } = options;

    // Préparer les dates
    const startDate = new Date(tripData.departureDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    const endDate = new Date(tripData.returnDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const datesStr = `${startDate} - ${endDate}`;

    // Convertir les notes en items avec les propriétés isVeloce et isPersonal
    const expenses = expenseNotes.map(note => ({
      id: note.id,
      title: note.description,
      amount: note.amount,
      date: note.date,
      category: note.category,
      receiptUrl: note.receiptUrl,
      receiptName: note.receiptName,
      isVeloce: note.isVeloce,
      isPersonal: note.isPersonal
    }));

    console.log(`🚀 Génération du rapport pour "${tripData.name}" avec ${expenseNotes.length} notes de frais`);

    // ÉTAPE 1 : Générer et télécharger le PDF principal FIRST
    console.log('📄 Génération du PDF principal...');
    const htmlContent = generateExpensePDFContent(expenses, {
      ...pdfOptions,
      tripName: tripData.name,
      destination: tripData.destination,
      dates: datesStr,
      contractNumber: tripData.contractNumber,
      collaborator: `${tripData.collaborator.firstName} ${tripData.collaborator.lastName}`,
      remarks: tripData.remarks
    });

    const pdfSuccess = await downloadPDF(htmlContent, filename);
    console.log(`📄 PDF principal: ${pdfSuccess ? '✅ Généré' : '❌ Échec'}`);

    // ÉTAPE 2 : Récupérer et télécharger les factures SÉPARÉMENT
    let receipts: ReceiptAttachment[] = [];
    let receiptsSuccess = true;

    if (downloadReceipts) {
      console.log('📎 Récupération des factures...');

      try {
        receipts = await fetchAllReceipts(expenseNotes);

        if (receipts.length > 0) {
          console.log(`📎 Téléchargement des ${receipts.length} factures...`);
          receiptsSuccess = await downloadReceiptsAsZip(receipts, tripData.name);
        } else {
          console.log('⚠️ Aucune facture trouvée à télécharger');
        }
      } catch (receiptError) {
        console.error('❌ Erreur lors de la récupération des factures:', receiptError);
        receiptsSuccess = false;
      }
    }

    const overallSuccess = pdfSuccess && receiptsSuccess;
    console.log(`${overallSuccess ? '🎉' : '❌'} Résultat final - PDF: ${pdfSuccess ? 'OK' : 'ERREUR'}, Factures: ${receiptsSuccess ? 'OK' : 'ERREUR'} (${receipts.length} fichiers)`);

    return { success: overallSuccess, receipts };
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error);
    return { success: false, receipts: [] };
  }
};

// Fonction pour télécharger un fichier Firebase avec le bon nom (contournement CORS avancé)
export const downloadFirebaseFile = async (receiptUrl: string, fileName: string): Promise<boolean> => {
  try {
    console.log('📥 Téléchargement Firebase avec nom personnalisé:', fileName);

    // Créer un iframe invisible pour contourner les restrictions CORS
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = receiptUrl;
    document.body.appendChild(iframe);

    // Attendre un peu pour le chargement
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Nettoyer l'iframe
    document.body.removeChild(iframe);

    console.log('✅ Iframe créée pour:', fileName);

    // Alternative : créer un lien de téléchargement forcé
    const a = document.createElement('a');
    a.href = receiptUrl;
    a.download = fileName;
    a.target = '_blank';
    a.style.display = 'none';

    document.body.appendChild(a);

    // Simuler un clic avec délai
    setTimeout(() => {
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 1000);
    }, 100);

    console.log('✅ Lien de téléchargement créé:', fileName);
    return true;

  } catch (error) {
    console.error('❌ Erreur téléchargement Firebase:', error);
    return false;
  }
};

// Fonction pour ouvrir le fichier dans un nouvel onglet avec bouton de sauvegarde
export const openFileWithSaveButton = (receiptUrl: string, fileName: string): void => {
  console.log('🌐 Ouverture avec bouton de sauvegarde:', fileName);

  // Ouvrir dans un nouvel onglet
  const newWindow = window.open(receiptUrl, '_blank');

  if (newWindow) {
    // Essayer d'ajouter du JavaScript dans le nouvel onglet pour faciliter la sauvegarde
    setTimeout(() => {
      try {
        const script = newWindow.document.createElement('div');
        script.innerHTML = `
          <div style="position: fixed; top: 20px; right: 20px; z-index: 10000; background: #3b82f6; color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: system-ui; cursor: pointer;" onclick="
            const a = document.createElement('a');
            a.href = window.location.href;
            a.download = '${fileName}';
            a.click();
          ">
            💾 Sauvegarder comme: ${fileName}
          </div>
        `;
        newWindow.document.body.appendChild(script);
        console.log('✅ Bouton de sauvegarde ajouté à l\'onglet');
      } catch (e) {
        console.log('⚠️ Impossible d\'ajouter le bouton (CORS), utilisez Ctrl+S');
      }
    }, 1500);
  }
};

// Fonction pour forcer le téléchargement avec le bon nom (contournement Firebase)
export const forceDownloadWithName = async (firebaseUrl: string, customFileName: string): Promise<boolean> => {
  try {
    console.log('🔄 Téléchargement forcé avec nom personnalisé:', customFileName);

    // Méthode 1: Créer un lien avec dataURL (fonctionne mieux)
    const response = await fetch(firebaseUrl, {
      method: 'GET',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Créer un lien de téléchargement avec le nom personnalisé
    const a = document.createElement('a');
    a.href = url;
    a.download = customFileName;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();

    // Nettoyer
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    console.log('✅ Téléchargement forcé réussi:', customFileName);
    return true;

  } catch (error) {
    console.error('❌ Erreur téléchargement forcé:', error);

    // Fallback: ouvrir dans nouvel onglet
    console.log('🔄 Fallback: ouverture dans nouvel onglet');
    window.open(firebaseUrl, '_blank');
    return false;
  }
};

const pdfUtils = {
  formatDateForPDF,
  formatAmountForPDF,
  generateExpensePDFContent,
  generateMonthlyReportPDF,
  downloadPDF,
  generateExpenseReport,
  downloadReceiptsAsZip,
  generateTripExpenseReport,
  downloadFirebaseFile,
  openFileWithSaveButton,
  forceDownloadWithName
};

export default pdfUtils;
