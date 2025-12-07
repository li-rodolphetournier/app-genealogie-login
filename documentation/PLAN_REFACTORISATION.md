# 📋 Plan de Refactorisation - Best Practices Next.js 15

Ce document présente un plan complet de refactorisation basé sur les meilleures pratiques de Next.js 15, React 18, TypeScript et les patterns modernes.

## 🎯 Objectifs de la refactorisation

1. **Performance** : Optimiser le rendu avec Server Components
2. **Maintenabilité** : Réduire la duplication de code
3. **Type Safety** : Améliorer la sécurité des types
4. **Architecture** : Structurer le code selon les best practices
5. **Sécurité** : Renforcer l'authentification et la validation
6. **DX (Developer Experience)** : Améliorer l'expérience de développement

---

## 📊 État actuel vs État cible

### ❌ Problèmes identifiés

1. **Duplication des routes API** (3 systèmes différents)
   - `pages/api/` (Pages Router)
   - `src/pages/api/` (Pages Router dupliqué)
   - `src/app/api/` (App Router - moderne)

2. **Types dupliqués** dans plusieurs fichiers
   - `User` défini dans 8+ fichiers différents
   - `ObjectData` avec des variations

3. **Client Components excessifs**
   - Pages qui pourraient être Server Components
   - Récupération de données côté client au lieu du serveur

4. **Gestion d'état avec localStorage**
   - Pas sécurisé pour l'authentification
   - Pas de synchronisation serveur

5. **Pas de validation de schéma**
   - Validation manuelle uniquement
   - Pas de types runtime

6. **Pas de séparation claire des responsabilités**
   - Logique métier dans les composants
   - Pas de services/dal séparés

7. **Gestion d'erreur inconsistante**
   - Pas de gestion centralisée
   - Messages d'erreur variables

---

## 🚀 Plan de refactorisation par phases

### **Phase 1 : Nettoyage et organisation** ⚡ Priorité : HAUTE

#### 1.1 Unifier les routes API

**Problème** : 3 systèmes de routes différents

**Action** :
- ✅ Migrer toutes les routes vers `src/app/api/` (App Router)
- ❌ Supprimer `pages/api/` et `src/pages/api/`
- ✅ Utiliser Route Handlers (`route.ts`)

**Fichiers à créer/modifier** :
```
src/app/api/
├── auth/
│   ├── login/route.ts
│   └── logout/route.ts
├── users/
│   ├── route.ts (GET, POST)
│   ├── [login]/route.ts (GET, PUT, DELETE)
│   └── [login]/update/route.ts → supprimer (doublon)
├── objects/
│   ├── route.ts (GET, POST)
│   ├── [id]/route.ts (GET, PUT, DELETE)
│   └── [id]/photos/route.ts
├── messages/
│   └── route.ts (GET, POST)
└── genealogie/
    ├── route.ts (GET)
    ├── add/route.ts
    └── update/route.ts
```

**Bénéfices** :
- Une seule source de vérité
- Utilisation des Route Handlers modernes
- Meilleure organisation

#### 1.2 Centraliser les types

**Problème** : Types dupliqués partout

**Action** :
- ✅ Créer `src/types/` structuré
- ✅ Un seul fichier par entité
- ✅ Exporter depuis un index

**Structure cible** :
```
src/types/
├── index.ts (exports)
├── user.ts
├── object.ts
├── message.ts
├── genealogy.ts
├── api/
│   ├── requests.ts
│   └── responses.ts
└── common.ts (utilitaires)
```

**Exemple de refactorisation** :
```typescript
// src/types/user.ts
export type User = {
  id: string;
  login: string;
  email: string;
  status: 'administrateur' | 'utilisateur' | 'redacteur';
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  profileImage?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserCreateInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'> & {
  password: string;
};

export type UserUpdateInput = Partial<Omit<User, 'id' | 'createdAt'>>;
```

#### 1.3 Nettoyer les fichiers obsolètes

**Action** :
- ❌ Supprimer `pages/api/` entier
- ❌ Supprimer `src/pages/api/` entier
- ❌ Supprimer les composants dupliqués
- ❌ Supprimer `src/App.tsx` si non utilisé

---

### **Phase 2 : Architecture et patterns** ⚡ Priorité : HAUTE

#### 2.1 Implémenter Server Components

**Problème** : Trop de Client Components qui récupèrent des données

**Action** : Convertir les pages en Server Components quand possible

**Exemples de refactorisation** :

