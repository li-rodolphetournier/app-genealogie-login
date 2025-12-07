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

Les tests sont organisés dans des dossiers `__tests__` à côté des fichiers source :

```
src/
├── lib/
│   ├── utils/
│   │   ├── logger.ts
│   │   └── __tests__/
│   │       └── logger.test.ts
│   └── errors/
│       ├── messages.ts
│       └── __tests__/
│           └── messages.test.ts
└── components/
    └── cards/
        ├── UserCard.tsx
        ├── ObjectCard.tsx
        └── __tests__/
            ├── UserCard.test.tsx
            └── ObjectCard.test.tsx
```

## ✅ Tests Actuellement Disponibles

1. **Logger** (`src/lib/utils/__tests__/logger.test.ts`)
   - Tests du comportement en développement vs production
   - Vérification que les erreurs sont toujours loggées

2. **Messages d'erreur** (`src/lib/errors/__tests__/messages.test.ts`)
   - Tests de récupération des messages
   - Tests de formatage avec variables

3. **UserCard** (`src/components/cards/__tests__/UserCard.test.tsx`)
   - Tests de rendu
   - Tests d'interaction (suppression)

4. **ObjectCard** (`src/components/cards/__tests__/ObjectCard.test.tsx`)
   - Tests de rendu
   - Tests d'interaction

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

- [ ] Ajouter des tests pour les hooks
- [ ] Tests d'intégration pour les routes API
- [ ] Tests E2E avec Playwright

