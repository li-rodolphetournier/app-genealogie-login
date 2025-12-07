# 🚀 Configuration Complète Supabase Auth

## ✅ Fichiers Créés pour Supabase

### 1. Schema pour Supabase Auth (`supabase/schema-auth.sql`)
- Table `users` adaptée pour Supabase Auth
- Pas de `password_hash` (géré par Supabase)
- Relation avec `auth.users` via l'ID

### 2. Script de Migration Complet (`supabase/migration-auth-complete.sql`)
- Script à exécuter dans Supabase Dashboard
- Adapte la table existante ou crée une nouvelle
- Configure RLS (Row Level Security)
- Crée les triggers et fonctions nécessaires

## 📋 Étapes de Configuration

### Étape 1 : Créer/Configurer le Projet Supabase

1. **Aller sur https://supabase.com**
2. **Créer un compte** ou se connecter
3. **Créer un nouveau projet** :
   - Nom : `app-genealogie` (ou votre choix)
   - Mot de passe de la base : Créer un mot de passe fort
   - Région : Choisir la région la plus proche
4. **Attendre** que le projet soit créé (2-3 minutes)

### Étape 2 : Récupérer les Clés API

1. Dans votre projet Supabase, aller dans **Settings** → **API**
2. **Copier les valeurs** :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **SECRÈTE !**

### Étape 3 : Configurer les Variables d'Environnement

Créer ou modifier `.env.local` à la racine du projet :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Important** :
- Ne jamais commiter `.env.local` (déjà dans `.gitignore`)
- Ne jamais partager `SUPABASE_SERVICE_ROLE_KEY`

### Étape 4 : Exécuter le Schéma SQL

1. Dans Supabase Dashboard, aller dans **SQL Editor**
2. Cliquer sur **New Query**
3. **Copier-coller** le contenu de `supabase/migration-auth-complete.sql`
4. Cliquer sur **Run** (ou Ctrl+Enter)
5. Vérifier que tout s'est bien exécuté

### Étape 5 : Activer Email Auth

1. Dans Supabase Dashboard, aller dans **Authentication** → **Providers**
2. Vérifier que **Email** est activé
3. Optionnel : Configurer les templates d'email

### Étape 6 : Configurer les URLs de Redirection (Optionnel)

1. Dans **Authentication** → **URL Configuration**
2. Ajouter :
   - `http://localhost:3000/**` pour le développement
   - Votre domaine de production pour la prod

## 🔐 Sécurité : Row Level Security (RLS)

Le script configure automatiquement les politiques RLS :

- ✅ **Les utilisateurs** peuvent voir et modifier leur propre profil
- ✅ **Les administrateurs** peuvent voir et modifier tous les profils
- ✅ **Le service role** peut créer des profils (pour la migration)

## 📝 Structure de la Table `users`

Après l'exécution du script, la table `users` aura cette structure :

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

**Différences avec l'ancien schéma** :
- ❌ Plus de `password_hash` (géré par Supabase Auth)
- ✅ `id` est maintenant une foreign key vers `auth.users(id)`
- ✅ Cascade delete : si l'utilisateur est supprimé de `auth.users`, le profil est supprimé automatiquement

## 🚀 Prochaine Étape : Migrer les Utilisateurs

Une fois le schéma configuré, migrer les utilisateurs :

```bash
npm run migrate:auth
```

## 🐛 Vérification

### Vérifier que la table existe

Dans Supabase Dashboard → **Table Editor**, vous devriez voir la table `users`.

### Vérifier les politiques RLS

Dans Supabase Dashboard → **Authentication** → **Policies**, vous devriez voir les politiques pour `users`.

### Tester la connexion

1. Démarrer le serveur : `npm run dev`
2. Vérifier qu'il n'y a pas d'erreurs de connexion dans la console

## 📚 Documentation

- [Instructions de Migration Auth](./INSTRUCTIONS_MIGRATION_AUTH.md)
- [Plan de Migration Supabase Auth](./PLAN_MIGRATION_SUPABASE_AUTH.md)
- [Pourquoi Supabase Auth est plus sûr](./SUPABASE_AUTH_SECURITE.md)

---

**Tout est prêt !** Suivez ces étapes pour configurer Supabase complètement.

