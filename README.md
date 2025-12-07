
## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 🧪 Tests

Le projet utilise une infrastructure de tests complète avec Vitest pour les tests unitaires et Playwright pour les tests E2E.

### Tests Unitaires

```bash
# Lancer tous les tests en mode watch
npm test

# Interface UI interactive
npm run test:ui

# Rapport de couverture
npm run test:coverage

# Mode one-shot (pour CI)
npm test -- --run
```

**Couverture actuelle** :
- ✅ 17 fichiers de tests
- ✅ ~67 tests unitaires
- ✅ Composants, hooks, services, utilitaires

### Tests E2E

```bash
# Lancer tous les tests E2E
npm run test:e2e

# Interface UI Playwright
npm run test:e2e:ui

# Mode debug
npm run test:e2e:debug
```

**Tests E2E disponibles** :
- ✅ Authentification
- ✅ Navigation
- ✅ Workflows utilisateur

📖 **Documentation complète** : [documentation/TESTS_COMPLETS.md](./documentation/TESTS_COMPLETS.md)

---

## 📚 Documentation

Toute la documentation du projet est disponible dans le dossier [`documentation/`](./documentation/).

### Documentation des Technologies

Une documentation complète de toutes les technologies utilisées dans ce projet a été générée via Context7 MCP. Consultez [DOCUMENTATION_TECHNOLOGIES.md](./documentation/DOCUMENTATION_TECHNOLOGIES.md) pour accéder à :

- Next.js 16 (App Router, Server Components)
- React 19 (hooks, composants)
- TypeScript 5
- TailwindCSS 3.4
- Supabase (Auth, Storage, Database)
- Chart.js & React-ChartJS-2
- bcrypt 6

### Migration vers Supabase

Ce projet peut être migré de fichiers JSON vers Supabase pour une gestion de base de données plus robuste. Tous les fichiers nécessaires pour la migration ont été préparés :

- 📋 **Plan de migration** : [PLAN_MIGRATION_SUPABASE.md](./documentation/PLAN_MIGRATION_SUPABASE.md)
- 📖 **Guide étape par étape** : [MIGRATION_GUIDE.md](./documentation/MIGRATION_GUIDE.md)
- 📦 **Fichiers créés** : [README_MIGRATION.md](./documentation/README_MIGRATION.md)
- 📚 **Index de la documentation** : [documentation/README.md](./documentation/README.md)

### Fichiers inclus pour la migration

- `supabase/schema.sql` - Schéma complet de la base de données
- `scripts/migrate-to-supabase.ts` - Script de migration automatique
- `lib/supabase/` - Clients Supabase pour serveur et client
- `examples/api-routes-supabase.ts` - Exemples de migration des API routes

Pour commencer la migration, consultez le [Guide de migration](./documentation/MIGRATION_GUIDE.md).

### Refactorisation et Best Practices

Un plan complet de refactorisation a été préparé pour améliorer le code selon les meilleures pratiques de Next.js 15 :

- 📋 **Plan de refactorisation** : [PLAN_REFACTORISATION.md](./documentation/PLAN_REFACTORISATION.md)

Ce plan inclut :
- Unification des routes API vers App Router
- Migration vers Server Components
- Implémentation de Server Actions
- Amélioration de la sécurité et validation
- Optimisations de performance

## 🛠️ Technologies Utilisées

- **Framework** : [Next.js 16](https://nextjs.org/) avec App Router
- **UI** : [React 19](https://react.dev/), [TailwindCSS 3.4](https://tailwindcss.com/)
- **Base de données** : [Supabase](https://supabase.com/) (Auth, Storage, Database)
- **Validation** : [Zod 4](https://zod.dev/)
- **Tests** : [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/)
- **TypeScript** : 5.x

## 📖 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [React Documentation](https://react.dev/) - learn about React features.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 🚀 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
