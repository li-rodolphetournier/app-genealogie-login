# Tests de Validation pour les Alternatives Généalogiques

Ce dossier contient une suite complète de tests pour valider les fonctionnalités de création, modification, suppression, gestion des liens parent-enfant, dates, rôles, images et placement dans les 3 alternatives (Visx, Nivo, TreeCharts).

## Structure des Tests

### 1. `tree-construction.test.ts`
Tests de construction des arbres généalogiques :
- Structure de base (racines, enfants)
- Gestion des liens parent-enfant
- Cas limites (cycles, plusieurs racines, personnes isolées)
- Gestion des images et dates de décès

### 2. `tree-placement.test.ts`
Tests du placement des nœuds par rapport aux parents :
- Respect de l'ordre de naissance
- Tri par date de naissance comme critère secondaire
- Placement sous le parent correct (père/mère)

### 3. `image-validation.test.ts`
Tests de validation des images :
- URLs valides (HTTPS, HTTP)
- Images nulles ou vides
- URLs invalides
- Différentes extensions d'image
- Mise à jour et suppression d'images

### 4. `alternative-tree-consistency.test.ts`
Tests de cohérence entre les 3 alternatives :
- Vérification que toutes les alternatives produisent la même structure
- Préservation des propriétés (images, dates, descriptions)
- Validation de l'ordre de naissance

### 5. `all-alternatives-comparison.test.ts`
Tests comparatifs pour s'assurer que Visx, Nivo et TreeCharts construisent des arbres identiques avec les mêmes données.

## Tests de Validation (dans `src/lib/validations/__tests__/`)

### `genealogy.schema.test.ts`
Tests des schémas Zod :
- Validation de base (champs requis, longueurs)
- Validation des dates
- Validation des images
- Validation des relations parent-enfant
- Validation de l'ordre de naissance

### `genealogy.business-rules.test.ts`
Tests des règles métier :
- Auto-référence (une personne ne peut pas être son propre parent)
- Validation du genre des parents (homme = père, femme = mère)
- Validation des références circulaires
- Validation des dates (décès après naissance)
- Validation de l'âge parent-enfant
- Une personne ne peut pas être à la fois père et mère

## Tests d'API (dans `src/app/api/genealogie/__tests__/`)

### `validation-rules.test.ts`
Tests des règles de validation appliquées aux API routes :
- Validation des liens parent-enfant
- Validation des dates
- Validation des références circulaires

### `api-routes.integration.test.ts`
Tests d'intégration pour les routes API :
- POST /api/genealogie/add
- PUT /api/genealogie/update
- DELETE /api/genealogie/delete

## Exécution des Tests

```bash
# Tous les tests
npm test

# Tests spécifiques aux alternatives
npm test -- src/app/genealogie-alternatives/__tests__

# Tests de validation
npm test -- src/lib/validations/__tests__

# Tests avec couverture
npm run test:coverage
```

## Couverture des Tests

Les tests couvrent :

✅ **Création** : Validation de tous les champs, règles métier
✅ **Modification** : Mise à jour partielle, validation des changements
✅ **Suppression** : Validation de l'ID requis
✅ **Liens parent-enfant** : Père/mère, validation du genre, références circulaires
✅ **Dates** : Naissance, décès, cohérence temporelle
✅ **Rôles** : Homme/femme, père/mère, enfants
✅ **Images** : URLs valides, gestion des valeurs nulles/vides
✅ **Placement** : Ordre de naissance, tri par date, position par rapport au parent

## Notes

- Toutes les alternatives (Visx, Nivo, TreeCharts) utilisent la même logique de construction d'arbre
- Les tests vérifient la cohérence entre les 3 alternatives
- Les règles métier sont testées indépendamment des schémas de validation Zod

