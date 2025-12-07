# 🔧 Instructions : Corriger l'Erreur de Migration

## ❌ Erreur Rencontrée

```
ERROR: 0A000: cannot alter type of a column used in a policy definition
DETAIL: policy "Users can view own profile" on table users depends on column "id"
```

## ✅ Solution Rapide

### Option 1 : Script Simplifié (Recommandé) ⭐

**Utiliser** : `supabase/migration-auth-simple.sql`

Ce script évite complètement de modifier le type de colonne et fonctionne même avec des politiques RLS existantes.

### Option 2 : Nettoyage Puis Script

**Étape 1** : Exécuter le nettoyage

**Fichier** : `supabase/migration-auth-step1-nettoyage.sql`

1. Copier-coller dans Supabase Dashboard → SQL Editor
2. Exécuter

**Étape 2** : Exécuter le script de migration simplifié

**Fichier** : `supabase/migration-auth-simple.sql`

## 📋 Scripts Disponibles

1. **`migration-auth-step1-nettoyage.sql`** - Nettoyage des politiques RLS
2. **`migration-auth-simple.sql`** - Script simplifié (RECOMMANDÉ)
3. **`migration-auth-complete-v2.sql`** - Version complète corrigée

## 🎯 Action Immédiate

**Utilisez** `supabase/migration-auth-simple.sql` - C'est le plus sûr et évite l'erreur !

---

**Solution** : Le script simplifié évite de modifier le type de colonne, donc pas d'erreur.

