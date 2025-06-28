# Configuration des Variables d'Environnement

## 📁 Créer le fichier `.env.local`

Créez un fichier `.env.local` dans le dossier racine du projet (même niveau que `package.json`) :

```bash
# Configuration Firebase
REACT_APP_FIREBASE_API_KEY=AIzaSyBjHlquBBMQXH7C1E82Ib9Vw3wRbf5ZGlg
REACT_APP_FIREBASE_AUTH_DOMAIN=oktra-expense-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=oktra-expense-app
REACT_APP_FIREBASE_STORAGE_BUCKET=oktra-expense-app.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=97492631647
REACT_APP_FIREBASE_APP_ID=1:97492631647:web:dde5c811aeea458ce3dbea

# Configuration Resend pour l'envoi d'emails
# Obtenez votre clé API sur: https://resend.com/api-keys
REACT_APP_RESEND_API_KEY=re_your_api_key_here
REACT_APP_FROM_EMAIL=noreply@votre-domaine.com
```

## 🔒 Sécurité

Le fichier `.env.local` :

- ✅ Est automatiquement ignoré par Git
- ✅ Contient les clés sensibles
- ✅ N'est pas partagé publiquement
- ✅ Reste local à votre machine

## 🚀 Redémarrage

Après avoir créé le fichier `.env.local` :

1. Arrêtez l'application (`Ctrl+C`)
2. Redémarrez avec `npm start`
3. Les variables d'environnement seront chargées

## ✅ Vérification

Pour vérifier que les variables sont chargées :

- Ouvrez la console du navigateur (F12)
- L'application devrait fonctionner normalement
- Aucune erreur Firebase ne devrait apparaître
