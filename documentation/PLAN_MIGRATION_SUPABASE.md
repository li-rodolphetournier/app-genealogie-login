# Plan de Migration vers Supabase

## 📋 Vue d'ensemble

Ce document détaille le plan complet pour migrer toutes les données JSON vers Supabase et intégrer la base de données dans le front-end de l'application de généalogie.

## 🗂️ Structure des données actuelles

### 1. Users (users.json)
- `login` : Identifiant unique
- `password` : Mot de passe (à hasher avec bcrypt)
- `email` : Email de l'utilisateur
- `status` : "administrateur" | "utilisateur" | "redacteur"
- `profileImage` : Chemin vers l'image de profil
- `description` : Description de l'utilisateur
- `detail` : Détails supplémentaires (optionnel)
- `id` : ID auto-généré (optionnel dans JSON)

### 2. Objects (objects.json)
- `id` : Identifiant unique
- `nom` : Nom de l'objet
- `type` : Type d'objet (Meuble, photo, etc.)
- `status` : "publie" | "brouillon"
- `utilisateur` : Login de l'utilisateur créateur
- `description` : Description courte
- `longDescription` : Description longue
- `photos` : Array d'objets photo
  - `url` : Chemin vers la photo
  - `description` : Array de descriptions

### 3. Messages (messages.json)
- `id` : Identifiant unique (UUID)
- `title` : Titre du message
- `content` : Contenu du message
- `images` : Array d'URLs d'images
- `date` : Date de création (ISO string)
- `userName` : Login de l'utilisateur auteur

### 4. Genealogy (genealogie.json)
- `id` : Identifiant unique
- `nom` : Nom de famille
- `prenom` : Prénom
- `genre` : "homme" | "femme"
- `description` : Description de la personne
- `detail` : Détails supplémentaires (optionnel)
- `mere` : ID de la mère (relation)
- `pere` : ID du père (relation)
- `ordreNaissance` : Ordre de naissance
- `dateNaissance` : Date de naissance (format ISO)
- `dateDeces` : Date de décès (format ISO, nullable)
- `image` : Chemin vers l'image (nullable)

## 🗄️ Schéma de base de données Supabase

### Tables à créer

1. **users** - Utilisateurs de l'application
2. **objects** - Objets/photos d'objets
3. **object_photos** - Photos associées aux objets (table de relation)
4. **messages** - Messages du système
5. **message_images** - Images associées aux messages (table de relation)
6. **persons** - Personnes de l'arbre généalogique

### Relations

- `objects.utilisateur_id` → `users.id` (foreign key)
- `object_photos.object_id` → `objects.id` (foreign key)
- `messages.user_id` → `users.id` (foreign key)
- `message_images.message_id` → `messages.id` (foreign key)
- `persons.mere_id` → `persons.id` (self-reference)
- `persons.pere_id` → `persons.id` (self-reference)

## 📝 Étapes de migration

### Phase 1 : Préparation

1. **Créer un projet Supabase**
   - Aller sur https://supabase.com
   - Créer un nouveau projet
   - Noter l'URL du projet et les clés API

2. **Installer les dépendances**
   ```bash
   npm install @supabase/supabase-js @supabase/ssr
   ```

3. **Configurer les variables d'environnement**
   - Créer `.env.local` avec les clés Supabase

### Phase 2 : Création du schéma

1. **Exécuter le script SQL** dans Supabase SQL Editor
   - Créer toutes les tables
   - Définir les contraintes et relations
   - Créer les index pour optimiser les requêtes
   - Configurer les Row Level Security (RLS)

### Phase 3 : Migration des données

1. **Exécuter le script de migration**
   - Lire les fichiers JSON
   - Transformer les données au format Supabase
   - Insérer les données dans Supabase
   - Gérer les relations et références

### Phase 4 : Intégration front-end

1. **Créer le client Supabase**
   - Configuration pour Server Components
   - Configuration pour Client Components
   - Helpers pour les requêtes

2. **Migrer les API Routes**
   - Remplacer les lectures/écritures JSON par Supabase
   - Adapter les requêtes aux nouvelles structures
   - Gérer l'authentification avec Supabase Auth

3. **Mettre à jour les composants**
   - Adapter les appels API
   - Gérer les nouveaux types de données

### Phase 5 : Authentification

1. **Migrer l'authentification vers Supabase Auth**
   - Créer les utilisateurs dans Supabase Auth
   - Migrer les mots de passe (avec hash bcrypt)
   - Mettre à jour le système de login

## 🔐 Sécurité

- **Row Level Security (RLS)** : Activer sur toutes les tables
- **Politiques RLS** : Définir qui peut lire/écrire quoi
- **Hachage des mots de passe** : Utiliser Supabase Auth ou bcrypt
- **Validation des données** : Utiliser les contraintes de base de données

## 📊 Fonctionnalités supplémentaires avec Supabase

1. **Authentification intégrée** : Gestion des sessions, tokens, etc.
2. **Storage** : Stockage des images dans Supabase Storage
3. **Real-time** : Mises à jour en temps réel si nécessaire
4. **Backup automatique** : Sauvegardes automatiques de la base
5. **Scalabilité** : Base de données scalable

## 🔄 Plan de rollback

En cas de problème, possibilité de :
1. Garder les fichiers JSON en backup
2. Créer un mode "fallback" vers JSON
3. Réexécuter la migration si nécessaire

## 📅 Timeline estimée

- **Phase 1** : 30 minutes
- **Phase 2** : 1 heure
- **Phase 3** : 1 heure
- **Phase 4** : 2-3 heures
- **Phase 5** : 1-2 heures

**Total estimé** : 5-7 heures

## ✅ Checklist de migration

- [ ] Projet Supabase créé
- [ ] Variables d'environnement configurées
- [ ] Schéma de base de données créé
- [ ] Données migrées
- [ ] API Routes mises à jour
- [ ] Composants front-end mis à jour
- [ ] Authentification migrée
- [ ] Tests effectués
- [ ] Backup des fichiers JSON créé
- [ ] Documentation mise à jour

## 📚 Fichiers à créer

1. `supabase/schema.sql` - Schéma complet de la base de données
2. `scripts/migrate-to-supabase.ts` - Script de migration des données
3. `lib/supabase/server.ts` - Client Supabase pour Server Components
4. `lib/supabase/client.ts` - Client Supabase pour Client Components
5. `lib/supabase/types.ts` - Types TypeScript générés depuis Supabase
6. `MIGRATION_GUIDE.md` - Guide détaillé étape par étape

