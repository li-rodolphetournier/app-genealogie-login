# ✅ Solution Finale : Migration Auth

## 🔍 Diagnostic

L'erreur `unexpected_failure` (500) persiste même après avoir exécuté le script de fix des politiques RLS.

## ✅ Solution

Le problème vient du trigger `handle_new_user` qui ne peut pas insérer dans la table `users` à cause de RLS, même avec `SECURITY DEFINER`.

### Étape 1 : Exécuter le Script SQL de Correction du Trigger

Exécuter dans **Supabase Dashboard** → **SQL Editor** :

```sql
-- Modifier la fonction handle_new_user pour désactiver RLS temporairement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Désactiver RLS temporairement pour cette fonction
    PERFORM set_config('row_security', 'off', true);
    
    INSERT INTO public.users (id, email, login, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'login', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'status', 'utilisateur')
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Ce script modifie le trigger pour désactiver RLS temporairement lors de l'insertion.

### Étape 2 : Réexécuter la Migration

```bash
npm run migrate:auth
```

## ⚠️ Problème Secondaire : Emails Dupliqués

Dans `users.json`, plusieurs utilisateurs ont le même email `genie@free.fr` :
- "utilisateur" → `genie@free.fr`
- "MarieGe" → `genie@free.fr`
- "Florian" → `genie@free.fr`

**Supabase Auth nécessite des emails uniques.** Seul le premier utilisateur avec cet email sera créé. Les autres échoueront avec une erreur "email already registered".

### Solution Optionnelle : Corriger les Emails

Modifier `src/data/users.json` pour donner des emails uniques à chaque utilisateur, par exemple :
- "utilisateur" → `utilisateur@example.com`
- "MarieGe" → `mariege@example.com`
- "Florian" → `florian@example.com`

## 📋 Scripts SQL à Exécuter dans l'Ordre

1. ✅ `supabase/migration-auth-complete.sql` (déjà fait)
2. ✅ `supabase/fix-auth-migration.sql` (politiques RLS)
3. ⏳ `supabase/fix-trigger-rls.sql` (correction du trigger) ← **À faire maintenant**

---

**Après avoir exécuté le script fix-trigger-rls.sql, réexécuter `npm run migrate:auth`**

