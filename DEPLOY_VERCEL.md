# 🚀 Guide de déploiement TripFlow sur Vercel

## 📋 Étapes de déploiement

### 1. **Pré-requis**

- ✅ Compte [Vercel](https://vercel.com) créé
- ✅ Clé API Resend valide (`re_...`)
- ✅ Email expéditeur vérifié sur Resend

### 2. **Déploiement sur Vercel**

1. **Connecter le projet**

   ```bash
   # Option 1: Interface web Vercel
   # Allez sur vercel.com → Import Git Repository

   # Option 2: CLI Vercel
   npm i -g vercel
   vercel
   ```

2. **Configuration des variables d'environnement**

   Sur le dashboard Vercel → Settings → Environment Variables :

   ```
   RESEND_API_KEY = [votre_clé_api_resend]
   FROM_EMAIL = [votre_email_vérifié]
   ```

### 3. **Vérification du déploiement**

Une fois déployé, testez :

- ✅ Navigation de l'app
- ✅ Création de déplacements
- ✅ Upload de factures
- ✅ **Envoi d'email avec factures** 🎯

### 4. **Fonctionnement des emails**

#### 🔧 **En développement (localhost)**

- Mode simulation
- Affichage du contenu dans la console
- Liens vers les factures Firebase

#### 🌐 **En production (Vercel)**

- Envoi réel via API Vercel
- Rapport PDF généré côté serveur
- Toutes les factures en pièces jointes
- Email professionnel complet

### 5. **Structure des emails en production**

L'email contiendra :

- 📧 **Rapport HTML** stylisé avec toutes les infos
- 📎 **Factures en pièces jointes** (PDF, PNG, JPG)
- 🏷️ **Noms de fichiers propres** : `PI_Planning-Avion-1.pdf`

### 6. **Debugging**

Si problèmes :

1. Vérifiez les logs Vercel : Dashboard → Functions → Logs
2. Testez les variables d'environnement
3. Vérifiez que votre domaine Resend est vérifié

## 🎉 Résultat final

Une fois déployé, TripFlow enverra des **emails professionnels complets** avec :

- ✅ Rapport PDF détaillé
- ✅ Toutes les factures attachées
- ✅ Format professionnel
- ✅ Aucun problème CORS
- ✅ Performance optimale

**Prêt pour la production ! 🚀**