**AVANT** (Client Component) :
```tsx
// src/app/objects/page.tsx
'use client';

export default function ObjectsList() {
  const [objects, setObjects] = useState([]);
  
  useEffect(() => {
    fetch('/api/objects').then(...);
  }, []);
  
  return <div>...</div>;
}
```

**APRÈS** (Server Component) :
```tsx
// src/app/objects/page.tsx
import { createClient } from '@/lib/supabase/server';
import { ObjectsListClient } from './objects-list-client';

export default async function ObjectsList() {
  const supabase = await createClient();
  const { data: objects } = await supabase
    .from('objects')
    .select('*, object_photos(*), users:utilisateur_id(login)');
  
  return <ObjectsListClient initialObjects={objects} />;
}
```

**Pages à convertir** :
- ✅ `src/app/objects/page.tsx` → Server Component
- ✅ `src/app/users/page.tsx` → Server Component
- ✅ `src/app/messages/page.tsx` → Server Component
- ✅ `src/app/genealogie/page.tsx` → Partiellement (arbre côté client)

#### 2.2 Implémenter Server Actions

**Problème** : Mutations via API routes + fetch

**Action** : Utiliser Server Actions pour les mutations

**Structure cible** :
```
src/app/
├── objects/
│   ├── actions.ts (Server Actions)
│   └── page.tsx
├── users/
│   ├── actions.ts
│   └── page.tsx
└── messages/
    ├── actions.ts
    └── page.tsx
```

**Exemple** :
```typescript
// src/app/objects/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createObject(formData: FormData) {
  const supabase = await createClient();
  // ... validation et création
  revalidatePath('/objects');
  return { success: true };
}
```

#### 2.3 Créer une couche de services (DAL)

**Problème** : Logique métier dispersée

**Action** : Créer des services pour chaque entité

**Structure cible** :
```
src/lib/
├── services/
│   ├── user.service.ts
│   ├── object.service.ts
│   ├── message.service.ts
│   └── genealogy.service.ts
└── supabase/
    ├── server.ts
    └── client.ts
```

**Exemple** :
```typescript
// src/lib/services/user.service.ts
import { createClient } from '@/lib/supabase/server';
import type { User, UserCreateInput } from '@/types/user';

export class UserService {
  static async findAll() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data;
  }
  
  static async findByLogin(login: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('login', login)
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }
  
  static async create(input: UserCreateInput) {
    // ... validation et création
  }
}
```

---

### **Phase 3 : Sécurité et validation** ⚡ Priorité : HAUTE

#### 3.1 Implémenter Zod pour la validation

**Action** : Ajouter Zod pour validation runtime

**Installation** :
```bash
npm install zod
```

**Structure** :
```
src/lib/
└── validations/
    ├── user.schema.ts
    ├── object.schema.ts
    ├── message.schema.ts
    └── genealogy.schema.ts
```

**Exemple** :
```typescript
// src/lib/validations/user.schema.ts
import { z } from 'zod';

export const userCreateSchema = z.object({
  login: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  status: z.enum(['administrateur', 'utilisateur', 'redacteur']),
  nom: z.string().optional(),
  prenom: z.string().optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
```

#### 3.2 Améliorer l'authentification

**Problème** : localStorage + mot de passe en clair

**Action** :
- ✅ Utiliser Supabase Auth
- ✅ Sessions côté serveur
- ✅ Middleware pour protéger les routes

**Structure** :
```
src/lib/
├── auth/
│   ├── config.ts
│   ├── middleware.ts (améliorer)
│   └── utils.ts
└── middleware.ts (auth protection)
```

#### 3.3 Créer un système de gestion d'erreurs

**Action** : Centraliser la gestion d'erreurs

**Structure** :
```
src/lib/
└── errors/
    ├── app-error.ts
    ├── error-handler.ts
    └── error-boundary.tsx
```

**Exemple** :
```typescript
// src/lib/errors/app-error.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// src/lib/errors/error-handler.ts
export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

---

### **Phase 4 : Optimisations et améliorations** ⚡ Priorité : MOYENNE

#### 4.1 Créer des hooks personnalisés réutilisables

**Action** : Extraire la logique répétitive

**Structure** :
```
src/hooks/
├── use-auth.ts
├── use-objects.ts
├── use-users.ts
├── use-messages.ts
└── use-debounce.ts
```

**Exemple** :
```typescript
// src/hooks/use-auth.ts
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types/user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user as User);
      setLoading(false);
    });
  }, []);
  
  return { user, loading };
}
```

#### 4.2 Organiser les composants UI

**Problème** : Composants mélangés

**Action** : Structurer avec Shadcn UI

**Structure cible** :
```
src/components/
├── ui/ (Shadcn UI)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
├── layout/
│   ├── header.tsx
│   ├── sidebar.tsx
│   └── footer.tsx
├── forms/
│   ├── user-form.tsx
│   └── object-form.tsx
└── features/
    ├── objects/
    │   ├── object-card.tsx
    │   └── object-list.tsx
    └── users/
        └── user-card.tsx
