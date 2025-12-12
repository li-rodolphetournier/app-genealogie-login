# 🎛️ Système de Feature Flags

Ce dossier contient les features isolées qui peuvent être activées/désactivées via des variables d'environnement.

## 📋 Features Disponibles

### 1. 🔍 Auth Debug

**Module** : `src/lib/features/auth-debug/`

**Description** : Panneau de debug pour tracer tous les événements d'authentification.

**Contrôle** : Variable d'environnement `NEXT_PUBLIC_ENABLE_AUTH_DEBUG`

**Activation** :
```bash
# Dans .env.local
NEXT_PUBLIC_ENABLE_AUTH_DEBUG=true
```

**Désactivation** :
```bash
# Dans .env.local
NEXT_PUBLIC_ENABLE_AUTH_DEBUG=false
```

**Comportement par défaut** :
- ✅ Activé en développement
- ❌ Désactivé en production (sauf si explicitement activé)

**Utilisation** :
```typescript
import { logAuth, AuthDebugPanelWrapper } from '@/lib/features/auth-debug';

// Dans votre composant
logAuth.debug('CATEGORY', 'Message', { data: 'value' });

// Dans layout.tsx
<AuthDebugPanelWrapper />
```

---

### 2. 🎭 Mock Auth (No Login)

**Module** : `src/lib/features/mock-auth/`

**Description** : Permet de simuler une authentification sans connexion réelle (pour tests).

**Contrôle** : Variable d'environnement `NEXT_PUBLIC_ENABLE_MOCK_AUTH`

**Activation** :
```bash
# Dans .env.local
NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
```

**Désactivation** :
```bash
# Dans .env.local
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
```

**Comportement par défaut** :
- ✅ Activé en développement
- ❌ **JAMAIS activé en production** (sécurité)

**Utilisation** :
```typescript
import { isMockModeEnabled, createMockUser } from '@/lib/features/mock-auth';

// Vérifier si le mode mock est activé
if (isMockModeEnabled()) {
  const mockUser = createMockUser('test-id');
  // Utiliser mockUser...
}
```

**Accès via URL** :
```
http://localhost:3000/accueil?mock=test-id
```

---

## 🚀 Configuration

### Fichier `.env.local`

```bash
# Feature Flags
NEXT_PUBLIC_ENABLE_AUTH_DEBUG=true   # Activer le debug auth
NEXT_PUBLIC_ENABLE_MOCK_AUTH=true    # Activer le mock auth (dev uniquement)
```

### Désactiver toutes les features

```bash
NEXT_PUBLIC_ENABLE_AUTH_DEBUG=false
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
```

---

## 📦 Structure des Modules

```
src/lib/features/
├── flags.ts                    # Feature flags centralisés
├── index.ts                    # Point d'entrée unifié
├── auth-debug/                 # Module Auth Debug
│   ├── index.ts
│   ├── auth-logger.ts
│   ├── AuthDebugPanel.tsx
│   └── AuthDebugPanelWrapper.tsx
└── mock-auth/                  # Module Mock Auth
    ├── index.ts
    └── mock.ts
```

---

## 🔒 Sécurité

- **Mock Auth** : Désactivé automatiquement en production (sécurité)
- **Auth Debug** : Peut être activé en production si nécessaire (pour debugging)

---

## 📝 Notes

- Les features sont complètement isolées et peuvent être supprimées sans affecter le reste du code
- Tous les imports doivent passer par `@/lib/features` pour garantir l'isolation
- Les anciens fichiers (`src/lib/utils/auth-logger.ts`, `src/lib/auth/mock.ts`) ont été supprimés

