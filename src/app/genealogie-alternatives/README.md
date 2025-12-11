# 🌳 Alternatives de Visualisation Généalogique

Ce dossier contient toutes les alternatives à `react-d3-tree` pour visualiser l'arbre généalogique.

## 📁 Structure

```
genealogie-alternatives/
├── visx/          # Alternative 1 : Visx ✅
├── nivo/          # Alternative 2 : Nivo ✅
└── treecharts/    # Alternative 3 : TreeCharts ✅
```

## 🎯 Objectif

Permettre de comparer différentes bibliothèques de visualisation d'arbres pour choisir la meilleure solution, toutes utilisant :
- ✅ La **même source de données** (`GenealogyService`)
- ✅ Les **mêmes fonctionnalités CRUD**
- ✅ Les **mêmes routes API**

## 🛣️ Routes

| Alternative | Route | Statut |
|------------|-------|--------|
| Visx | `/genealogie-alternatives/visx` | ✅ Opérationnel |
| Nivo | `/genealogie-alternatives/nivo` | ✅ Opérationnel |
| TreeCharts | `/genealogie-alternatives/treecharts` | ✅ Opérationnel |

## 📊 Source de Données

Toutes les alternatives utilisent :
- **Service** : `GenealogyService.findAll()`
- **API Route** : `/api/genealogie-alternatives` (ou `/api/genealogie` directement)
- **Type** : `Person[]` depuis Supabase

## 🔄 Workflow

1. **Tester chaque alternative** avec les mêmes données
2. **Comparer** : performance, bundle size, personnalisation, UX
3. **Choisir** la meilleure solution
4. **Décider** : migrer ou garder plusieurs alternatives actives

## 📝 Documentation

Chaque dossier contient un `README.md` avec les détails spécifiques de l'alternative.

