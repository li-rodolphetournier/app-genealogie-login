# 🔧 Étapes Finales : Migration Auth

## ⚠️ Problème Identifié

Le trigger `handle_new_user` bloque la création des utilisateurs même avec RLS désactivé.

## ✅ Solution : Désactiver le Trigger

### Étape 1 : Désactiver le Trigger

Exécuter dans **Supabase Dashboard** → **SQL Editor** :

```sql
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
```

**Fichier** : `supabase/disable-trigger-for-migration.sql`

### Étape 2 : Migrer les Utilisateurs

```bash
npm run migrate:auth
```

Le script va maintenant :
- ✅ Créer les utilisateurs dans Supabase Auth
- ✅ Créer manuellement les profils dans la table `users` (car le trigger est désactivé)

### Étape 3 : Réactiver le Trigger et RLS

Après la migration réussie, exécuter :

```sql
-- Réactiver le trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- Réactiver RLS (si désactivé)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

**Fichier** : `supabase/enable-trigger-after-migration.sql`

---

## 📋 Checklist

- [ ] Désactiver le trigger (`disable-trigger-for-migration.sql`)
- [ ] Exécuter `npm run migrate:auth`
- [ ] Vérifier que les utilisateurs sont créés
- [ ] Réactiver le trigger (`enable-trigger-after-migration.sql`)
- [ ] Réactiver RLS si désactivé

---

**Action immédiate** : Exécuter `supabase/disable-trigger-for-migration.sql` puis relancer la migration.

