# Configuration Resend pour TripFlow

## 🚀 Activation de l'envoi d'emails réel

Actuellement, le système d'emails fonctionne en mode simulation. Pour activer l'envoi réel avec Resend :

### 1. 🔑 Obtenir une clé API Resend

1. Créez un compte sur [Resend.com](https://resend.com)
2. Allez dans **API Keys** 
3. Créez une nouvelle clé API
4. Copiez votre clé (format: `re_xxxxxxxxxx`)

### 2. 📧 Vérifier votre domaine

1. Dans Resend, allez dans **Domains**
2. Ajoutez votre domaine (ex: `votre-entreprise.com`)
3. Configurez les enregistrements DNS
4. Attendez la validation

### 3. ⚙️ Configurer les variables d'environnement

Créez un fichier `.env` dans le dossier racine avec :

```bash
# Clé API Resend
REACT_APP_RESEND_API_KEY=re_votre_cle_api_ici

# Email expéditeur vérifié
REACT_APP_FROM_EMAIL=noreply@votre-domaine.com
```

### 4. 🔄 Alternative : Configuration directe

Si vous préférez, modifiez directement `src/config/resend.ts` :

```typescript
export const RESEND_CONFIG = {
  API_KEY: 're_votre_cle_api_ici',
  FROM_EMAIL: 'noreply@votre-domaine.com',
  FROM_NAME: 'TripFlow - Gestionnaire de Notes de Frais'
};
```

## ✅ Vérification

Une fois configuré :
- Redémarrez l'application (`npm start`)
- Testez l'envoi d'un email
- Vérifiez les logs dans la console (F12)

## 📋 Fonctionnalités activées

- ✅ Envoi d'emails avec Resend
- ✅ Pièces jointes (factures PDF/PNG/JPG)
- ✅ Rapports de déplacements complets
- ✅ Notifications individuelles
- ✅ Mode simulation automatique si non configuré

## 🔍 Debug

Si les emails ne partent pas, vérifiez :
1. La clé API est correcte
2. Le domaine expéditeur est vérifié
3. Pas d'erreurs dans la console
4. Les variables d'environnement sont chargées 