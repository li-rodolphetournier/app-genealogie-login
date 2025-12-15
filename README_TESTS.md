# 🧪 Guide des Tests

## 📋 Commandes Disponibles

```bash
# Lancer les tests en mode watch (recommandé pour le développement)
npm test

# Lancer les tests avec interface UI
npm run test:ui

# Générer un rapport de couverture
npm run test:coverage

# Lancer les tests une seule fois
npm test -- --run

# Lancer les tests en mode watch pour un fichier spécifique
npm test -- logger.test.ts
```

## 📁 Structure des Tests

Les tests sont organisés dans des dossiers `__tests__` à côté des fichiers source (pattern classique **co-located tests**) :

```
src/
├── app/
│   └── api/
│       ├── auth/
│       │   └── __tests__/...
│       ├── categories/
│       │   └── __tests__/categories.test.ts
│       ├── objects/
│       │   └── __tests__/route.test.ts
│       └── ...
├── hooks/
│   ├── use-genealogy-*.ts
│   └── __tests__/use-genealogy-*.test.ts
├── components/
│   ├── __tests__/... (composants génériques)
│   ├── cards/__tests__/...
│   ├── theme/__tests__/...
│   ├── monitoring/__tests__/...
│   └── file-uploader/__tests__/file-uploader.test.tsx
└── lib/
    ├── services/__tests__/...
    ├── monitoring/__tests__/...
    ├── lighthouse/__tests__/redis.test.ts
    ├── api/__tests__/...
    ├── security/__tests__/...
    ├── errors/__tests__/...
    └── utils/__tests__/logger.test.ts
```

## ✅ Tests actuellement disponibles (Vue d’ensemble)

**Chiffres globaux Vitest** :
- ✅ ~**84 fichiers de tests**  
- ✅ ~**400 tests** (unitaires + intégration)

- **API (routes Next.js)** :
  - Auth (`login`, `logout`, `profile`, `change-password`, `reset-password`, `forgot-password`, `admin/reset-password`, `password-reset-logs`, `get-email-by-login`)
  - CSRF (`/api/csrf/token`)
  - Users (`/api/users`, `/api/users/[login]`, `/api/create-user`)
  - Categories, Messages, Upload, Theme default template, Persons stats, Monitoring (lighthouse/tests/metrics/alerts), Objects (CRUD, photos, history)

- **Hooks** :
  - `use-auth`, `use-csrf`, `use-debounce`, `use-auto-hide`, `use-session-timeout`
  - Généalogie : `use-genealogy-data`, `use-genealogy-form`, `use-genealogy-tree`, `use-genealogy-zoom`, `use-genealogy-dimensions`, `use-genealogy-drag`, `use-genealogy-history`, `use-genealogy-positions`
  - Thème : `use-theme-transition`, (logique de `use-theme` couverte indirectement via composants)
  - Stockage : `use-local-storage`

- **Composants** :
  - UI générique : `LoadingIndicator`, `ToastProvider`, `ErrorBoundary`, `ConfirmDeleteModal`, `Modal`, carrousels d’images, `ImageWithFallback`, `ImageUploader`, `FileUploader`, `UserCreateForm`
  - Thème : `ThemeToggle`, `ThemeSwitch`, `ThemeIcon`, `ThemeTab`, `ThemeTransitionOverlay`, `ThemeFloatingMenu`, `ThemeTemplateSelector`
  - Auth/session : `SessionTimeoutProvider`, `IdleWarning`, `LoginLoadingScreen`
  - Généalogie : `GenealogyForm`, `TreeNodeRenderer`, cartes `UserCard` / `ObjectCard`, menus de l’arbre
  - Monitoring : `SecurityTestsPanel`, `SecurityMonitoringPanel`

- **Services / utilitaires** :
  - `logger`, erreurs (`error-handler`, `messages`)
  - Monitoring & sécurité : `monitoring/metrics`, `monitoring/alert-manager`, `security/csrf`, `security/tests/security-tests` (via API), `rate-limit` couvert indirectement
  - Lighthouse / Redis : `lighthouse/redis`
  - Compatibilité : `supabase-compatibility`, `next16-compatibility`

## 🔧 Configuration

- **Framework** : Vitest
- **Environment** : jsdom (pour les tests React)
- **Coverage** : v8 provider
- **Mocks** : Next.js router et Image

## 📝 Écrire de Nouveaux Tests

### Exemple de Test Unitaire

```typescript
import { describe, it, expect } from 'vitest';
import { maFonction } from '../mon-fichier';

describe('maFonction', () => {
  it('devrait retourner la valeur attendue', () => {
    const result = maFonction('input');
    expect(result).toBe('expected');
  });
});
```

### Exemple de Test de Composant

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MonComposant } from '../MonComposant';

describe('MonComposant', () => {
  it('devrait afficher le texte', () => {
    render(<MonComposant text="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## 🎯 Prochaines Étapes

- [ ] Compléter la couverture de `use-theme` (tests dédiés sur BroadcastChannel / localStorage)
- [ ] Approfondir la couverture de certains scénarios d’erreurs (API monitoring, sécurité avancée)
- [ ] Étendre les scénarios Playwright (E2E) si de nouveaux flux critiques sont ajoutés