```

#### 4.3 Implémenter le cache et la revalidation

**Action** : Utiliser le cache de Next.js 15

**Exemples** :
- `revalidatePath()` après mutations
- `revalidateTag()` pour cache par tags
- `cache()` pour mémoriser les fonctions

#### 4.4 Optimiser les images

**Action** : Utiliser `next/image` partout

**Bénéfices** :
- Lazy loading automatique
- Optimisation des formats
- Responsive images

---

### **Phase 5 : Tests et qualité** ⚡ Priorité : MOYENNE

#### 5.1 Ajouter des tests unitaires

**Outils recommandés** :
- Vitest (test runner)
- React Testing Library

**Structure** :
```
src/
└── __tests__/
    ├── services/
    ├── utils/
    └── components/
```

#### 5.2 Ajouter des tests E2E

**Outils recommandés** :
- Playwright ou Cypress

#### 5.3 Configurer ESLint strict

**Action** : Ajouter des règles strictes

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

---

## 📝 Checklist de refactorisation

### Phase 1 : Nettoyage
- [ ] Unifier les routes API vers `src/app/api/`
- [ ] Supprimer `pages/api/` et `src/pages/api/`
- [ ] Centraliser les types dans `src/types/`
- [ ] Supprimer les fichiers obsolètes
- [ ] Nettoyer les imports inutilisés

### Phase 2 : Architecture
- [ ] Convertir les pages en Server Components
- [ ] Implémenter Server Actions pour les mutations
- [ ] Créer la couche de services (DAL)
- [ ] Séparer la logique métier des composants

### Phase 3 : Sécurité
- [ ] Ajouter Zod pour la validation
- [ ] Améliorer l'authentification avec Supabase Auth
- [ ] Créer un système de gestion d'erreurs centralisé
- [ ] Protéger les routes avec middleware

### Phase 4 : Optimisations
- [ ] Créer des hooks personnalisés
- [ ] Organiser les composants UI
- [ ] Implémenter le cache et la revalidation
- [ ] Optimiser les images avec `next/image`

### Phase 5 : Tests
- [ ] Ajouter des tests unitaires
- [ ] Ajouter des tests E2E
- [ ] Configurer ESLint strict

---

## 🎯 Priorités et timeline

### Sprint 1 (Semaine 1-2) : Fondations
1. Phase 1.1 : Unifier les routes API
2. Phase 1.2 : Centraliser les types
3. Phase 1.3 : Nettoyer les fichiers obsolètes

### Sprint 2 (Semaine 3-4) : Architecture
1. Phase 2.1 : Server Components
2. Phase 2.2 : Server Actions
3. Phase 2.3 : Couche de services

### Sprint 3 (Semaine 5-6) : Sécurité
1. Phase 3.1 : Validation Zod
2. Phase 3.2 : Authentification Supabase
3. Phase 3.3 : Gestion d'erreurs

### Sprint 4 (Semaine 7-8) : Optimisations
1. Phase 4.1-4.4 : Toutes les optimisations

### Sprint 5 (Semaine 9+) : Tests
1. Phase 5.1-5.3 : Tests et qualité

---

## 📚 Ressources et références

### Documentation
- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [TypeScript Best Practices](https://typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

### Outils recommandés
- **Zod** : Validation de schéma
- **Vitest** : Tests unitaires
- **Playwright** : Tests E2E
- **ESLint** : Linting strict
- **Prettier** : Formatage de code

---

## ✅ Critères de succès

1. **Performance** : 
   - Réduction de 50% du JavaScript côté client
   - Temps de chargement initial < 2s

2. **Maintenabilité** :
   - Zéro duplication de types
   - Code coverage > 70%

3. **Sécurité** :
   - Authentification sécurisée avec sessions
   - Validation de toutes les entrées

4. **DX** :
   - Autocomplétion TypeScript complète
   - Build sans erreurs ni warnings

---

**Ce plan est évolutif et peut être ajusté selon les besoins du projet.**

