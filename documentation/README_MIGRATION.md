# 📦 Fichiers créés pour la migration Supabase

Ce document liste tous les fichiers créés pour faciliter la migration de votre application vers Supabase.

## 📋 Documents de planification

### 1. `PLAN_MIGRATION_SUPABASE.md`
Plan complet de migration avec :
- Vue d'ensemble de la structure des données
- Schéma de base de données proposé
- Étapes détaillées de migration
- Timeline estimée
- Checklist de migration

### 2. `MIGRATION_GUIDE.md`
Guide étape par étape pour :
- Créer un projet Supabase
- Configurer les variables d'environnement
- Exécuter le schéma SQL
- Migrer les données
- Intégrer Supabase dans le code

## 🗄️ Schéma de base de données

### 3. `supabase/schema.sql`
Schéma SQL complet avec :
- ✅ 6 tables principales (users, objects, object_photos, messages, message_images, persons)
- ✅ Contraintes et relations (foreign keys)
- ✅ Index pour optimiser les requêtes
- ✅ Row Level Security (RLS) activé
- ✅ Politiques de sécurité
- ✅ Triggers pour `updated_at`
- ✅ Vues utiles pour requêtes complexes

## 🔄 Scripts de migration

### 4. `scripts/migrate-to-supabase.ts`
Script de migration automatique qui :
- ✅ Lit tous les fichiers JSON (`users.json`, `objects.json`, `messages.json`, `genealogie.json`)
- ✅ Hashe les mots de passe avec bcrypt
- ✅ Insère les données dans Supabase
- ✅ Gère les relations entre les tables
- ✅ Affiche un rapport détaillé de progression
- ✅ Gère les erreurs et les doublons

**Usage :**
```bash
npm run migrate:supabase
```

## 🔧 Clients Supabase

### 5. `lib/supabase/server.ts`
Client Supabase pour Server Components et Server Actions :
- Gestion automatique des cookies
- Support pour l'authentification
- Fonction pour créer un client avec service role key

### 6. `lib/supabase/client.ts`
Client Supabase pour Client Components :
- Utilise le navigateur pour gérer les sessions
- Optimisé pour React hooks

## 📚 Exemples et documentation

### 7. `examples/api-routes-supabase.ts`
Exemples complets de migration des API routes :
- GET/POST/PUT/DELETE pour chaque entité
- Gestion des erreurs
- Transformation des données
- Requêtes avec relations

### 8. `ENV_EXAMPLE.md`
Documentation pour les variables d'environnement :
- Liste des variables nécessaires
- Comment les obtenir depuis Supabase
- Consignes de sécurité

## 📦 Modifications du package.json

Les dépendances suivantes ont été ajoutées :
- `@supabase/supabase-js` : Client JavaScript pour Supabase
- `@supabase/ssr` : Support pour Server-Side Rendering avec Next.js
- `tsx` : Pour exécuter les scripts TypeScript

Un script a été ajouté :
- `npm run migrate:supabase` : Exécute le script de migration

## 🚀 Prochaines étapes

1. **Installer les dépendances** :
   ```bash
   npm install
   # ou
   yarn install
   ```

2. **Suivre le guide de migration** :
   Consultez `MIGRATION_GUIDE.md` pour les instructions détaillées

3. **Créer votre projet Supabase** :
   - Allez sur https://supabase.com
   - Créez un nouveau projet
   - Récupérez les clés API

4. **Configurer les variables d'environnement** :
   - Créez `.env.local` avec les valeurs de `ENV_EXAMPLE.md`

5. **Exécuter le schéma SQL** :
   - Dans Supabase Dashboard → SQL Editor
   - Copiez-collez le contenu de `supabase/schema.sql`

6. **Migrer les données** :
   ```bash
   npm run migrate:supabase
   ```

7. **Mettre à jour vos API routes** :
   - Utilisez les exemples dans `examples/api-routes-supabase.ts`
   - Remplacez les appels JSON par Supabase

## 📖 Structure des fichiers créés

```
app-genealogie-login/
├── PLAN_MIGRATION_SUPABASE.md      # Plan complet
├── MIGRATION_GUIDE.md              # Guide étape par étape
├── README_MIGRATION.md             # Ce fichier
├── ENV_EXAMPLE.md                  # Documentation variables env
├── supabase/
│   └── schema.sql                  # Schéma de base de données
├── scripts/
│   └── migrate-to-supabase.ts      # Script de migration
├── lib/
│   └── supabase/
│       ├── server.ts               # Client serveur
│       └── client.ts               # Client navigateur
└── examples/
    └── api-routes-supabase.ts      # Exemples API routes
```

## ✅ Checklist rapide

- [ ] Lire `PLAN_MIGRATION_SUPABASE.md`
- [ ] Lire `MIGRATION_GUIDE.md`
- [ ] Installer les dépendances (`npm install`)
- [ ] Créer un projet Supabase
- [ ] Configurer `.env.local`
- [ ] Exécuter `supabase/schema.sql` dans Supabase
- [ ] Exécuter `npm run migrate:supabase`
- [ ] Vérifier les données dans Supabase Dashboard
- [ ] Mettre à jour les API routes (voir `examples/`)
- [ ] Tester l'application

## 🆘 Besoin d'aide ?

- Consultez `MIGRATION_GUIDE.md` pour les instructions détaillées
- Consultez la [documentation Supabase](https://supabase.com/docs)
- Consultez les exemples dans `examples/api-routes-supabase.ts`

## 📝 Notes importantes

- ⚠️ Les fichiers JSON originaux ne seront **pas** supprimés automatiquement
- ⚠️ Vous pouvez garder les fichiers JSON en backup
- ⚠️ La migration peut être exécutée plusieurs fois (gestion des doublons)
- ⚠️ Assurez-vous d'avoir un backup avant la migration

---

**Bon courage pour votre migration ! 🚀**

