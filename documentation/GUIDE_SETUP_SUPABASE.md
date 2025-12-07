# 🚀 Guide Complet : Configuration Supabase Auth

## 📋 Vue d'Ensemble

Ce guide vous accompagne étape par étape pour configurer Supabase Auth dans votre application.

## ✅ Fichiers Créés

### 1. **Script SQL Complet** : `supabase/migration-auth-complete.sql`
   - Script à exécuter dans Supabase Dashboard
   - Adapte la table `users` pour Supabase Auth
   - Configure Row Level Security (RLS)
   - Crée les triggers et fonctions nécessaires

### 2. **Schéma Auth** : `supabase/schema-auth.sql`
   - Schéma dédié pour Supabase Auth
   - Version simplifiée pour référence

## 🎯 Étapes de Configuration

### Étape 1 : Créer/Configurer le Projet Supabase

1. **Aller sur https://supabase.com**
2. **Créer un compte** ou se connecter
3. **Créer un nouveau projet** :
   - Nom : `app-genealogie` (ou votre choix)
   - Mot de passe de la base : Créer un mot de passe fort ⚠️
   - Région : Choisir la région la plus proche
4. **Attendre** que le projet soit créé (2-3 minutes)

### Étape 2 : Récupérer les Clés API

1. Dans votre projet Supabase, aller dans **Settings** → **API**
2. **Copier les valeurs** :
   - **Project URL** → Notez cette URL
   - **anon/public key** → Notez cette clé
   - **service_role key** → ⚠️ **SECRÈTE !** Ne jamais partager

### Étape 3 : Configurer les Variables d'Environnement

Créer ou modifier le fichier `.env.local` à la racine du projet :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Important** :
- Le fichier `.env.local` est déjà dans `.gitignore`
- Ne jamais commiter ce fichier
- Ne jamais partager `SUPABASE_SERVICE_ROLE_KEY`

### Étape 4 : Exécuter le Schéma SQL

1. Dans **Supabase Dashboard**, aller dans **SQL Editor**
2. Cliquer sur **New Query**
3. **Ouvrir le fichier** `supabase/migration-auth-complete.sql`
4. **Copier-coller** tout le contenu dans l'éditeur SQL
5. Cliquer sur **Run** (ou `Ctrl+Enter`)
6. **Vérifier** qu'il n'y a pas d'erreurs dans les résultats

### Étape 5 : Activer Email Auth

1. Dans **Supabase Dashboard**, aller dans **Authentication** → **Providers**
2. Vérifier que **Email** est activé
3. Optionnel : Configurer les templates d'email

### Étape 6 : Configurer les URLs de Redirection (Optionnel)

1. Dans **Authentication** → **URL Configuration**
2. Ajouter les URLs suivantes :
   - `http://localhost:3000/**` pour le développement
   - Votre domaine de production pour la prod

## 🔐 Ce que fait le Script SQL

### 1. Adapte la Table `users`

- ✅ Supprime le champ `password_hash` (géré par Supabase Auth)
- ✅ Lie la table avec `auth.users` via l'ID
- ✅ Configure la cascade delete (si utilisateur supprimé de Auth, profil supprimé)

### 2. Configure Row Level Security (RLS)

- ✅ Les utilisateurs peuvent voir et modifier leur propre profil
- ✅ Les administrateurs peuvent voir et modifier tous les profils
- ✅ Le service role peut créer des profils (pour la migration)

### 3. Crée les Triggers

- ✅ Trigger pour créer automatiquement un profil après inscription
- ✅ Trigger pour mettre à jour `updated_at` automatiquement

## 📝 Structure de la Table `users` Après Migration

```sql
CREATE TABLE public.users (
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

**Différences importantes** :
- ❌ Plus de `password_hash` (géré par Supabase Auth dans `auth.users`)
- ✅ `id` est maintenant une foreign key vers `auth.users(id)`
- ✅ Cascade delete automatique

## 🚀 Prochaine Étape : Migrer les Utilisateurs

Une fois le schéma configuré, migrer les utilisateurs :

```bash
npm run migrate:auth
```

Ce script va :
- Lire tous les utilisateurs de `src/data/users.json`
- Créer chaque utilisateur dans Supabase Auth
- Créer le profil dans la table `public.users`

## 🐛 Dépannage

### Erreur : "relation 'auth.users' does not exist"

Cela signifie que vous n'êtes pas dans le bon projet Supabase ou que le projet n'est pas complètement initialisé. Vérifiez que :
- Vous êtes dans le bon projet
- Le projet est complètement créé (attendre quelques minutes)

### Erreur : "column 'password_hash' does not exist"

C'est normal si la table n'a pas encore été créée. Le script gère cela automatiquement.

### Erreur : "permission denied for table users"

Vérifiez que vous utilisez le bon compte avec les permissions nécessaires.

### La table existe déjà avec password_hash

Le script gère automatiquement la suppression de `password_hash`. Si vous avez des erreurs, exécutez d'abord :

```sql
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;
```

## ✅ Vérification

### Vérifier que la table existe

1. Dans **Supabase Dashboard** → **Table Editor**
2. Vous devriez voir la table `users` dans la liste

### Vérifier la structure

Dans **SQL Editor**, exécuter :

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;
```

Vous ne devriez **PAS** voir `password_hash` dans les résultats.

### Vérifier les politiques RLS

Dans **Supabase Dashboard** → **Authentication** → **Policies**, vous devriez voir les politiques pour `users`.

## 📚 Documentation Complémentaire

- [Instructions Migration Auth](./INSTRUCTIONS_MIGRATION_AUTH.md)
- [Plan Migration Supabase Auth](./PLAN_MIGRATION_SUPABASE_AUTH.md)
- [Pourquoi Supabase Auth est plus sûr](./SUPABASE_AUTH_SECURITE.md)
- [Setup Complet Supabase](./SUPABASE_SETUP_COMPLET.md)

---

**Tout est prêt !** Suivez ces étapes pour configurer Supabase complètement.

