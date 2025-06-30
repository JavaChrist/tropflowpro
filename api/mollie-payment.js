// API Vercel pour gérer les paiements Mollie
import { createMollieClient } from "@mollie/api-client";

// Configuration Mollie
const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY, // Clé API Mollie depuis les variables d'environnement
});

// Configuration des plans
const PLANS_CONFIG = {
  pro_individual: {
    name: "TropFlow Pro Individuel",
    price: "9.99",
    interval: "1 month",
    description: "Déplacements illimités pour un utilisateur",
  },
  pro_enterprise: {
    name: "TropFlow Pro Entreprise",
    price: "29.99",
    interval: "1 month",
    description: "Multi-utilisateurs et fonctionnalités avancées",
  },
};

export default async function handler(req, res) {
  // Cors pour les requêtes depuis l'app
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "POST") {
      const { action, planId, userEmail, userId, returnUrl, webhookUrl } =
        req.body;

      if (action === "create-checkout") {
        return await createCheckout(
          req,
          res,
          planId,
          userEmail,
          userId,
          returnUrl,
          webhookUrl
        );
      } else if (action === "create-subscription") {
        return await createSubscription(req, res);
      } else if (action === "webhook") {
        return await handleWebhook(req, res);
      }
    }

    // Gérer les webhooks GET (vérification)
    if (req.method === "GET" && req.query.webhook) {
      return res.status(200).json({ status: "webhook endpoint ready" });
    }

    return res.status(400).json({ error: "Action non supportée" });
  } catch (error) {
    console.error("❌ Erreur API Mollie:", error);
    return res.status(500).json({
      error: "Erreur serveur",
      details: error.message,
    });
  }
}

// Créer un checkout Mollie pour un plan
async function createCheckout(
  req,
  res,
  planId,
  userEmail,
  userId,
  returnUrl,
  webhookUrl
) {
  try {
    if (!PLANS_CONFIG[planId]) {
      return res.status(400).json({ error: "Plan non reconnu" });
    }

    const plan = PLANS_CONFIG[planId];

    // Créer le paiement Mollie
    const payment = await mollieClient.payments.create({
      amount: {
        currency: "EUR",
        value: plan.price,
      },
      description: `${plan.name} - Premier mois`,
      redirectUrl: returnUrl || `${req.headers.origin}/payment/success`,
      webhookUrl:
        webhookUrl || `${req.headers.origin}/api/mollie-payment?webhook=true`,
      metadata: {
        planId: planId,
        userId: userId,
        userEmail: userEmail,
        subscriptionSetup: "true",
      },
    });

    console.log("✅ Checkout Mollie créé:", {
      paymentId: payment.id,
      planId: planId,
      amount: plan.price,
      userEmail: userEmail,
    });

    return res.status(200).json({
      success: true,
      checkoutUrl: payment.getCheckoutUrl(),
      paymentId: payment.id,
      status: payment.status,
    });
  } catch (error) {
    console.error("❌ Erreur création checkout:", error);
    return res.status(500).json({
      error: "Erreur lors de la création du checkout",
      details: error.message,
    });
  }
}

// Créer un abonnement récurrent Mollie
async function createSubscription(req, res) {
  try {
    const { customerId, planId } = req.body;

    if (!PLANS_CONFIG[planId]) {
      return res.status(400).json({ error: "Plan non reconnu" });
    }

    const plan = PLANS_CONFIG[planId];

    // Créer l'abonnement récurrent
    const subscription = await mollieClient.customers_subscriptions.create({
      customerId: customerId,
      amount: {
        currency: "EUR",
        value: plan.price,
      },
      times: null, // Récurrent indéfiniment
      interval: plan.interval,
      description: plan.name,
      webhookUrl: `${req.headers.origin}/api/mollie-payment?webhook=true`,
      metadata: {
        planId: planId,
      },
    });

    console.log("✅ Abonnement Mollie créé:", {
      subscriptionId: subscription.id,
      customerId: customerId,
      planId: planId,
    });

    return res.status(200).json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      nextPaymentDate: subscription.nextPaymentDate,
    });
  } catch (error) {
    console.error("❌ Erreur création abonnement:", error);
    return res.status(500).json({
      error: "Erreur lors de la création de l'abonnement",
      details: error.message,
    });
  }
}

// Gérer les webhooks Mollie
async function handleWebhook(req, res) {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID de paiement manquant" });
    }

    // Récupérer le paiement depuis Mollie
    const payment = await mollieClient.payments.get(id);

    console.log("🔔 Webhook Mollie reçu:", {
      paymentId: payment.id,
      status: payment.status,
      metadata: payment.metadata,
    });

    // Traiter selon le statut
    switch (payment.status) {
      case "paid":
        await handlePaymentSuccess(payment);
        break;
      case "failed":
      case "canceled":
      case "expired":
        await handlePaymentFailure(payment);
        break;
      default:
        console.log("📋 Statut de paiement en attente:", payment.status);
    }

    // Toujours répondre 200 OK pour confirmer la réception
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ Erreur webhook:", error);
    // Même en cas d'erreur, on répond 200 pour éviter les re-tentatives
    return res.status(200).json({
      received: true,
      error: error.message,
    });
  }
}

// Traiter un paiement réussi
async function handlePaymentSuccess(payment) {
  try {
    const { planId, userId, userEmail, subscriptionSetup } = payment.metadata;

    console.log("🎉 Paiement réussi pour:", {
      userId: userId,
      planId: planId,
      amount: payment.amount.value,
    });

    // Si c'est un setup d'abonnement, créer le customer et l'abonnement
    if (subscriptionSetup === "true") {
      // Créer ou récupérer le customer Mollie
      const customer = await mollieClient.customers.create({
        name: `TropFlow User ${userId}`,
        email: userEmail,
        metadata: {
          userId: userId,
          platform: "tropflow-pro",
        },
      });

      console.log("✅ Customer Mollie créé:", customer.id);

      // TODO: Mettre à jour la base de données utilisateur
      // Ici, vous devriez appeler Firebase pour mettre à jour le profil utilisateur
      // avec les IDs Mollie et activer le plan premium

      return {
        success: true,
        customerId: customer.id,
        planId: planId,
      };
    }
  } catch (error) {
    console.error("❌ Erreur traitement paiement réussi:", error);
    throw error;
  }
}

// Traiter un paiement échoué
async function handlePaymentFailure(payment) {
  const { userId, planId } = payment.metadata;

  console.log("❌ Paiement échoué pour:", {
    userId: userId,
    planId: planId,
    status: payment.status,
    failureReason: payment.details?.failureReason,
  });

  // TODO: Notifier l'utilisateur de l'échec
  // TODO: Eventuellement envoyer un email de relance
}

// Utilitaires pour les tests
export const MollieTestUtils = {
  // Simuler un paiement réussi en mode test
  simulatePaymentSuccess: async (paymentId) => {
    console.log("🧪 Simulation paiement réussi:", paymentId);
    return { status: "paid", id: paymentId };
  },

  // Générer des IDs de test au format Mollie
  generateTestIds: () => {
    return {
      customerId: `cst_test_${Math.random().toString(36).substring(2, 15)}`,
      subscriptionId: `sub_test_${Math.random().toString(36).substring(2, 15)}`,
      paymentId: `tr_test_${Math.random().toString(36).substring(2, 15)}`,
    };
  },
};
