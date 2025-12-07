# 📦 Migration vers Supabase Storage

## 🎯 Objectif

Migrer le stockage de fichiers du système de fichiers local (`public/uploads/`) vers **Supabase Storage** pour une gestion professionnelle des fichiers.

## ✅ Pourquoi Supabase Storage ?

### Système Actuel (❌ Limité)
- ⚠️ Stockage local dans `public/uploads/`
- ⚠️ Pas de CDN (chargement lent)
- ⚠️ Pas de gestion d'accès fine
- ⚠️ Pas de redimensionnement automatique
- ⚠️ Pas de backup automatique

### Avec Supabase Storage (✅ Professionnel)
- ✅ CDN global (chargement rapide)
- ✅ Gestion d'accès fine (RLS)
- ✅ Redimensionnement automatique
- ✅ Backup automatique
- ✅ Scalabilité infinie
- ✅ Intégration native avec Supabase Auth

## 📋 Fichiers Modifiés

### 1. ✅ Utilitaires Supabase Storage (`src/lib/supabase/storage.ts`)
- **Nouveau fichier créé**
- Fonctions pour upload, suppression, récupération
- Gestion des buckets (messages, objects, users, genealogy, uploads)
- Migration automatique des fichiers locaux

### 2. ✅ Route API Upload (`src/app/api/upload/route.ts`)
- **Refactorisé pour utiliser Supabase Storage**
- Upload vers les buckets appropriés
- Vérification de l'authentification
- Gestion des erreurs améliorée

### 3. ✅ Script de Migration (`scripts/migrate-files-to-supabase-storage.ts`)
- **Nouveau script créé**
- Migre tous les fichiers de `public/uploads/` vers Supabase Storage
- Crée automatiquement les buckets nécessaires
- Génère un mapping des anciens chemins vers les nouvelles URLs

### 4. ✅ Package.json
- **Ajouté le script** : `npm run migrate:storage`

## 🚀 Prochaines Étapes

### Étape 1 : Créer les Buckets dans Supabase

Les buckets seront créés automatiquement lors de l'exécution du script de migration, mais vous pouvez aussi les créer manuellement :

1. Aller dans **Supabase Dashboard** → **Storage**
2. Créer les buckets suivants (si nécessaire) :
   - `messages` (public)
   - `objects` (public)
   - `users` (public)
   - `genealogy` (public)
   - `uploads` (public)

**Configuration recommandée pour chaque bucket** :
- **Public** : ✅ Activé
- **File size limit** : 10MB
- **Allowed MIME types** : `image/jpeg, image/png, image/gif, image/webp`

### Étape 2 : Migrer les Fichiers

Exécuter le script de migration :

```bash
npm run migrate:storage
```

Ce script va :
- Créer les buckets nécessaires
- Uploader tous les fichiers depuis `public/uploads/`
- Générer un mapping des anciens chemins vers les nouvelles URLs Supabase

### Étape 3 : Mettre à Jour les Références dans les Données

⚠️ **IMPORTANT** : Après la migration, vous devez mettre à jour les références de fichiers dans vos données JSON :

#### Fichiers à mettre à jour :
- `src/data/objects.json` - Mettre à jour les URLs des photos
- `src/data/messages.json` - Mettre à jour les URLs des images
- `src/data/users.json` - Mettre à jour les URLs des images de profil
- `src/data/genealogie.json` - Mettre à jour les URLs des images de personnes

#### Exemple de remplacement :
```json
// Avant
{
  "photos": [
    {
      "url": "/uploads/objects/123456789-image.jpg"
    }
  ]
}

// Après
{
  "photos": [
    {
      "url": "https://xxxxx.supabase.co/storage/v1/object/public/objects/objects/123456789-image.jpg"
    }
  ]
}
```

**Option** : Créer un script pour automatiser cette mise à jour (voir `scripts/update-file-references.ts` à venir).

### Étape 4 : Tester

1. **Démarrer le serveur** :
   ```bash
   npm run dev
   ```

2. **Tester l'upload** :
   - Créer un nouveau message avec une image
   - Créer un nouvel objet avec des photos
   - Uploader une image de profil

3. **Vérifier que les fichiers apparaissent dans Supabase Storage**

## 🔒 Sécurité

### Row Level Security (RLS)

Par défaut, les buckets sont publics. Pour une sécurité renforcée, vous pouvez :

1. **Créer des politiques RLS** pour contrôler l'accès aux fichiers
2. **Utiliser des URLs signées** pour les fichiers privés
3. **Limiter les uploads** aux utilisateurs authentifiés

### Exemple de politique RLS :

```sql
-- Permettre la lecture publique des images
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
USING (bucket_id IN ('messages', 'objects', 'users', 'genealogy', 'uploads'));

-- Permettre l'upload seulement aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload"
ON storage.objects
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id IN ('messages', 'objects', 'users', 'genealogy', 'uploads')
);

-- Permettre la suppression seulement aux administrateurs
CREATE POLICY "Admins can delete"
ON storage.objects
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND status = 'administrateur'
  )
);
```

## 📝 Structure des Buckets

### Bucket `messages`
- **Contenu** : Images des messages
- **Structure** : `/messages/{messageId}/{filename}`
- **Accès** : Public

### Bucket `objects`
- **Contenu** : Photos des objets
- **Structure** : `/objects/{objectId}/{filename}`
- **Accès** : Public

### Bucket `users`
- **Contenu** : Images de profil des utilisateurs
- **Structure** : `/users/{userId}/{filename}`
- **Accès** : Public

### Bucket `genealogy`
- **Contenu** : Images des personnes dans l'arbre généalogique
- **Structure** : `/genealogy/{personId}/{filename}`
- **Accès** : Public

### Bucket `uploads`
- **Contenu** : Fichiers divers (logos, images de login, etc.)
- **Structure** : `/uploads/{folder}/{filename}`
- **Accès** : Public

## 🐛 Dépannage

### Erreur : "Bucket does not exist"
- Vérifier que les buckets ont été créés dans Supabase Dashboard
- Exécuter le script de migration qui les crée automatiquement

### Erreur : "Invalid API key"
- Vérifier que `.env.local` contient `SUPABASE_SERVICE_ROLE_KEY`
- Redémarrer le serveur après modification

### Erreur : "File size too large"
- Vérifier la limite de taille du bucket (10MB par défaut)
- Augmenter la limite dans Supabase Dashboard si nécessaire

### Les fichiers ne s'affichent pas
- Vérifier que le bucket est marqué comme "Public"
- Vérifier les URLs générées dans les données JSON
- Vérifier les CORS dans Supabase Dashboard

## 📚 Documentation Complémentaire

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Storage API](https://supabase.com/docs/reference/javascript/storage)

---

**Statut** : ✅ Migration vers Supabase Storage prête
**Date** : Aujourd'hui
**Prochaine étape** : Exécuter `npm run migrate:storage` et mettre à jour les références

