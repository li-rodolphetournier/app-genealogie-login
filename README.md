
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

## 📚 Documentation

Toute la documentation du projet est disponible dans le dossier [`documentation/`](./documentation/).

### Documentation des Technologies

Une documentation complète de toutes les technologies utilisées dans ce projet a été générée via Context7 MCP. Consultez [DOCUMENTATION_TECHNOLOGIES.md](./documentation/DOCUMENTATION_TECHNOLOGIES.md) pour accéder à :

- Next.js 15 (App Router, Server Components)
- React 18 (hooks, composants)
- TypeScript 5
- TailwindCSS 3.4
- Prisma 6.5
- Vercel Blob
- Chart.js & React-ChartJS-2
- Recharts
- bcrypt

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
