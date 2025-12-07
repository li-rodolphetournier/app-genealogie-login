# 🔗 Gestion des Relations dans Supabase

Ce document explique comment les données liées sont récupérées et gérées dans Supabase pour votre application.

## 📊 Relations définies dans le schéma

### 1. Objects ↔ Users (One-to-Many)
- Un utilisateur peut avoir plusieurs objets
- Un objet appartient à un utilisateur
- **Clé étrangère** : `objects.utilisateur_id` → `users.id`

### 2. Objects ↔ Object Photos (One-to-Many)
- Un objet peut avoir plusieurs photos
- Une photo appartient à un objet
- **Clé étrangère** : `object_photos.object_id` → `objects.id`

### 3. Messages ↔ Users (One-to-Many)
- Un utilisateur peut avoir plusieurs messages
- Un message appartient à un utilisateur
- **Clé étrangère** : `messages.user_id` → `users.id`

### 4. Messages ↔ Message Images (One-to-Many)
- Un message peut avoir plusieurs images
- Une image appartient à un message
- **Clé étrangère** : `message_images.message_id` → `messages.id`

### 5. Persons (Self-referencing)
- Une personne peut avoir un père et une mère (autres personnes)
- **Clés étrangères** : `persons.mere_id` → `persons.id` et `persons.pere_id` → `persons.id`

## 🔍 Récupération des données liées avec Supabase

Supabase utilise la syntaxe `.select()` avec des relations imbriquées pour récupérer les données liées en une seule requête.

### Exemple 1 : Récupérer les objets avec leurs photos ET leur utilisateur

```typescript
const { data: objects, error } = await supabase
  .from('objects')
  .select(`
    *,
    object_photos (
      id,
      url,
      description,
      display_order
    ),
    users:utilisateur_id (
      login,
      email
    )
  `)
  .order('created_at', { ascending: false });
```

**Résultat :**
```json
[
  {
    "id": "1743785916714",
    "nom": "armoire",
    "type": "Meuble",
    "status": "publie",
    "utilisateur_id": "uuid-de-l-utilisateur",
    "object_photos": [
      {
        "id": "uuid-photo",
        "url": "/uploads/objects/photo.jpg",
        "description": ["Description"],
        "display_order": 0
      }
    ],
    "users": {
      "login": "admin",
      "email": "admin@example.com"
    }
  }
]
```

### Exemple 2 : Récupérer les messages avec leurs images ET leur auteur

```typescript
const { data: messages, error } = await supabase
  .from('messages')
  .select(`
    *,
    message_images (
      url,
      display_order
    ),
    users:user_id (
      login
    )
  `)
  .order('created_at', { ascending: false });
```

**Résultat :**
```json
[
  {
    "id": "uuid-message",
    "title": "1er message",
    "content": "Bonjour bienvenue a tous",
    "user_id": "uuid-utilisateur",
    "created_at": "2024-11-03T16:56:21.854Z",
    "message_images": [
      {
        "url": "/uploads/messages/image.jpg",
        "display_order": 0
      }
    ],
    "users": {
      "login": "admin"
    }
  }
]
```

### Exemple 3 : Récupérer une personne avec ses parents

```typescript
const { data: person, error } = await supabase
  .from('persons')
  .select(`
    *,
    mere:mere_id (
      id,
      nom,
      prenom
    ),
    pere:pere_id (
      id,
      nom,
      prenom
    )
  `)
  .eq('id', personId)
  .single();
```

## ⚠️ Syntaxe importante pour les relations

### Nom de la relation

Quand vous avez une clé étrangère, vous pouvez l'utiliser de deux façons :

1. **Nom automatique** (basé sur le nom de la table référencée) :
   ```typescript
   .select('*, users (...)')  // Si la clé étrangère s'appelle user_id
   ```

2. **Nom personnalisé avec alias** (plus lisible) :
   ```typescript
   .select('*, users:utilisateur_id (...)')  // Alias "users" pour la colonne "utilisateur_id"
   ```

### Relations imbriquées

Vous pouvez imbriquer plusieurs niveaux :

```typescript
const { data } = await supabase
  .from('objects')
  .select(`
    *,
    object_photos (
      *
    ),
    users:utilisateur_id (
      login,
      email,
      profile_image
    )
  `);
```

## 📝 Transformation des données pour compatibilité

Les exemples dans `examples/api-routes-supabase.ts` montrent comment transformer les données Supabase au format attendu par votre front-end :

### Exemple : Objects

```typescript
// Données Supabase (avec relations)
{
  id: "1743785916714",
  nom: "armoire",
  utilisateur_id: "uuid",
  object_photos: [...],
  users: { login: "admin" }
}

// Transformation au format attendu (comme JSON)
{
  id: "1743785916714",
  nom: "armoire",
  utilisateur: "admin",  // ← Transformation du users.login
  photos: [...],  // ← Transformation de object_photos
}
```

**Code de transformation :**

```typescript
const transformedObjects = objects?.map(obj => ({
  id: obj.id,
  nom: obj.nom,
  type: obj.type,
  status: obj.status,
  utilisateur: obj.users?.login || obj.utilisateur_id,  // ← Relation
  description: obj.description,
  longDescription: obj.long_description,
  photos: (obj.object_photos || []).map((photo: any) => ({  // ← Relation
    url: photo.url,
    description: photo.description || [],
  })),
}));
```

## 🎯 Avantages des relations dans Supabase

1. **Requêtes optimisées** : Une seule requête récupère toutes les données liées
2. **Intégrité référentielle** : Les clés étrangères garantissent la cohérence
3. **Jointures automatiques** : Pas besoin de faire plusieurs requêtes
4. **Performance** : Les index sur les clés étrangères accélèrent les recherches

## 🔐 Row Level Security (RLS) et relations

Les politiques RLS s'appliquent aussi aux relations. Si un utilisateur n'a pas accès à une table, il ne pourra pas voir les données liées non plus.

## 📚 Exemples complets dans le projet

Consultez le fichier `examples/api-routes-supabase.ts` pour voir :
- ✅ Exemple 5 : GET objects avec photos et utilisateur
- ✅ Exemple 6 : GET messages avec images et auteur
- ✅ Exemple 8 : POST object avec création des photos liées

## 🚀 Prochaines étapes

Pour utiliser les relations dans vos API routes :

1. Utilisez la syntaxe `.select()` avec relations imbriquées
2. Transformez les données au format attendu par le front-end
3. Gérez les cas où les relations sont null (optionnelles)

---

**Les relations sont bien définies et fonctionnelles dans le schéma Supabase ! 🎉**

