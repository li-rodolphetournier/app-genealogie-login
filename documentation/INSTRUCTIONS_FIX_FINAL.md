# 🔧 Instructions Finales : Corriger la Migration Auth

## ❌ Problème Actuel

L'erreur `unexpected_failure` (500) persiste. Le trigger `handle_new_user` bloque la création des utilisateurs.

## ✅ Solution Simple : Désactiver RLS Temporairement

### Étape 1 : Désactiver RLS

Exécuter dans **Supabase Dashboard** → **SQL Editor** :

```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

### Étape 2 : Migrer les Utilisateurs

```bash
npm run migrate:auth
```

### Étape 3 : Réactiver RLS

Après la migration réussie, réactiver RLS :

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

## ⚠️ Alternative : Désactiver le Trigger

Si la solution ci-dessus ne fonctionne pas, désactiver le trigger :

```sql
-- Désactiver le trigger
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Migrer les utilisateurs (npm run migrate:auth)

-- Réactiver le trigger après
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
```

---

**Recommandation** : Commencer par désactiver RLS (Étape 1), c'est la solution la plus simple.

