# 🚀 Instructions : Migration vers Supabase Auth

## ✅ Modifications Terminées

Toutes les modifications du code ont été effectuées avec succès ! Il ne reste plus qu'à configurer Supabase et migrer les utilisateurs.

## 📋 Étapes Restantes

### Étape 1 : Adapter le Schéma Supabase

⚠️ **IMPORTANT** : La table `users` dans le schéma actuel contient `password_hash`, mais avec Supabase Auth, ce champ n'est plus nécessaire.

**Action** : Exécuter ce SQL dans Supabase Dashboard → SQL Editor :

```sql
-- Supprimer le champ password_hash (Supabase Auth gère les mots de passe)
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;

-- S'assurer que la table users utilise l'ID de auth.users comme clé primaire
-- Si la table n'existe pas encore, créer la version sans password_hash
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

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_users_login ON public.users(login);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
```

### Étape 2 : Vérifier la Configuration

Vérifier que `.env.local` contient :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (SECRÈTE!)
```

### Étape 3 : Activer Email Auth dans Supabase

1. Aller dans **Supabase Dashboard** → **Authentication** → **Providers**
2. Activer **Email**
3. Optionnel : Configurer les templates d'email

### Étape 4 : Migrer les Utilisateurs

```bash
npm run migrate:auth
```

Ce script va :
- Lire tous les utilisateurs de `src/data/users.json`
- Créer chaque utilisateur dans Supabase Auth
- Créer le profil dans la table `public.users`

### Étape 5 : Tester

1. Démarrer le serveur :
   ```bash
   npm run dev
   ```

2. Se connecter avec un utilisateur migré :
   - Aller sur `http://localhost:3000`
   - Utiliser l'email ou le login d'un utilisateur migré
   - Vérifier que la connexion fonctionne

## 🔒 Améliorations de Sécurité

### Avant ❌
- Mots de passe en clair dans JSON
- Sessions dans localStorage (vulnérable)
- Pas de protection brute force

### Après ✅
- Mots de passe hashés automatiquement
- Sessions dans cookies httpOnly (sécurisés)
- Rate limiting intégré
- Tokens JWT sécurisés

## 📝 Fichiers Modifiés

- ✅ `scripts/migrate-users-to-supabase-auth.ts` (nouveau)
- ✅ `src/app/api/auth/login/route.ts` (refactorisé)
- ✅ `src/hooks/use-auth.ts` (refactorisé)
- ✅ `src/app/page.tsx` (mis à jour)
- ✅ `package.json` (script ajouté)

## 🐛 Dépannage

### Erreur : "Table 'users' does not exist"
→ Exécuter le SQL de l'Étape 1

### Erreur : "Invalid login credentials"
→ Vérifier que les utilisateurs ont été migrés avec `npm run migrate:auth`

### Erreur : "Missing Supabase environment variables"
→ Vérifier le fichier `.env.local`

---

**Tout est prêt !** Suivez les étapes ci-dessus pour finaliser la migration.

