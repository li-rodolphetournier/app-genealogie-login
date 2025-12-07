# 📍 Localisation des Logs et Mots de Passe

## 🔐 Mots de Passe

### Fichier principal : `src/data/users.json`

**Localisation** : `C:\Users\rorot\workspace\app-genealogie-login\src\data\users.json`

**Contenu** :
- Tous les utilisateurs sont stockés dans ce fichier JSON
- Les mots de passe sont actuellement en **clair** dans ce fichier
- ⚠️ **ATTENTION** : Les mots de passe ne devraient pas être en clair en production

**Structure** :
```json
[
  {
    "login": "admin",
    "password": "OctobreHalloween2024",  // ⚠️ Mot de passe en clair
    "email": "monsieur@example.com",
    "status": "administrateur",
    ...
  },
  ...
]
```

### Utilisateurs actuels (exemples) :

1. **admin**
   - Login : `admin`
   - Password : `OctobreHalloween2024`
   - Status : `administrateur`

2. **redacteur**
   - Login : `redacteur`
   - Password : `OctobreHalloween2024`
   - Status : `redacteur`

3. **utilisateur**
   - Login : `utilisateur`
   - Password : `OctobreHalloween2024`
   - Status : `utilisateur`

4. **MarieGe**
   - Login : `MarieGe`
   - Password : `DecembreNoel2024`
   - Status : `utilisateur`

5. **Florian**
   - Login : `Florian`
   - Password : `DecembreNoel2024`
   - Status : `utilisateur`

6. **rodolphe**
   - Login : `rodolphe`
   - Password : `rodolphe`
   - Status : `administrateur`

### Sécurité actuelle

**État** : 
- ⚠️ Les nouveaux utilisateurs créés via `/api/users` ont leurs mots de passe **hashés** avec bcrypt
- ⚠️ Les anciens utilisateurs ont leurs mots de passe **en clair**
- Le système gère les deux formats (clair et hashé) pour la compatibilité

**Recommandation** :
- Hasher tous les mots de passe existants
- Migrer vers Supabase pour une sécurité renforcée

## 📋 Logs

### Logs de la console

**Localisation** : Console du terminal/Node.js

Les logs sont actuellement envoyés vers :
- **Console du terminal** où `npm run dev` est exécuté
- **Console du navigateur** (pour les logs côté client)

### Types de logs

1. **Logs d'erreurs** (`console.error`)
   - Localisation : Routes API, composants
   - Exemples :
     - `src/app/api/auth/login/route.ts` : Erreurs de connexion
     - `src/lib/errors/error-handler.ts` : Logging structuré des erreurs
     - Toutes les routes API : Erreurs de traitement

2. **Logs de debug** (`console.log`)
   - Localisation : Composants clients
   - Exemples :
     - `src/components/ImageResizer.tsx` : Logs de redimensionnement
     - `src/app/genealogie/genealogie-client.tsx` : Logs d'upload d'images

3. **Logs structurés**
   - Localisation : `src/lib/errors/error-handler.ts`
   - Fonction : `logError()` pour logging structuré avec timestamps

### Fichiers de log

**Actuellement** : ❌ Aucun fichier de log persistant

**Recommandation** :
- Créer un système de logging vers fichiers
- Utiliser un service de logging (ex: Winston, Pino)
- Logs dans `logs/` ou `/var/log/`

## 🔍 Où trouver les informations

### Mots de passe

```
📁 src/data/
  └── users.json  ← Tous les utilisateurs et mots de passe
```

### Logs

```
📋 Console du terminal
  └── Où npm run dev est exécuté

📋 Console du navigateur
  └── F12 → Console (pour les logs clients)
```

## 📝 Recommandations

### Pour les mots de passe

1. ✅ **Hasher tous les mots de passe** avec bcrypt
2. ✅ **Migrer vers Supabase** (Phase future)
3. ⚠️ **Ne jamais commiter** le fichier `users.json` si il contient des mots de passe en clair
4. ✅ **Utiliser des variables d'environnement** pour les secrets

### Pour les logs

1. ✅ **Créer un système de logging** vers fichiers
2. ✅ **Structured logging** avec niveaux (info, warn, error)
3. ✅ **Rotation des logs** pour éviter les fichiers trop volumineux
4. ✅ **Logs en production** vers un service externe (ex: LogRocket, Sentry)

## 🔒 Sécurité

### Actions à faire

1. ⚠️ **Immédiat** : Ajouter `src/data/users.json` au `.gitignore` si non déjà fait
2. ✅ **Courant** : Tous les nouveaux mots de passe sont hashés
3. ✅ **Future** : Migrer tous les mots de passe vers format hashé
4. ✅ **Future** : Migrer vers Supabase Auth

---

**Date** : Aujourd'hui
**Statut** : Documentation à jour

