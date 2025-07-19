# 🔧 Configuration des variables d'environnement - TropFlow Pro

## 📋 Variables requises

Pour que l'intégration Mollie fonctionne, vous devez configurer les variables d'environnement suivantes :

### 🏠 Fichier `.env.local` (développement local)

Créez un fichier `.env.local` à la racine du projet :

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your_app_id

# Resend Email Service
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com

# Mollie Payment Service (MODE TEST)
MOLLIE_API_KEY=test_dHar4XY7LxsDOtmnkVtjNVWXLSlXsM

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:3000/api
```

### ☁️ Configuration Vercel (production)

Dans votre dashboard Vercel :

1. Aller dans **Settings** > **Environment Variables**
2. Ajouter ces variables :

| Nom                   | Valeur                        | Environnement         |
| --------------------- | ----------------------------- | --------------------- |
| `MOLLIE_API_KEY`      | `test_dHar4XY7...`            | Preview + Development |
| `MOLLIE_API_KEY`      | `live_dHar4XY7...`            | Production            |
| `RESEND_API_KEY`      | `re_...`                      | Tous                  |
| `FROM_EMAIL`          | `noreply@yourdomain.com`      | Tous                  |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production            |

## 🎯 Obtenir les clés API

### 1. Clé Mollie

1. Créer un compte sur [mollie.com](https://mollie.com)
2. Aller dans **Développeurs** > **Clés API**
3. Copier la clé de **test** : `test_dHar4XY7...`
4. Pour la production, utiliser la clé **live** : `live_dHar4XY7...`

### 2. Clé Resend

1. Créer un compte sur [resend.com](https://resend.com)
2. Aller dans **API Keys**
3. Créer une nouvelle clé : `re_...`

## 🚀 Test de configuration

Pour vérifier que tout fonctionne :

```bash
# 1. Démarrer l'application
npm start

# 2. Aller sur une page avec "Mettre à niveau"
# 3. Cliquer sur un plan premium
# 4. Vérifier que la redirection Mollie se fait

# Si OK : Vous verrez "🔗 Redirection vers Mollie pour..."
# Si KO : Erreur "MOLLIE_API_KEY manquante"
```

## 🔐 Sécurité

- ❌ **JAMAIS** commiter les fichiers `.env*`
- ✅ Utiliser `.env.local` pour le développement
- ✅ Configurer les variables sur Vercel pour la production
- ✅ Utiliser les clés `test_` en développement
- ✅ Utiliser les clés `live_` uniquement en production

## 🔄 Migration test → production

1. **Vérifier** que tous les paiements test fonctionnent
2. **Remplacer** `MOLLIE_API_KEY` par la clé live sur Vercel
3. **Configurer** les webhooks de production :
   ```
   https://your-app.vercel.app/api/mollie-payment?webhook=true
   ```
4. **Tester** avec de vrais paiements (petits montants)

## 📞 Support

- [Documentation Mollie](https://docs.mollie.com)
- [Dashboard Mollie](https://my.mollie.com)
- [Support Mollie](mailto:support@mollie.com)

---

🎉 **Une fois configuré, les paiements Mollie seront 100% fonctionnels !**
