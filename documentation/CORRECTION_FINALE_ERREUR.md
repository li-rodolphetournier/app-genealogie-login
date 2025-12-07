# 🔧 Correction Finale : Erreur RLS

## ❌ Erreur

```
ERROR: 0A000: cannot alter type of a column used in a policy definition
DETAIL: policy "Users can view own profile" on table users depends on column "id"
```

## ✅ Solution

J'ai **corrigé le script principal** `supabase/migration-auth-complete.sql` pour :

1. ✅ **Supprimer d'abord** toutes les politiques RLS
2. ✅ **Désactiver RLS** temporairement
3. ✅ **NE PAS modifier** le type de colonne (évite l'erreur)
4. ✅ **Supprimer seulement** `password_hash`
5. ✅ **Recréer** les politiques après

## 🚀 Utilisation

### Option 1 : Script Corrigé Principal ⭐

**Fichier** : `supabase/migration-auth-complete.sql` (CORRIGÉ)

1. Ouvrir le fichier
2. Copier tout le contenu
3. Supabase Dashboard → SQL Editor
4. Coller et Run

### Option 2 : Script Simplifié

**Fichier** : `supabase/migration-auth-simple.sql`

Même démarche.

## 📋 Ce qui a été corrigé

Le script **ne modifie plus** le type de la colonne `id`. Il :
- Supprime seulement `password_hash`
- Crée la table si elle n'existe pas
- Ajoute la foreign key si possible
- Évite complètement les modifications de type

## ✅ Résultat

Le script devrait maintenant s'exécuter **sans erreur** !

---

**Action** : Utiliser `supabase/migration-auth-complete.sql` (version corrigée)

