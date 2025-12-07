# 🔄 Solution Alternative : Migration sans Trigger

## ❌ Problème

Le trigger `handle_new_user` bloque la création des utilisateurs même après plusieurs tentatives de correction.

## ✅ Solution Alternative

Créer les utilisateurs **sans déclencher le trigger**, puis créer manuellement les profils.

### Option 1 : Désactiver le Trigger (Si Possible)

Si vous avez les permissions dans Supabase Dashboard :

1. Aller dans **Database** → **Triggers**
2. Désactiver le trigger `on_auth_user_created`
3. Exécuter `npm run migrate:auth`
4. Réactiver le trigger

### Option 2 : Créer Manuellement via Dashboard

1. Aller dans **Supabase Dashboard** → **Authentication** → **Users**
2. Créer chaque utilisateur manuellement avec :
   - Email
   - Mot de passe (non hashé, Supabase le hash automatiquement)
   - User Metadata : `{ "login": "...", "status": "..." }`
3. Le trigger créera automatiquement le profil dans `public.users`
4. Si le trigger échoue, créer manuellement les profils dans **Database** → **Tables** → `users`

### Option 3 : Modifier le Script de Migration

Créer les utilisateurs sans passer par le trigger, puis créer manuellement les profils.

---

**Recommandation** : Essayer d'abord `supabase/supprimer-recreer-trigger-simple.sql` qui supprime et recrée le trigger avec RLS désactivé.

