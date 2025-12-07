# Guide de Migration vers Supabase

Ce guide détaille étape par étape comment migrer votre application de fichiers JSON vers Supabase.

## 📋 Prérequis

- Un compte Supabase (https://supabase.com)
- Node.js installé (v18+)
- Accès au projet actuel

## 🚀 Étape 1 : Créer un projet Supabase

1. Allez sur https://supabase.com
2. Créez un compte ou connectez-vous
3. Cliquez sur "New Project"
4. Remplissez les informations :
   - **Name** : `app-genealogie` (ou le nom de votre choix)
   - **Database Password** : Créez un mot de passe fort
   - **Region** : Choisissez la région la plus proche
5. Cliquez sur "Create new project"
6. Attendez que le projet soit créé (2-3 minutes)

## 🔑 Étape 2 : Récupérer les clés API

1. Dans votre projet Supabase, allez dans **Settings** → **API**
2. Copiez les valeurs suivantes :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon/public key** (commence par `eyJ...`)
   - **service_role key** (commence par `eyJ...`) - ⚠️ Gardez-la secrète !

## 📦 Étape 3 : Installer les dépendances

Dans votre terminal, à la racine du projet :

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Ou avec yarn :

```bash
yarn add @supabase/supabase-js @supabase/ssr
```

## 🔐 Étape 4 : Configurer les variables d'environnement

1. Créez ou modifiez le fichier `.env.local` à la racine du projet
2. Ajoutez les variables suivantes :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (votre clé anon/public)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (votre clé service_role - SECRÈTE!)
```

⚠️ **Important** :
- Le fichier `.env.local` est déjà dans `.gitignore`, donc vos clés ne seront pas commitées
- Ne partagez jamais votre `SERVICE_ROLE_KEY` publiquement
- Pour Vercel/production, ajoutez ces variables dans les paramètres du projet

## 🗄️ Étape 5 : Créer le schéma de base de données

1. Dans Supabase, allez dans **SQL Editor**
2. Cliquez sur "New query"
3. Ouvrez le fichier `supabase/schema.sql` de ce projet
4. Copiez tout le contenu dans l'éditeur SQL
5. Cliquez sur "Run" ou appuyez sur `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

✅ Vous devriez voir "Success. No rows returned" si tout s'est bien passé.

## 📊 Étape 6 : Vérifier les tables créées

1. Dans Supabase, allez dans **Table Editor**
2. Vous devriez voir les tables suivantes :
   - `users`
   - `objects`
   - `object_photos`
   - `messages`
   - `message_images`
   - `persons`

## 🔄 Étape 7 : Migrer les données JSON

### Option A : Script de migration automatique

1. Assurez-vous que les variables d'environnement sont configurées
2. Exécutez le script de migration :

```bash
# Avec tsx (recommandé)
npx tsx scripts/migrate-to-supabase.ts

# Ou avec ts-node
npx ts-node scripts/migrate-to-supabase.ts
```

Le script va :
- ✅ Lire tous les fichiers JSON
- ✅ Hasher les mots de passe avec bcrypt
- ✅ Insérer les données dans Supabase
- ✅ Gérer les relations entre les tables
- ✅ Afficher un rapport de progression

### Option B : Migration manuelle

Si vous préférez migrer manuellement ou que le script ne fonctionne pas :

1. **Users** : Utilisez l'interface Supabase pour créer les utilisateurs
2. **Objects, Messages, Persons** : Importez via CSV ou utilisez l'interface

## ✅ Étape 8 : Vérifier les données migrées

1. Dans Supabase, allez dans **Table Editor**
2. Vérifiez chaque table :
   - `users` : Doit contenir vos utilisateurs
   - `objects` : Doit contenir vos objets
   - `object_photos` : Doit contenir les photos associées
   - `messages` : Doit contenir vos messages
   - `persons` : Doit contenir les personnes de généalogie

## 🔧 Étape 9 : Mettre à jour le code de l'application

Les fichiers suivants ont été créés pour vous :

- ✅ `lib/supabase/server.ts` - Client pour Server Components
- ✅ `lib/supabase/client.ts` - Client pour Client Components

### Exemple d'utilisation

**Dans un Server Component :**

```typescript
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data: users } = await supabase.from('users').select('*');
  
  return <div>...</div>;
}
```

**Dans un Client Component :**

```typescript
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function Component() {
  const supabase = createClient();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    supabase.from('users').select('*').then(({ data }) => {
      setUsers(data || []);
    });
  }, []);

  return <div>...</div>;
}
```

## 🔒 Étape 10 : Configurer la sécurité (RLS)

Les politiques RLS ont été créées dans le schéma SQL. Vous pouvez les ajuster selon vos besoins :

1. Allez dans **Authentication** → **Policies** dans Supabase
2. Vérifiez les politiques créées
3. Ajustez selon vos règles métier

## 🧪 Étape 11 : Tester l'application

1. Démarrez le serveur de développement :

```bash
npm run dev
```

2. Testez les fonctionnalités :
   - ✅ Connexion utilisateur
   - ✅ Affichage des objets
   - ✅ Affichage des messages
   - ✅ Affichage de la généalogie
   - ✅ Création/modification de données

## 📝 Étape 12 : Mettre à jour les API Routes

Vous devrez maintenant mettre à jour vos API routes pour utiliser Supabase au lieu des fichiers JSON.

### Exemple : API Route pour les utilisateurs

**Avant (avec JSON) :**

```typescript
const users = JSON.parse(fs.readFileSync('src/data/users.json', 'utf-8'));
```

**Après (avec Supabase) :**

```typescript
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: users } = await supabase.from('users').select('*');
  return Response.json(users);
}
```

## 🚨 Résolution de problèmes

### Erreur : "Missing Supabase environment variables"

- Vérifiez que `.env.local` existe et contient les bonnes variables
- Redémarrez le serveur de développement après avoir modifié `.env.local`

### Erreur : "relation does not exist"

- Vérifiez que le schéma SQL a été exécuté correctement
- Vérifiez que les noms de tables sont corrects (lowercase)

### Erreur lors de la migration

- Vérifiez que les fichiers JSON existent dans `src/data/`
- Vérifiez que les variables d'environnement sont correctes
- Vérifiez les logs dans la console pour plus de détails

### Données non visibles dans Supabase

- Vérifiez que RLS (Row Level Security) n'est pas trop restrictif
- Vérifiez que vous utilisez la bonne clé API (anon key vs service role key)

## 📚 Ressources supplémentaires

- [Documentation Supabase](https://supabase.com/docs)
- [Supabase avec Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## ✅ Checklist finale

- [ ] Projet Supabase créé
- [ ] Clés API récupérées
- [ ] Variables d'environnement configurées
- [ ] Schéma SQL exécuté
- [ ] Données migrées
- [ ] Données vérifiées dans Supabase
- [ ] Code de l'application mis à jour
- [ ] API Routes mises à jour
- [ ] Tests effectués
- [ ] Backup des fichiers JSON créé

## 🎉 Félicitations !

Votre migration vers Supabase est terminée ! Vous pouvez maintenant :
- Utiliser une vraie base de données relationnelle
- Bénéficier de l'authentification intégrée
- Scalabiliser facilement
- Utiliser le stockage pour les images

## 🔄 Retour en arrière (Rollback)

Si vous devez revenir aux fichiers JSON :

1. Les fichiers JSON originaux sont toujours dans `src/data/`
2. Vous pouvez désactiver temporairement les appels Supabase
3. Utilisez une variable d'environnement pour basculer entre JSON et Supabase

---

**Besoin d'aide ?** Consultez la documentation Supabase ou ouvrez une issue sur GitHub.

