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
    console.log('📎 Récupération de la facture:', receiptUrl);

    // ❌ Problème CORS: Firebase Storage bloque les requêtes fetch depuis le navigateur
    // ✅ Solution: On ne télécharge plus les fichiers, on fournit juste les URLs

    // Extraire le nom du fichier depuis l'URL
    const urlParts = receiptUrl.split('/');
    const fileNameWithParams = urlParts[urlParts.length - 1];
    const fileName = fileNameWithParams.split('?')[0]; // Enlever les paramètres
    const decodedFileName = decodeURIComponent(fileName);

    // Déterminer le type de fichier
    const extension = decodedFileName.split('.').pop()?.toLowerCase() || '';
    let contentType = 'application/octet-stream';

    switch (extension) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
    }

    // Créer un blob virtuel pour maintenir la compatibilité
    // (même si on ne peut pas télécharger le contenu réel à cause de CORS)
    const virtualBlob = new Blob([''], { type: contentType });

    console.log('✅ Facture référencée (CORS évité):', decodedFileName);

    return {
      name: decodedFileName,
      url: receiptUrl,
      blob: virtualBlob,
      type: contentType
    };

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la facture:', error);
    return null;
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
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #1f2937;
          background-color: white;
          box-sizing: border-box;
        }
        .container {
          max-width: 180mm;
          margin: 0 auto;
          padding: 15mm 15mm;
          box-sizing: border-box;
          background-color: white;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #3b82f6;
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
      <div class="container">
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
    tempDiv.style.boxSizing = 'border-box';
    document.body.appendChild(tempDiv);

    // Importer html2canvas pour convertir HTML en image
    const html2canvas = (await import('html2canvas')).default;

    // Capturer le HTML en image
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      allowTaint: false,
      logging: false
    });

    // Nettoyer l'élément temporaire
    document.body.removeChild(tempDiv);

    // Créer le PDF
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Calculs de dimensions avec marges réelles
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm  
    const marginTop = 15; // Marge du haut
    const marginBottom = 15; // Marge du bas
    const marginLeft = 15; // Marge gauche
    const marginRight = 15; // Marge droite
    const usableHeight = pdfHeight - marginTop - marginBottom; // 267mm
    const usableWidth = pdfWidth - marginLeft - marginRight; // 180mm

    // Ajuster les dimensions de l'image avec marges
    const imgWidth = usableWidth; // Largeur réduite pour les marges
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    console.log(`📏 Image: ${imgHeight.toFixed(1)}mm, Page utilisable: ${usableHeight}mm, Largeur: ${imgWidth}mm`);

    // Vérifier combien de pages sont vraiment nécessaires
    const requiredPages = Math.ceil(imgHeight / usableHeight);
    console.log(`📄 Pages nécessaires: ${requiredPages}`);

    if (requiredPages === 1) {
      // Une seule page suffit - centrer l'image avec marges
      pdf.addImage(imgData, 'PNG', marginLeft, marginTop, imgWidth, imgHeight);
      console.log('✅ PDF créé sur une seule page avec marges');
    } else {
      // Plusieurs pages nécessaires - approche par découpage avec marges
      for (let pageIndex = 0; pageIndex < requiredPages; pageIndex++) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        // Calculer quelle partie de l'image afficher sur cette page
        const sourceY = pageIndex * usableHeight;
        const remainingHeight = imgHeight - sourceY;
        const heightForThisPage = Math.min(usableHeight, remainingHeight);

        // Créer un canvas temporaire pour cette portion
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');

        if (pageCtx) {
          pageCanvas.width = canvas.width;
          pageCanvas.height = (heightForThisPage / imgHeight) * canvas.height;

          // Copier la portion appropriée de l'image originale
          pageCtx.drawImage(
            canvas,
            0, (sourceY / imgHeight) * canvas.height, // Source position
            canvas.width, pageCanvas.height, // Source dimensions
            0, 0, // Destination position
            canvas.width, pageCanvas.height // Destination dimensions
          );

          // Ajouter cette portion au PDF avec marges
          const pageImgData = pageCanvas.toDataURL('image/png');
          pdf.addImage(pageImgData, 'PNG', marginLeft, marginTop, imgWidth, heightForThisPage);

          console.log(`📄 Page ${pageIndex + 1}/${requiredPages} ajoutée avec marges`);
        }
      }
    }

    // Télécharger le PDF
    pdf.save(filename);

    console.log(`✅ PDF téléchargé: ${filename} (${pdf.getNumberOfPages()} page(s))`);
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
    console.log(`📦 Ouverture de ${receipts.length} factures pour "${tripName}"`);

    if (receipts.length === 0) {
      console.log('⚠️ Aucune facture à ouvrir');
      return true;
    }

    // Au lieu de télécharger, on ouvre chaque facture dans un nouvel onglet
    console.log('🌐 Ouverture des factures dans de nouveaux onglets...');

    for (let i = 0; i < receipts.length; i++) {
      const receipt = receipts[i];
      const customFileName = `${tripName}-facture-${i + 1}-${receipt.name}`;

      console.log(`📄 Ouverture facture ${i + 1}/${receipts.length}: ${receipt.name}`);

      // Ouvrir la facture dans un nouvel onglet
      setTimeout(() => {
        openFileWithSaveButton(receipt.url, customFileName);
      }, i * 500); // Délai entre les ouvertures pour éviter le blocage popup

      console.log(`✅ Facture ${i + 1} ouverte: ${customFileName}`);
    }

    console.log('🎉 Toutes les factures ont été ouvertes dans de nouveaux onglets');
    console.log('💡 Utilisez "Enregistrer sous" (Ctrl+S) dans chaque onglet pour télécharger avec le bon nom');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'ouverture des factures:', error);
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

    // ÉTAPE 2 : Récupérer et ouvrir les factures SÉPARÉMENT
    let receipts: ReceiptAttachment[] = [];
    let receiptsSuccess = true;

    if (downloadReceipts) {
      console.log('📎 Préparation des factures...');

      try {
        receipts = await fetchAllReceipts(expenseNotes);

        if (receipts.length > 0) {
          console.log(`📎 Ouverture des ${receipts.length} factures...`);
          receiptsSuccess = await downloadReceiptsAsZip(receipts, tripData.name);
        } else {
          console.log('⚠️ Aucune facture trouvée à ouvrir');
        }
      } catch (receiptError) {
        console.error('❌ Erreur lors de la préparation des factures:', receiptError);
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

// Fonction pour télécharger un fichier Firebase avec le bon nom (sans CORS)
export const downloadFirebaseFile = async (receiptUrl: string, fileName: string): Promise<boolean> => {
  try {
    console.log('📥 Ouverture de la facture:', fileName);

    // Créer un lien qui ouvre le fichier dans un nouvel onglet
    // L'utilisateur peut ensuite utiliser "Enregistrer sous" pour télécharger avec le bon nom
    const a = document.createElement('a');
    a.href = receiptUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 100);

    console.log('✅ Facture ouverte dans un nouvel onglet:', fileName);
    console.log('💡 L\'utilisateur peut utiliser "Enregistrer sous" pour sauvegarder avec le bon nom');
    return true;

  } catch (error) {
    console.error('❌ Erreur ouverture de facture:', error);
    return false;
  }
};

// Fonction pour ouvrir le fichier dans un nouvel onglet avec bouton de sauvegarde
export const openFileWithSaveButton = (receiptUrl: string, fileName: string): void => {
  console.log('🌐 Ouverture avec instructions:', fileName);

  try {
    // Ouvrir dans un nouvel onglet
    const newWindow = window.open(receiptUrl, '_blank', 'noopener,noreferrer');

    if (newWindow) {
      console.log('✅ Facture ouverte dans un nouvel onglet');
      console.log(`💾 Pour sauvegarder: Clic droit → "Enregistrer sous" → renommer en "${fileName}"`);
    } else {
      console.log('⚠️ Popup bloqué - tentative avec lien direct');
      window.location.href = receiptUrl;
    }
  } catch (error) {
    console.error('❌ Erreur ouverture:', error);
    // Fallback: redirection directe
    window.location.href = receiptUrl;
  }
};

// Fonction simplifiée pour télécharger les factures (sans CORS)
export const forceDownloadWithName = async (firebaseUrl: string, customFileName: string): Promise<boolean> => {
  try {
    console.log('🔄 Ouverture de la facture pour téléchargement:', customFileName);

    // Au lieu d'essayer de contourner CORS, on ouvre simplement le fichier
    // L'utilisateur peut ensuite utiliser "Enregistrer sous" avec le bon nom
    return await downloadFirebaseFile(firebaseUrl, customFileName);

  } catch (error) {
    console.error('❌ Erreur téléchargement:', error);
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