# Généalogie Visx - Alternative 1

## 📍 Route

`/genealogie-alternatives/visx`

## 📦 Bibliothèque

**Visx (Airbnb)** - Collection de primitives de visualisation React

### Packages utilisés
- `@visx/hierarchy` - Composants hiérarchiques
- `@visx/shape` - Formes SVG (LinkHorizontal)
- `@visx/group` - Groupement SVG
- `d3-hierarchy` - Utilitaires hiérarchiques D3

## ✅ Statut

✅ **IMPLÉMENTÉ ET OPÉRATIONNEL**

## 🎨 Fonctionnalités

- Dendrogramme horizontal interactif
- Nœuds personnalisés avec photos de profil
- Menu latéral pour ajout/modification
- Formulaire CRUD complet
- Gestion des permissions (admin/rédacteur/utilisateur)
- Responsive design

## 📊 Données

Utilise `GenealogyService.findAll()` - Même source que la version originale

## 🚀 Performance

- Bundle size : ~25-30KB (vs ~100KB react-d3-tree)
- Performance optimisée
- TypeScript natif

