import { Resend } from "resend";

// Configuration Resend côté serveur
const resend = new Resend(process.env.RESEND_API_KEY);

// Fonction pour télécharger un fichier depuis une URL
async function downloadFile(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  } catch (error) {
    console.error("Erreur téléchargement:", url, error);
    return null;
  }
}

// Fonction pour générer le contenu HTML du rapport
function generateReportHTML(tripData, expenseNotes, totals) {
  const { trip } = tripData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
        .trip-title { font-size: 20px; font-weight: bold; margin-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-item { margin-bottom: 10px; }
        .label { font-weight: bold; color: #666; }
        .value { color: #333; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .expenses { margin-top: 20px; }
        .expense-item { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
        .expense-title { font-weight: bold; color: #2563eb; }
        .expense-details { margin-top: 5px; font-size: 14px; color: #666; }
        .total { background: #2563eb; color: white; padding: 15px; text-align: center; border-radius: 8px; font-size: 18px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">TripFlow</div>
        <div class="trip-title">Rapport de frais - ${trip.name}</div>
        <div>${trip.destination} • ${new Date(trip.departureDate).toLocaleDateString("fr-FR")} au ${new Date(trip.returnDate).toLocaleDateString("fr-FR")}</div>
      </div>

      <div class="info-grid">
        <div>
          <div class="info-item">
            <span class="label">Collaborateur :</span>
            <span class="value">${trip.collaborator.firstName} ${trip.collaborator.lastName}</span>
          </div>
          <div class="info-item">
            <span class="label">Destination :</span>
            <span class="value">${trip.destination}</span>
          </div>
        </div>
        <div>
          <div class="info-item">
            <span class="label">Objet :</span>
            <span class="value">${trip.purpose}</span>
          </div>
          <div class="info-item">
            <span class="label">Contrat :</span>
            <span class="value">${trip.contractNumber || "N/A"}</span>
          </div>
        </div>
      </div>

      <div class="summary">
        <h3>Résumé financier</h3>
        <div class="info-grid">
          <div>Notes de frais : ${expenseNotes.length}</div>
          <div>Montant total : ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(totals.total)}</div>
          <div>Montant Véloce : ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(totals.veloce)}</div>
          <div>Montant personnel : ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(totals.personal)}</div>
        </div>
      </div>

      <div class="expenses">
        <h3>Détail des notes de frais</h3>
        ${expenseNotes
          .map(
            (note, index) => `
          <div class="expense-item">
            <div class="expense-title">${index + 1}. ${note.description}</div>
            <div class="expense-details">
              <div>Catégorie : ${note.category} | Montant : ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(note.amount)}</div>
              <div>Date : ${new Date(note.date).toLocaleDateString("fr-FR")} | Facture : ${note.receiptUrl ? "✓ Jointe" : "✗ Manquante"}</div>
              ${note.isVeloce ? '<div style="color: #059669;">🔵 Véloce</div>' : ""}
              ${note.isPersonal ? '<div style="color: #dc2626;">🔴 Personnel</div>' : ""}
            </div>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="total">
        Total général : ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(totals.total)}
      </div>
    </body>
    </html>
  `;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { tripData, expenseNotes, recipientEmail } = req.body;

    console.log("📧 Traitement email pour:", tripData.trip.name);

    // Calculer les totaux
    const totals = {
      total: expenseNotes.reduce((sum, note) => sum + note.amount, 0),
      veloce: expenseNotes
        .filter((note) => note.isVeloce)
        .reduce((sum, note) => sum + note.amount, 0),
      personal: expenseNotes
        .filter((note) => note.isPersonal)
        .reduce((sum, note) => sum + note.amount, 0),
    };

    // Télécharger toutes les factures
    console.log("📎 Téléchargement des factures...");
    const receiptPromises = expenseNotes
      .filter((note) => note.receiptUrl)
      .map(async (note, index) => {
        const buffer = await downloadFile(note.receiptUrl);
        if (!buffer) return null;

        // Déterminer l'extension
        let extension = "pdf";
        if (note.receiptUrl.includes(".png")) extension = "png";
        if (
          note.receiptUrl.includes(".jpg") ||
          note.receiptUrl.includes(".jpeg")
        )
          extension = "jpg";

        // Nom de fichier propre
        const cleanDescription = note.description.replace(
          /[^a-zA-Z0-9\-_]/g,
          ""
        );
        const filename = `${tripData.trip.name}-${cleanDescription}-${index + 1}.${extension}`;

        return {
          filename,
          content: buffer,
          contentType:
            extension === "pdf" ? "application/pdf" : `image/${extension}`,
        };
      });

    const receipts = (await Promise.all(receiptPromises)).filter(Boolean);
    console.log(`✅ ${receipts.length} factures téléchargées`);

    // Générer le rapport HTML
    const reportHTML = generateReportHTML(tripData, expenseNotes, totals);

    // Préparer l'email
    const emailData = {
      from: `TripFlow <${process.env.FROM_EMAIL}>`,
      to: [recipientEmail],
      subject: `Rapport de frais - ${tripData.trip.name} (${tripData.trip.destination})`,
      html: reportHTML,
      attachments: receipts,
    };

    // Envoyer avec Resend
    console.log("📤 Envoi email via Resend...");
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error("❌ Erreur Resend:", error);
      return res.status(500).json({
        success: false,
        error: "Erreur lors de l'envoi de l'email",
        details: error,
      });
    }

    console.log("✅ Email envoyé avec succès. ID:", data.id);
    return res.status(200).json({
      success: true,
      emailId: data.id,
      receiptsCount: receipts.length,
    });
  } catch (error) {
    console.error("❌ Erreur serveur:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur interne du serveur",
      details: error.message,
    });
  }
}
