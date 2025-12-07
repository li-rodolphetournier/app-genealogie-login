# ✅ Migration vers Supabase Auth - COMPLÈTE

## 🎉 Modifications Réalisées

Toutes les modifications pour migrer vers **Supabase Auth** ont été effectuées avec succès !

### 📋 Fichiers Modifiés

#### 1. ✅ Script de Migration (`scripts/migrate-users-to-supabase-auth.ts`)
- **Nouveau fichier créé**
- Migre tous les utilisateurs de `users.json` vers Supabase Auth
- Crée les profils dans la table `users`
- Gère les utilisateurs existants

#### 2. ✅ Route API Login (`src/app/api/auth/login/route.ts`)
- **Refactorisé pour utiliser Supabase Auth**
- Utilise `supabase.auth.signInWithPassword()`
- Récupère le profil depuis la table `users`
- Supporte login par email ou par login (recherche dans users)

#### 3. ✅ Hook use-auth (`src/hooks/use-auth.ts`)
- **Refactorisé pour utiliser Supabase Auth**
- Utilise `supabase.auth.getUser()` au lieu de localStorage
- Écoute les changements d'authentification
- Récupère le profil depuis la table `users`

#### 4. ✅ Page Login (`src/app/page.tsx`)
- **Mis à jour**
- Supprimé `localStorage.setItem()` (plus nécessaire)
- Supabase Auth gère les sessions via cookies httpOnly

#### 5. ✅ Package.json
- **Ajouté le script** : `npm run migrate:auth`

## 🚀 Prochaines Étapes

### Étape 1 : Vérifier la Configuration Supabase

1. **Vérifier les variables d'environnement** dans `.env.local` :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ... (SECRÈTE!)
   ```

2. **Vérifier que Supabase Auth est activé** :
   - Aller dans Supabase Dashboard → Authentication → Providers
   - Vérifier que "Email" est activé

### Étape 2 : Adapter le Schéma Supabase

⚠️ **IMPORTANT** : Le schéma actuel a une table `users` avec `password_hash`, mais avec Supabase Auth :
- Les utilisateurs sont dans `auth.users` (géré par Supabase)
- La table `public.users` doit stocker uniquement les métadonnées (login, status, etc.)
- **Supprimer** le champ `password_hash` de `public.users`

**Script SQL à exécuter dans Supabase** :

```sql
-- Supprimer le champ password_hash de la table users
-- (Supabase Auth gère les mots de passe)
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;

-- Mettre à jour la table pour utiliser l'ID de auth.users
ALTER TABLE public.users 
  ALTER COLUMN id TYPE UUID USING id::UUID,
  ALTER COLUMN id SET DEFAULT uuid_generate_v4();
  
-- Si la table n'existe pas encore, la créer sans password_hash
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    login TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('administrateur', 'utilisateur', 'redacteur')),
    profile_image TEXT,
    description TEXT,
    detail TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Étape 3 : Migrer les Utilisateurs

Exécuter le script de migration :

```bash
npm run migrate:auth
```

Ce script va :
- Lire tous les utilisateurs de `src/data/users.json`
- Créer chaque utilisateur dans Supabase Auth
- Créer le profil dans la table `public.users`

### Étape 4 : Tester l'Authentification

1. **Démarrer le serveur** :
   ```bash
   npm run dev
   ```

2. **Tester le login** avec un utilisateur migré :
   - Aller sur `http://localhost:3000`
   - Se connecter avec un email/mot de passe migré
   - Vérifier que la session fonctionne

3. **Tester le logout** :
   - Se déconnecter
   - Vérifier que la session est bien supprimée

## 🔒 Sécurité Améliorée

### Avant (❌ Problématique)
- ⚠️ Mots de passe en clair dans `users.json`
- ⚠️ Sessions dans localStorage (vulnérable XSS)
- ⚠️ Pas de protection brute force
- ⚠️ Code personnalisé (risques)

### Après (✅ Sécurisé)
- ✅ Mots de passe hashés automatiquement par Supabase
- ✅ Sessions dans cookies httpOnly (sécurisés)
- ✅ Rate limiting intégré (protection brute force)
- ✅ Tokens JWT avec expiration automatique
- ✅ Service testé et certifié (SOC 2)

## 📝 Notes Importantes

### Migration Progressive

Le système supporte actuellement **deux méthodes d'identification** :

1. **Par email** : Connexion directe avec l'email
2. **Par login** : Si l'email ne fonctionne pas, recherche dans la table `users` par login

Cela permet une migration en douceur.

### Table `users` vs `auth.users`

- **`auth.users`** : Géré par Supabase Auth
  - Contient : email, password hash (automatique), metadata
  - Accès : Via `supabase.auth.*`

- **`public.users`** : Votre table personnalisée
  - Contient : login, status, description, profile_image, etc.
  - Accès : Via `supabase.from('users')`
  - **Relation** : `id` fait référence à `auth.users.id`

### Compatibilité

Le code est maintenant prêt pour Supabase Auth. Cependant, si vous n'avez pas encore migré les utilisateurs :
- Les anciens utilisateurs ne pourront pas se connecter
- Il faut d'abord exécuter `npm run migrate:auth`

## 🎯 Checklist de Migration

- [x] Script de migration créé
- [x] Route API login mise à jour
- [x] Hook use-auth mis à jour
- [x] Page Login mise à jour
- [x] Script ajouté dans package.json
- [ ] Variables d'environnement configurées
- [ ] Schéma Supabase adapté (supprimer password_hash)
- [ ] Utilisateurs migrés (`npm run migrate:auth`)
- [ ] Tests d'authentification réussis
- [ ] Ancien code nettoyé (optionnel)

## 🐛 Dépannage

### Erreur : "Missing Supabase environment variables"
- Vérifier que `.env.local` contient les variables nécessaires
- Redémarrer le serveur après modification

### Erreur : "Table 'users' does not exist"
- Exécuter le schéma SQL dans Supabase Dashboard
- Vérifier que la table `users` a été créée

### Erreur : "Invalid login credentials"
- Vérifier que les utilisateurs ont été migrés
- Vérifier que l'email est correct
- Essayer avec le login si l'email ne fonctionne pas

### Utilisateur ne peut pas se connecter
- Vérifier que l'utilisateur existe dans Supabase Auth
- Vérifier que le mot de passe est correct
- Vérifier que l'email est confirmé (le script le fait automatiquement)

## 📚 Documentation

- [Plan de Migration Supabase Auth](./PLAN_MIGRATION_SUPABASE_AUTH.md)
- [Pourquoi Supabase Auth est plus sûr](./SUPABASE_AUTH_SECURITE.md)
- [Guide de Migration Supabase](./MIGRATION_GUIDE.md)

---

**Statut** : ✅ Migration vers Supabase Auth complète
**Date** : Aujourd'hui
**Prochaine étape** : Migrer les utilisateurs et tester

