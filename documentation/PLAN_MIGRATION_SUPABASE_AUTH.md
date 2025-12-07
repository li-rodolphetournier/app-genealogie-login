# 🔐 Plan de Migration vers Supabase Auth

## 🎯 Objectif

Migrer l'authentification actuelle (localStorage + JSON) vers **Supabase Auth** pour une sécurité professionnelle.

## ✅ Pourquoi Supabase Auth ?

### Sécurité actuelle (PROBLÉMATIQUE) ❌

- ⚠️ Mots de passe **en clair** dans `src/data/users.json`
- ⚠️ Sessions dans **localStorage** (vulnérable XSS)
- ⚠️ Pas de protection brute force
- ⚠️ Pas de tokens sécurisés
- ⚠️ Code personnalisé (risques de bugs)

### Sécurité avec Supabase Auth (PROFESSIONNELLE) ✅

- ✅ Mots de passe **hashés automatiquement** (bcrypt)
- ✅ Sessions dans **cookies httpOnly** (sécurisées)
- ✅ **Rate limiting** intégré (protection brute force)
- ✅ **Tokens JWT** avec expiration
- ✅ Service testé et certifié (SOC 2)

## 📋 Étapes de Migration

### Phase 1 : Configuration Supabase ✅ (Déjà fait)

- ✅ Clients Supabase configurés (`lib/supabase/`)
- ✅ Variables d'environnement prêtes
- ⏳ Vérifier la configuration Supabase

### Phase 2 : Migration des utilisateurs

1. **Créer un script de migration**
   - Lire `src/data/users.json`
   - Hasher les mots de passe
   - Créer les utilisateurs dans Supabase Auth

2. **Migrer les utilisateurs**
   - Convertir `login` en `email` (ou utiliser email)
   - Hasher tous les mots de passe
   - Importer dans Supabase

### Phase 3 : Mise à jour du code

1. **Route API Login** (`src/app/api/auth/login/route.ts`)
   - Remplacer par `supabase.auth.signInWithPassword()`
   - Supprimer le code JSON/localStorage

2. **Hook use-auth** (`src/hooks/use-auth.ts`)
   - Utiliser `supabase.auth.getUser()`
   - Remplacer localStorage par cookies Supabase

3. **Page Login** (`src/app/page.tsx`)
   - Mettre à jour pour utiliser Supabase Auth
   - Supprimer localStorage

4. **Logout**
   - Utiliser `supabase.auth.signOut()`

### Phase 4 : Tests et nettoyage

1. **Tester l'authentification**
   - Login avec chaque utilisateur
   - Vérifier les sessions
   - Tester le logout

2. **Nettoyage**
   - Supprimer l'ancien code
   - Supprimer `users.json` (ou backup)
   - Mettre à jour la documentation

## 🚀 Code de Migration

### Script de Migration des Utilisateurs

```typescript
// scripts/migrate-users-to-supabase-auth.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateUsers() {
  const usersPath = path.join(process.cwd(), 'src/data/users.json');
  const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));

  for (const user of users) {
    try {
      // Utiliser email ou créer un email à partir du login
      const email = user.email || `${user.login}@example.com`;
      
      // Créer l'utilisateur dans Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: user.password, // Supabase hash automatiquement
        email_confirm: true, // Confirmer l'email automatiquement
        user_metadata: {
          login: user.login,
          status: user.status,
          description: user.description,
        },
      });

      if (error) {
        console.error(`❌ Erreur pour ${user.login}:`, error.message);
      } else {
        console.log(`✅ ${user.login} migré (ID: ${data.user.id})`);
      }
    } catch (error) {
      console.error(`❌ Erreur pour ${user.login}:`, error);
    }
  }
}

migrateUsers();
```

### Nouvelle Route API Login

```typescript
// src/app/api/auth/login/route.ts (NOUVEAU)
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations';
import { validateWithSchema, createValidationErrorResponse } from '@/lib/validations/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validation Zod
    const validation = validateWithSchema(loginSchema, body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }
    
    const { login, password } = validation.data;
    const supabase = await createClient();

    // Option 1: Si vous utilisez email comme identifiant
    const { data, error } = await supabase.auth.signInWithPassword({
      email: login, // ou user.email si vous avez migré
      password,
    });

    // Option 2: Si vous voulez garder "login" comme identifiant
    // Vous devrez d'abord récupérer l'utilisateur par login, puis utiliser email
    
    if (error) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Récupérer les métadonnées utilisateur (login, status, etc.)
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        ...profile, // login, status, etc.
      },
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
```

### Hook use-auth mis à jour

```typescript
// src/hooks/use-auth.ts (NOUVEAU)
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types/user';

export function useAuth(options: { redirectIfUnauthenticated?: boolean; redirectTo?: string } = {}) {
  const { redirectIfUnauthenticated = false, redirectTo = '/' } = options;
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Récupérer la session depuis Supabase (cookies httpOnly)
    const loadUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          // Récupérer les métadonnées utilisateur depuis la table users
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();
          
          setUser(profile as User);
        } else {
          setUser(null);
          if (redirectIfUnauthenticated) {
            router.push(redirectTo);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        setUser(null);
        if (redirectIfUnauthenticated) {
          router.push(redirectTo);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setUser(profile as User);
        } else {
          setUser(null);
          if (redirectIfUnauthenticated) {
            router.push(redirectTo);
          }
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [redirectIfUnauthenticated, redirectTo, router, supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    userStatus: user?.status || null,
    logout,
  };
}
```

## 🔑 Configuration Supabase

### 1. Activer Email Auth

Dans Supabase Dashboard :
- Settings → Authentication → Providers
- Activer "Email"
- Configurer les emails (reset password, etc.)

### 2. Configurer les URLs de redirection

- Settings → Authentication → URL Configuration
- Ajouter `http://localhost:3000/**` pour dev
- Ajouter votre domaine de production

## 📝 Checklist de Migration

- [ ] Configurer Supabase Auth dans le dashboard
- [ ] Créer le script de migration des utilisateurs
- [ ] Migrer tous les utilisateurs
- [ ] Mettre à jour la route API `/api/auth/login`
- [ ] Mettre à jour le hook `use-auth`
- [ ] Mettre à jour la page Login
- [ ] Tester le login avec tous les utilisateurs
- [ ] Tester le logout
- [ ] Vérifier les sessions (cookies)
- [ ] Supprimer l'ancien code
- [ ] Mettre à jour la documentation

## 🎯 Prochaines Étapes

1. **Vérifier la configuration Supabase**
   - Vérifier que les variables d'environnement sont correctes
   - Tester la connexion à Supabase

2. **Créer le script de migration**
   - Migrer les utilisateurs vers Supabase Auth

3. **Mettre à jour le code**
   - Implémenter la nouvelle authentification

4. **Tester et déployer**
   - Tester en local
   - Déployer en production

---

**Statut** : Prêt à migrer
**Priorité** : 🔴 HAUTE (Sécurité critique)

