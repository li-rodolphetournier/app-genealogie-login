# 🧪 Documentation Complète des Tests

**Date**: 2025-12-07  
**Statut**: ✅ **INFRASTRUCTURE COMPLÈTE**

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Tests Unitaires](#tests-unitaires)
3. [Tests d'Intégration](#tests-dintégration)
4. [Tests E2E](#tests-e2e)
5. [Best Practices](#best-practices)
6. [Configuration](#configuration)
7. [Exécution des Tests](#exécution-des-tests)
8. [Couverture de Code](#couverture-de-code)

---

## 🎯 Vue d'ensemble

Le projet utilise une approche de tests en trois niveaux :

1. **Tests Unitaires** (Vitest) - Composants, hooks, services, utilitaires
2. **Tests d'Intégration** (Vitest + React Testing Library) - Interactions entre composants
3. **Tests E2E** (Playwright) - Workflows complets de bout en bout

---

## 📦 Tests Unitaires

### Framework : Vitest

**Avantages** :
- ✅ Rapide (Vite-based)
- ✅ Compatible avec Jest
- ✅ Support TypeScript natif
- ✅ Interface UI intégrée

### Structure des Tests

```
src/
├── components/
│   ├── __tests__/
│   │   ├── ErrorBoundary.test.tsx
│   │   ├── LoadingIndicator.test.tsx
│   │   └── ToastProvider.test.tsx
│   └── cards/
│       └── __tests__/
│           ├── UserCard.test.tsx
│           └── ObjectCard.test.tsx
├── hooks/
│   └── __tests__/
│       ├── use-auth.test.tsx
│       ├── use-debounce.test.ts
│       └── use-csrf.test.ts
├── lib/
│   ├── services/
│   │   └── __tests__/
│   │       ├── user.service.test.ts
│   │       └── object.service.test.ts
│   ├── utils/
│   │   └── __tests__/
│   │       └── logger.test.ts
│   └── errors/
│       └── __tests__/
│           ├── messages.test.ts
│           └── error-handler.test.ts
└── __tests__/
    ├── next16-compatibility.test.ts
    └── supabase-compatibility.test.ts
```

### Tests Actuels

#### ✅ Composants (7 fichiers)

1. **ErrorBoundary.test.tsx**
   - Rendu normal
   - Affichage de l'UI d'erreur
   - Callback onError
   - Fallback personnalisé

2. **LoadingIndicator.test.tsx**
   - Texte par défaut et personnalisé
   - Attributs ARIA
   - Classes personnalisées

3. **ToastProvider.test.tsx**
   - Contexte useToast
   - Affichage des toasts
   - Confirmation

4. **UserCard.test.tsx**
   - Rendu avec données
   - Props par défaut

5. **ObjectCard.test.tsx**
   - Rendu avec données
   - Gestion des événements

#### ✅ Hooks (3 fichiers)

1. **use-auth.test.tsx**
   - État de chargement initial
   - Authentification réussie
   - État non authentifié
   - Déconnexion

2. **use-debounce.test.ts**
   - Valeur initiale
   - Debouncing
   - Annulation du debounce précédent

3. **use-csrf.test.ts**
   - Récupération du token
   - Cache du token
   - fetchWithCsrf

#### ✅ Services (2 fichiers)

1. **user.service.test.ts**
   - findAll()
   - findByLogin()
   - Gestion des erreurs

2. **object.service.test.ts**
   - findAll()
   - findById()
   - Gestion des erreurs

#### ✅ Utilitaires (2 fichiers)

1. **logger.test.ts**
   - Logging en développement
   - Pas de logs en production
   - Erreurs toujours loggées

2. **messages.test.ts**
   - getErrorMessage()
   - formatErrorMessage()

#### ✅ Erreurs (2 fichiers)

1. **error-handler.test.ts**
   - Erreurs Zod
   - AppError personnalisées
   - Erreurs génériques

#### ✅ Compatibilité (2 fichiers)

1. **next16-compatibility.test.ts**
   - Versions Next.js, React, TypeScript
   - Compatibilité ESLint, Zod

2. **supabase-compatibility.test.ts**
   - Versions Supabase
   - Création des clients

**Total** : **13 fichiers de tests unitaires**

---

## 🔗 Tests d'Intégration

### À créer (recommandé)

Les tests d'intégration vérifient l'interaction entre plusieurs composants :

1. **Tests d'API Routes**
   - Routes avec validation Zod
   - Gestion d'erreurs
   - Authentification

2. **Tests de Formulaires**
   - Validation côté client
   - Soumission réussie
   - Gestion des erreurs

---

## 🌐 Tests E2E

### Framework : Playwright

**Avantages** :
- ✅ Support multi-navigateurs (Chromium, Firefox, WebKit)
- ✅ Automatisation complète
- ✅ Screenshots et traces automatiques
- ✅ Tests parallèles

### Configuration

**Fichier** : `playwright.config.ts`

- ✅ Configuration multi-navigateurs
- ✅ Serveur de développement automatique
- ✅ Screenshots sur échec
- ✅ Traces pour debugging

### Tests E2E Actuels

#### ✅ Authentification (`e2e/auth.spec.ts`)

- Formulaire de connexion
- Erreurs avec identifiants invalides
- Redirection après connexion réussie

#### ✅ Navigation (`e2e/navigation.spec.ts`)

- Navigation vers la généalogie
- Navigation vers les objets
- Page 404

### Tests E2E Recommandés à Ajouter

1. **Workflow Utilisateur Complet**
   - Connexion → Navigation → Déconnexion

2. **Création d'Objet**
   - Upload d'image
   - Validation du formulaire
   - Sauvegarde réussie

3. **Gestion des Messages (Admin)**
   - Création de message
   - Upload d'images multiples
   - Suppression

---

## ✅ Best Practices

### 1. Nommage des Tests

```typescript
// ✅ Bon
describe('UserService', () => {
  it('devrait retourner tous les utilisateurs', () => {});
  it('devrait retourner null si l\'utilisateur n\'existe pas', () => {});
});

// ❌ Éviter
it('test 1', () => {});
it('should work', () => {});
```

### 2. Structure AAA (Arrange-Act-Assert)

```typescript
it('devrait créer un utilisateur', async () => {
  // Arrange (Préparer)
  const input = { login: 'test', email: 'test@test.com' };
  
  // Act (Agir)
  const user = await UserService.create(input);
  
  // Assert (Vérifier)
  expect(user.login).toBe('test');
});
```

### 3. Isolation des Tests

```typescript
beforeEach(() => {
  // Réinitialiser les mocks avant chaque test
  vi.clearAllMocks();
});
```

### 4. Tests Déterministes

```typescript
// ✅ Utiliser des données mockées fixes
const mockUser = { id: '1', login: 'test' };

// ❌ Éviter les données aléatoires
const mockUser = { id: Math.random().toString() };
```

### 5. Accessibilité dans les Tests

```typescript
// ✅ Tester via les rôles ARIA
await expect(page.getByRole('button', { name: /connexion/i })).toBeVisible();

// ❌ Éviter les sélecteurs CSS fragiles
await expect(page.locator('.btn-primary')).toBeVisible();
```

---

## ⚙️ Configuration

### Vitest (`vitest.config.ts`)

```typescript
{
  environment: 'jsdom',      // Environnement DOM pour React
  globals: true,             // Variables globales (describe, it, expect)
  setupFiles: ['./vitest.setup.ts'],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
  }
}
```

### Playwright (`playwright.config.ts`)

```typescript
{
  testDir: './e2e',
  timeout: 30 * 1000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: ['chromium', 'firefox', 'webkit']
}
```

---

## 🚀 Exécution des Tests

### Tests Unitaires

```bash
# Mode watch (développement)
npm test

# Interface UI
npm run test:ui

# Coverage
npm run test:coverage

# Mode one-shot (CI)
npm test -- --run

# Test spécifique
npm test -- logger.test.ts
```

### Tests E2E

```bash
# Tous les tests
npm run test:e2e

# Interface UI (Playwright UI)
npm run test:e2e:ui

# Mode debug
npm run test:e2e:debug

# Navigateur spécifique
npx playwright test --project=chromium

# Test spécifique
npx playwright test auth.spec.ts
```

---

## 📊 Couverture de Code

### Objectifs de Couverture

- **Minimum recommandé** : 70%
- **Critique** : 80%+
- **Idéal** : 90%+

### Zones Prioritaires

1. **Services** (DAL) - 100%
2. **Hooks personnalisés** - 90%+
3. **Composants critiques** - 80%+
4. **Utilitaires** - 100%
5. **Gestion d'erreurs** - 100%

### Générer le Rapport

```bash
npm run test:coverage
```

Le rapport est généré dans `coverage/` :
- `coverage/index.html` - Rapport HTML interactif
- `coverage/coverage-final.json` - Données JSON

---

## 📈 Statistiques Actuelles

| Catégorie | Fichiers | Tests | Statut |
|-----------|----------|-------|--------|
| **Composants** | 5 | ~15 | ✅ |
| **Hooks** | 3 | ~12 | ✅ |
| **Services** | 2 | ~8 | ✅ |
| **Utilitaires** | 2 | ~8 | ✅ |
| **Erreurs** | 2 | ~8 | ✅ |
| **Compatibilité** | 2 | ~9 | ✅ |
| **E2E** | 2 | ~6 | ✅ |
| **Total** | **18** | **~66** | ✅ |

---

## 🎯 Prochaines Étapes

### Court Terme
- ✅ Infrastructure complète
- ✅ Tests de base créés

### Moyen Terme
1. **Augmenter la couverture**
   - Tests pour tous les services (MessageService, GenealogyService)
   - Tests pour les composants de formulaire
   - Tests pour les routes API

2. **Tests d'intégration**
   - Workflows utilisateur complets
   - Intégration Supabase
   - Upload de fichiers

3. **Tests E2E supplémentaires**
   - Workflow création d'objet
   - Workflow administration des messages
   - Tests de performance

---

## 📚 Ressources

- [Documentation Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Dernière mise à jour**: 2025-12-07  
**Statut**: ✅ **Infrastructure complète et opérationnelle**
