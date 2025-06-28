# 🚀 TripFlow

**Gestionnaire de frais de déplacement professionnel moderne et intelligent**

TripFlow est une application web complète pour gérer, suivre et soumettre vos notes de frais de déplacement professionnel. Conçue avec une architecture robuste et une interface utilisateur intuitive.

![TripFlow](https://img.shields.io/badge/TripFlow-v1.0.0-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase)

## ✨ Fonctionnalités principales

### 🎯 **Gestion des déplacements**

- ✅ Création et suivi de déplacements professionnels
- ✅ Informations complètes : destination, dates, objet, collaborateur
- ✅ Vue d'ensemble avec statuts et résumés financiers
- ✅ Édition et suppression des déplacements

### 💰 **Notes de frais intelligentes**

- ✅ **5 catégories** : Transport longue distance, Transport courte distance, Hébergement, Repas, Autres
- ✅ **Upload de factures** avec support PDF, PNG, JPG
- ✅ **Montants Véloce et Personnel** séparés
- ✅ **Stockage Firebase** sécurisé pour les documents
- ✅ Validation et calculs automatiques

### 📧 **Rapports et envoi d'emails**

- ✅ **Génération PDF** professionnelle avec jsPDF
- ✅ **Envoi d'emails automatisé** via Resend
- ✅ **Factures en pièces jointes** (production)
- ✅ **Liens directs** vers les factures (développement)
- ✅ **Templates d'email** personnalisés et professionnels

### 🎨 **Interface utilisateur**

- ✅ **Mode sombre/clair** avec persistance
- ✅ **Design responsive** adaptatif mobile/desktop
- ✅ **Composants réutilisables** avec Tailwind CSS
- ✅ **Navigation intuitive** et moderne
- ✅ **Feedback utilisateur** avec notifications

### 🔐 **Sécurité et authentification**

- ✅ **Authentification Firebase** sécurisée
- ✅ **Gestion des sessions** automatique
- ✅ **Protection des routes** privées
- ✅ **Variables d'environnement** pour les clés sensibles

### 📱 **Progressive Web App (PWA)**

- ✅ **Installation** sur mobile/desktop
- ✅ **Mode hors ligne** basique
- ✅ **Icônes et manifest** optimisés
- ✅ **Service Worker** configuré

## 🏗️ Architecture technique

### **Frontend**

- **React 18** avec TypeScript
- **Tailwind CSS** pour le styling
- **Zustand** pour la gestion d'état
- **React Hook Form + Yup** pour les formulaires
- **React Router** pour la navigation
- **Lucide React** pour les icônes

### **Backend & Services**

- **Firebase Authentication** pour les utilisateurs
- **Firebase Storage** pour les documents
- **Vercel Functions** pour l'API serverless
- **Resend** pour l'envoi d'emails

### **Outils et génération**

- **jsPDF + html2canvas** pour les rapports PDF
- **Date-fns** pour la gestion des dates
- **TypeScript** pour la sécurité des types

## 🚀 Installation et déploiement

### **Prérequis**

- Node.js 18+
- Compte Firebase avec projet configuré
- Compte Resend avec domaine vérifié
- Compte Vercel (pour la production)

### **Installation locale**

```bash
# Cloner le repository
git clone https://github.com/votre-username/tripflow.git
cd tripflow

# Installer les dépendances
npm install

# Configuration des variables d'environnement
# Créer .env.local avec vos clés :
cp .env.example .env.local

# Démarrer en mode développement
npm start
```

### **Variables d'environnement (.env.local)**

```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=votre_cle_firebase
REACT_APP_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=votre-projet-id
REACT_APP_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=votre-sender-id
REACT_APP_FIREBASE_APP_ID=votre-app-id

# Resend Configuration
REACT_APP_RESEND_API_KEY=re_votre_cle_resend
REACT_APP_FROM_EMAIL=noreply@votre-domaine.com
```

### **Déploiement sur Vercel**

```bash
# Installation CLI Vercel
npm i -g vercel

# Déploiement
vercel

# Configuration des variables d'environnement sur Vercel :
# Dashboard → Settings → Environment Variables
RESEND_API_KEY=re_votre_cle_resend
FROM_EMAIL=noreply@votre-domaine.com
```

## 📋 Structure du projet

```
TripFlow/
├── public/              # Fichiers publics et PWA
├── src/
│   ├── components/      # Composants réutilisables
│   │   ├── auth/        # Composants d'authentification
│   │   ├── forms/       # Formulaires spécialisés
│   │   └── ...
│   ├── pages/           # Pages de l'application
│   ├── hooks/           # Hooks personnalisés
│   ├── contexts/        # Contextes React
│   ├── services/        # Services Firebase
│   ├── store/           # Gestion d'état Zustand
│   ├── types/           # Types TypeScript
│   ├── utils/           # Utilitaires (PDF, emails)
│   └── config/          # Configuration Firebase/Resend
├── api/                 # Fonctions Vercel serverless
└── ...
```

## 🎯 Utilisation

### **1. Création d'un déplacement**

1. Connexion avec Firebase Auth
2. "Nouveau déplacement" → Remplir les informations
3. Validation et sauvegarde automatique

### **2. Ajout de notes de frais**

1. Sélectionner un déplacement
2. "Ajouter une note" → Choisir la catégorie
3. Saisir montant, description, date
4. Upload optionnel de facture (PDF/PNG/JPG)
5. Marquage Véloce/Personnel selon besoin

### **3. Génération de rapport**

1. Depuis le détail d'un déplacement
2. "PDF Rapport" → Génération automatique
3. "Factures" → Téléchargement individuel
4. "Envoyer par email" → Envoi avec pièces jointes

### **4. Modes de fonctionnement**

#### **Développement (localhost)**

- Mode simulation pour les emails
- Liens directs vers Firebase Storage
- Logs détaillés dans la console

#### **Production (Vercel)**

- Envoi réel d'emails via API serverless
- Factures téléchargées et attachées
- Performance optimisée

## 🔧 Scripts disponibles

```bash
# Développement
npm start           # Démarrer en mode développement
npm run build       # Build de production
npm test           # Lancer les tests
npm run eject      # Ejecter la configuration (attention!)

# Déploiement
vercel             # Déployer sur Vercel
vercel --prod      # Déploiement en production
```

## 🎨 Personnalisation

### **Thèmes**

- Mode sombre/clair automatique
- Persistance dans localStorage
- Adaptation système utilisateur

### **Catégories de frais**

Modifiables dans `src/types/index.ts` :

- `transport_long` - Transport longue distance
- `transport_short` - Transport courte distance
- `accommodation` - Hébergement
- `meals` - Repas
- `other` - Autres frais

### **Templates d'email**

Personnalisables dans `src/utils/emails.ts` et `api/send-email.js`

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

- **Issues** : [GitHub Issues](https://github.com/votre-username/tripflow/issues)
- **Documentation** : Ce README + commentaires dans le code
- **Email** : support@votre-domaine.com

## 🙏 Remerciements

- **React Team** pour le framework
- **Firebase** pour les services backend
- **Vercel** pour l'hébergement
- **Resend** pour l'envoi d'emails
- **Tailwind CSS** pour le design system

---

**Développé avec ❤️ pour simplifier la gestion des frais professionnels**

![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react)
![Powered by Firebase](https://img.shields.io/badge/Powered%20by-Firebase-FFCA28?style=for-the-badge&logo=firebase)
![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel)
