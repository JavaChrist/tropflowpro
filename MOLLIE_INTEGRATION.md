# 💳 Intégration Mollie pour TropFlow Pro

## 🎯 Vue d'ensemble

TropFlow Pro utilise **Mollie** comme processeur de paiement pour gérer les abonnements premium. Cette documentation explique comment configurer et utiliser l'intégration Mollie.

## 📋 Prérequis

### 1. Compte Mollie

- Créer un compte sur [mollie.com](https://mollie.com)
- Obtenir les clés API de test et de production
- Configurer les webhooks

### 2. Dépendances

```bash
npm install @mollie/api-client
```

## ⚙️ Configuration

### 1. Variables d'environnement

Ajouter dans `.env.local` et sur Vercel :

```env
# Mollie Configuration
MOLLIE_API_KEY=test_dHar4XY7LxsDOtmnkVtjNVWXLSlXsM  # Clé de test
# MOLLIE_API_KEY=live_dHar4XY7LxsDOtmnkVtjNVWXLSlXsM  # Clé de production

# URLs de base
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
```

### 2. Configuration Mollie Dashboard

Dans votre dashboard Mollie :

1. **Webhooks** → Ajouter une nouvelle URL :

   ```
   https://votre-app.vercel.app/api/mollie-payment?webhook=true
   ```

2. **Méthodes de paiement** → Activer :
   - Carte de crédit/débit
   - Bancontact (Belgique)
   - iDEAL (Pays-Bas)
   - SEPA Direct Debit
   - PayPal

## 🏗️ Architecture

### 1. API Routes (`/api/mollie-payment.js`)

```javascript
// Endpoints disponibles
POST /api/mollie-payment
- action: 'create-checkout'     // Créer une session de paiement
- action: 'create-subscription' // Créer un abonnement récurrent
- action: 'webhook'            // Traiter les webhooks

GET /api/mollie-payment?webhook=true  // Vérification webhook
```

### 2. Flux de paiement

```
1. Utilisateur clique "Passer au Pro"
   ↓
2. Appel API 'create-checkout'
   ↓
3. Redirection vers Mollie
   ↓
4. Paiement utilisateur
   ↓
5. Webhook Mollie → API
   ↓
6. Activation abonnement
   ↓
7. Retour sur /payment/success
```

## 💰 Plans disponibles

```typescript
const PLANS_CONFIG = {
  pro_individual: {
    name: "TropFlow Pro Individuel",
    price: "9.99",
    interval: "1 month",
  },
  pro_enterprise: {
    name: "TropFlow Pro Entreprise",
    price: "29.99",
    interval: "1 month",
  },
};
```

## 🔄 Types de paiement

### 1. Premier paiement (Setup)

```javascript
// Créer un paiement unique pour setup
const payment = await mollieClient.payments.create({
  amount: { currency: "EUR", value: "9.99" },
  description: "TropFlow Pro Individuel - Premier mois",
  redirectUrl: "https://app.com/payment/success",
  webhookUrl: "https://app.com/api/mollie-payment?webhook=true",
  metadata: {
    planId: "pro_individual",
    userId: "user123",
    subscriptionSetup: "true",
  },
});
```

### 2. Abonnement récurrent

```javascript
// Après le premier paiement, créer l'abonnement
const subscription = await mollieClient.customers_subscriptions.create({
  customerId: "cst_4qqhO89gsT",
  amount: { currency: "EUR", value: "9.99" },
  times: null, // Indéfini
  interval: "1 month",
  description: "TropFlow Pro Individuel",
});
```

## 🔐 Sécurité

### 1. Validation des webhooks

```javascript
// Vérifier que le webhook vient bien de Mollie
const payment = await mollieClient.payments.get(id);
if (payment.status === "paid") {
  // Activer l'abonnement
}
```

### 2. Métadonnées sécurisées

```javascript
// Toujours inclure des métadonnées pour traçabilité
metadata: {
  planId: 'pro_individual',
  userId: userProfile.uid,
  userEmail: userProfile.email,
  subscriptionSetup: 'true',
  timestamp: new Date().toISOString()
}
```

## 🧪 Tests

### 1. Mode test Mollie

Utilisez les cartes de test Mollie :

```
Visa réussie    : 4242 4242 4242 4242
Visa échouée    : 4100 0000 0000 0019
Mastercard      : 5555 5555 5555 4444
```

### 2. Simulation locale

```javascript
// Pour les tests locaux sans Mollie
const mollieIds = PlanService.generateMollieTestIds();
// Génère : cst_test_abc123, sub_test_def456
```

## 📱 Interface utilisateur

### 1. Modal de sélection des plans

```typescript
<PlanModal
  isOpen={isPlanModalOpen}
  onClose={() => setIsPlanModalOpen(false)}
  userProfile={userProfile}
  onSelectPlan={handleSelectPlan}
/>
```

### 2. Page de succès

```
/payment/success?plan=pro_individual&payment_id=tr_abc123
```

## 🔍 Monitoring

### 1. Logs Mollie

```javascript
console.log("✅ Checkout Mollie créé:", {
  paymentId: payment.id,
  planId: planId,
  amount: plan.price,
  userEmail: userEmail,
});
```

### 2. Dashboard Mollie

- Suivre les paiements en temps réel
- Analyser les échecs de paiement
- Gérer les abonnements récurrents

## 🚨 Gestion des erreurs

### 1. Échecs de paiement

```javascript
switch (payment.status) {
  case "failed":
  case "canceled":
  case "expired":
    await handlePaymentFailure(payment);
    // Notifier l'utilisateur
    // Proposer une nouvelle tentative
    break;
}
```

### 2. Problèmes d'abonnement

```javascript
// Détecter les abonnements expirés
if (subscription.status === "canceled") {
  // Revenir au plan gratuit
  // Envoyer un email de réactivation
}
```

## 📊 Analytics et reporting

### 1. Métriques importantes

- Taux de conversion checkout
- Churn rate mensuel
- Revenue mensuel récurrent (MRR)
- Méthodes de paiement populaires

### 2. Données disponibles

```javascript
// Via l'API Mollie
const payments = await mollieClient.payments.list();
const subscriptions = await mollieClient.subscriptions.list();
```

## 🔄 Migration vers production

### 1. Checklist déploiement

- [ ] Remplacer `test_` par `live_` dans MOLLIE_API_KEY
- [ ] Configurer les webhooks de production
- [ ] Tester les paiements réels avec de petits montants
- [ ] Configurer les emails de confirmation
- [ ] Mettre en place la surveillance des erreurs

### 2. URLs de production

```
Webhook: https://tropflow-pro.vercel.app/api/mollie-payment?webhook=true
Return:  https://tropflow-pro.vercel.app/payment/success
```

## 📞 Support

### 1. Documentation Mollie

- [API Reference](https://docs.mollie.com/reference/v2/payments-api/create-payment)
- [Webhooks](https://docs.mollie.com/guides/webhooks)
- [Subscriptions](https://docs.mollie.com/guides/subscriptions)

### 2. Contact

- Support Mollie : [support@mollie.com](mailto:support@mollie.com)
- Documentation TropFlow Pro : Ce fichier

---

## ✅ Checklist d'intégration

- [ ] Compte Mollie créé et vérifié
- [ ] Clés API configurées (test puis production)
- [ ] Package `@mollie/api-client` installé
- [ ] API `/api/mollie-payment.js` déployée
- [ ] Webhooks configurés dans Mollie
- [ ] Page `PaymentSuccess` créée
- [ ] Tests de paiement réalisés
- [ ] Gestion des erreurs implémentée
- [ ] Migration production planifiée

**TropFlow Pro + Mollie = Paiements européens simplifiés ! 🇪🇺💳**
