# 📚 Index de la Documentation

Bienvenue dans la documentation du projet d'application de généalogie.

## 📁 Structure de la documentation

### 🔧 Documentation Technique

1. **[DOCUMENTATION_TECHNOLOGIES.md](./DOCUMENTATION_TECHNOLOGIES.md)**
   - Documentation complète de toutes les technologies utilisées
   - Next.js 15, React 18, TypeScript 5, TailwindCSS, Prisma, etc.
   - Exemples de code et bonnes pratiques

### 🗄️ Migration vers Supabase

2. **[PLAN_MIGRATION_SUPABASE.md](./PLAN_MIGRATION_SUPABASE.md)**
   - Plan complet de migration
   - Vue d'ensemble de la structure des données
   - Étapes détaillées et timeline

3. **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)**
   - Guide étape par étape pour effectuer la migration
   - Instructions détaillées avec captures d'écran
   - Résolution de problèmes

4. **[README_MIGRATION.md](./README_MIGRATION.md)**
   - Liste complète de tous les fichiers créés pour la migration
   - Structure des fichiers
   - Checklist de migration

5. **[RESUME_MIGRATION.md](./RESUME_MIGRATION.md)**
   - Résumé rapide de la migration
   - Vue d'ensemble des étapes
   - Fichiers créés

### 🔗 Relations et Base de Données

6. **[DOCUMENTATION_RELATIONS_SUPABASE.md](./DOCUMENTATION_RELATIONS_SUPABASE.md)**
   - Guide détaillé sur les relations dans Supabase
   - Comment récupérer les données liées
   - Exemples de requêtes avec jointures

7. **[VERIFICATION_RELATIONS.md](./VERIFICATION_RELATIONS.md)**
   - Vérification complète des relations
   - Confirmation que toutes les données liées sont prises en compte
   - Exemples concrets

### ⚙️ Configuration

8. **[ENV_EXAMPLE.md](./ENV_EXAMPLE.md)**
   - Documentation des variables d'environnement
   - Comment obtenir les clés Supabase
   - Consignes de sécurité

## 🚀 Par où commencer ?

### Pour les nouveaux développeurs

1. Lisez [DOCUMENTATION_TECHNOLOGIES.md](./DOCUMENTATION_TECHNOLOGIES.md) pour comprendre les technologies utilisées
2. Consultez le [README.md principal](../README.md) pour démarrer le projet

### Pour la migration vers Supabase

1. Commencez par [RESUME_MIGRATION.md](./RESUME_MIGRATION.md) pour une vue d'ensemble
2. Suivez le [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) étape par étape
3. Consultez [VERIFICATION_RELATIONS.md](./VERIFICATION_RELATIONS.md) pour comprendre les relations

### Pour comprendre les relations de données

1. Lisez [DOCUMENTATION_RELATIONS_SUPABASE.md](./DOCUMENTATION_RELATIONS_SUPABASE.md)
2. Consultez [VERIFICATION_RELATIONS.md](./VERIFICATION_RELATIONS.md) pour les exemples

## 📂 Fichiers du projet liés

- **Schéma Supabase** : [../supabase/schema.sql](../supabase/schema.sql)
- **Script de migration** : [../scripts/migrate-to-supabase.ts](../scripts/migrate-to-supabase.ts)
- **Exemples API** : [../examples/api-routes-supabase.ts](../examples/api-routes-supabase.ts)
- **Clients Supabase** : [../lib/supabase/](../lib/supabase/)

## 🔄 Ordre de lecture recommandé

1. **Première visite** : [DOCUMENTATION_TECHNOLOGIES.md](./DOCUMENTATION_TECHNOLOGIES.md)
2. **Migration Supabase** : [RESUME_MIGRATION.md](./RESUME_MIGRATION.md) → [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
3. **Relations** : [DOCUMENTATION_RELATIONS_SUPABASE.md](./DOCUMENTATION_RELATIONS_SUPABASE.md)

