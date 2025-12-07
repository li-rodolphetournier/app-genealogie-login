# 🔍 Audit Complet : Sécurité, Accessibilité et Performances

**Date** : Aujourd'hui  
**Version** : 1.0  
**Scope** : Application complète

---

## 📊 Résumé Exécutif

| Catégorie | Score | Statut | Priorité |
|-----------|-------|--------|----------|
| **Sécurité** | 75/100 | 🟡 À améliorer | HAUTE |
| **Accessibilité** | 65/100 | 🟡 À améliorer | MOYENNE |
| **Performances** | 70/100 | 🟡 Bon | MOYENNE |

---

## 🔐 1. AUDIT DE SÉCURITÉ

### ✅ Points Forts

1. **Authentification Supabase Auth** ✅
   - Sessions sécurisées via cookies httpOnly
   - Plus de mots de passe en clair
   - Gestion automatique des tokens

2. **Validation Zod** ✅
   - Validation runtime sur toutes les routes API
   - Types TypeScript synchronisés
   - 9 routes protégées par validation

3. **Headers de Sécurité** ✅
   - CSP configuré
   - X-Frame-Options, X-Content-Type-Options
   - HSTS activé

4. **Rate Limiting** ✅
   - Protection login : 5 tentatives / 15 min
   - API générale : 100 requêtes / minute
   - Headers de rate limit

5. **Middleware de Protection** ✅
   - Routes protégées automatiquement
   - Vérification des rôles (admin, rédacteur)
   - Redirection sécurisée

6. **Protection XSS** ✅
   - Aucun `dangerouslySetInnerHTML` trouvé
   - Aucun `eval()` ou `innerHTML` non sécurisé
   - Échappement automatique React

### ⚠️ Points à Améliorer (CRITIQUE)

#### 1.1 Protection CSRF Non Appliquée

**Problème** : Le système CSRF existe (`src/lib/security/csrf.ts`) mais **n'est pas utilisé** dans les routes API.

**Risque** : 🔴 **HAUT** - Vulnérable aux attaques CSRF sur les mutations

**Impact** : Un attaquant pourrait faire exécuter des actions au nom de l'utilisateur authentifié.

**Solution** :

```typescript
// Exemple pour /api/users (POST)
import { verifyCsrfToken } from '@/lib/security/csrf';

export async function POST(request: Request) {
  // Vérifier le token CSRF pour les mutations
  const isValidCsrf = await verifyCsrfToken(request);
  if (!isValidCsrf) {
    return NextResponse.json(
      { error: 'Token CSRF invalide' },
      { status: 403 }
    );
  }
  // ... reste du code
}
```

**Routes à protéger** :
- ✅ `/api/users` (POST, PUT, DELETE)
- ✅ `/api/objects` (POST, PUT)
- ✅ `/api/messages` (POST, PUT, DELETE)
- ✅ `/api/genealogie` (POST, PUT)
- ✅ `/api/upload` (POST)

**Priorité** : 🔴 **CRITIQUE**

---

#### 1.2 Rate Limiting en Mémoire (Non Scalable)

**Problème** : Le rate limiting utilise un `Map` en mémoire (`src/lib/security/rate-limit.ts`).

**Risque** : 🟡 **MOYEN** - Perte des compteurs lors du redémarrage, ne fonctionne pas avec plusieurs instances

**Impact** : En production avec plusieurs instances Next.js, le rate limiting ne fonctionnera pas correctement.

**Solution Recommandée** : Migrer vers Redis

```typescript
// Exemple avec Redis (à implémenter)
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
) {
  const key = `rate-limit:${identifier}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, Math.floor(options.windowMs / 1000));
  }
  
  return {
    allowed: count <= options.maxRequests,
    remaining: Math.max(0, options.maxRequests - count),
  };
}
```

**Priorité** : 🟡 **MOYENNE** (pour la production)

---

#### 1.3 Validation d'Email Faible sur Login

**Problème** : La route `/api/auth/login` accepte n'importe quelle chaîne comme "login" et essaie de la traiter comme email.

**Risque** : 🟡 **MOYEN** - Possibilité de tester différents formats, fuite d'informations

**Fichier** : `src/app/api/auth/login/route.ts:27-46`

**Solution** :

```typescript
// Ajouter validation avant tentative
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isEmail = emailRegex.test(login);

if (!isEmail) {
  // Chercher directement par login dans la table users
  const { data: userByLogin } = await supabase
    .from('users')
    .select('email')
    .eq('login', login)
    .single();
  
  if (!userByLogin) {
    return NextResponse.json(
      { error: 'Identifiants incorrects' },
      { status: 401 }
    );
  }
  
  // Utiliser l'email trouvé
  login = userByLogin.email;
}
```

**Priorité** : 🟡 **MOYENNE**

---

#### 1.4 Pas de Vérification CSRF sur le Client

**Problème** : Les formulaires ne génèrent ni n'envoient de tokens CSRF.

**Risque** : 🔴 **HAUT** - Vulnérable aux attaques CSRF

**Solution** : Ajouter un hook pour gérer les tokens CSRF côté client

**Priorité** : 🔴 **CRITIQUE**

---

#### 1.5 Variables d'Environnement Exposées

**Problème** : `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont exposées au client.

**Risque** : 🟡 **MOYEN** - Normal pour Supabase, mais à surveiller

**Note** : C'est normal pour Supabase (l'anon key est publique par design), mais :
- ✅ RLS (Row Level Security) doit être correctement configuré dans Supabase
- ⚠️ Vérifier que les politiques RLS sont strictes

**Priorité** : 🟡 **MOYENNE** (vérification RLS Supabase)

---

#### 1.6 Gestion d'Erreurs Trop Verbale

**Problème** : Certaines erreurs exposent des détails techniques (codes d'erreur, stack traces).

**Risque** : 🟡 **MOYEN** - Fuite d'informations

**Fichiers** :
- `src/lib/errors/error-handler.ts` - ✅ Déjà bien géré en production
- Vérifier que tous les catch exposent des messages génériques

**Priorité** : 🟢 **FAIBLE**

---

### 📋 Checklist Sécurité

- ✅ Authentification Supabase Auth
- ✅ Validation Zod
- ✅ Headers de sécurité
- ✅ Rate limiting (basique)
- ✅ Protection XSS
- ✅ Hashage bcrypt (si encore utilisé)
- ❌ **Protection CSRF appliquée** (existe mais non utilisé)
- ❌ **Rate limiting Redis** (en production)
- ⚠️ Validation login améliorée
- ✅ Middleware de protection
- ✅ Gestion d'erreurs sécurisée (globalement)

**Score Sécurité** : **75/100** 🟡

---

## ♿ 2. AUDIT D'ACCESSIBILITÉ (A11y)

### ✅ Points Forts

1. **ARIA Labels** ✅
   - Nombreux `aria-label` sur les boutons
   - `role="alert"` et `role="status"` pour les messages
   - `aria-required="true"` sur les champs requis

2. **Structure Sémantique** ✅
   - Utilisation de `<header>`, `<nav>`, `<main>`
   - Labels HTML (`htmlFor` / `for`)

3. **Images avec Alt Text** ✅
   - La plupart des images ont des attributs `alt` descriptifs
   - Composant `ImageWithFallback` avec support alt

4. **Navigation Clavier** ⚠️
   - Partiellement supporté
   - Modales avec gestion clavier

### ⚠️ Points à Améliorer

#### 2.1 Utilisation de `alert()` et `confirm()` (19 occurrences)

**Problème** : Utilisation de `window.alert()` et `window.confirm()` qui ne sont pas accessibles.

**Risque** : 🟡 **MOYEN** - Mauvaise expérience pour les lecteurs d'écran

**Fichiers affectés** :
- `src/app/genealogie/genealogie-client.tsx` (7 alert)
- `src/app/messages/messages-client.tsx` (5 alert, 1 confirm)
- `src/app/objects/objects-client.tsx` (2 alert)
- `src/app/users/users-client.tsx` (2 alert)
- `src/app/users/users-list-client.tsx` (2 alert)

**Solution Recommandée** : Créer un composant de toast/notification accessible

**Priorité** : 🟡 **MOYENNE**

---

#### 2.2 Images Sans Alt Text

**Problème** : Certaines images n'ont pas d'attribut `alt` ou ont des alt génériques.

**Fichiers** :
- `src/components/FamilyTreeNode.tsx:79` - Alt présent mais pourrait être plus descriptif
- Vérifier toutes les images dans les listes

**Solution** :

```tsx
// ❌ Mauvais
<img src={photo.url} alt="Photo" />

// ✅ Bon
<img src={photo.url} alt={`Photo de ${object.nom} - ${photo.description}`} />
```

**Priorité** : 🟡 **MOYENNE**

---

#### 2.3 Navigation Clavier Incomplète

**Problème** : Certains éléments interactifs ne sont pas accessibles au clavier.

**Fichiers** :
- `src/app/genealogie/genealogie-client.tsx` - Nœuds d'arbre pas accessibles au clavier
- Certains boutons sans `tabIndex` ou gestion `onKeyDown`

**Solution** : Ajouter support clavier

```tsx
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  tabIndex={0}
  aria-label="Action description"
>
```

**Priorité** : 🟡 **MOYENNE**

---

#### 2.4 Contraste des Couleurs Non Vérifié

**Problème** : Pas de vérification automatique du ratio de contraste WCAG.

**Risque** : 🟡 **MOYEN** - Certains textes pourraient ne pas respecter WCAG AA (4.5:1)

**Solution** : Utiliser un outil comme `axe-core` ou `pa11y` pour vérifier

**Priorité** : 🟢 **FAIBLE**

---

#### 2.5 Focus Visible

**Problème** : Certains éléments peuvent manquer d'indicateurs de focus visibles.

**Solution** : Ajouter des styles de focus clairs

```css
/* Dans globals.css ou Tailwind */
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

**Priorité** : 🟢 **FAIBLE**

---

#### 2.6 Formulaire Sans Validation Visuelle Accessible

**Problème** : Les erreurs de formulaire ne sont pas toujours liées aux champs via `aria-describedby`.

**Solution** : Améliorer la liaison des erreurs

```tsx
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    aria-invalid={!!error}
    aria-describedby={error ? "email-error" : undefined}
  />
  {error && (
    <div id="email-error" role="alert" className="text-red-500">
      {error}
    </div>
  )}
</div>
```

**Priorité** : 🟡 **MOYENNE**

---

### 📋 Checklist Accessibilité

- ✅ ARIA labels sur boutons
- ✅ Structure sémantique (header, nav, main)
- ⚠️ Images avec alt (la plupart, quelques améliorations)
- ⚠️ Navigation clavier (partiellement)
- ❌ **Remplacement alert()/confirm()** (19 occurrences)
- ⚠️ Focus visible (à améliorer)
- ⚠️ Validation formulaires accessible
- ⚠️ Contraste vérifié (manuellement)

**Score Accessibilité** : **65/100** 🟡

---

## ⚡ 3. AUDIT DE PERFORMANCES

### ✅ Points Forts

1. **Server Components** ✅
   - 7 pages converties en Server Components
   - Données pré-chargées côté serveur
   - Moins de JavaScript côté client

2. **Images Optimisées** ✅
   - Utilisation de `next/image`
   - Lazy loading automatique
   - Formats optimisés (WebP, AVIF)
   - Composant `ImageWithFallback` optimisé

3. **Memoization** ✅
   - `useMemo` dans `objects-client.tsx` pour filtres/tri
   - `React.memo` sur `ImageResizer`
   - `useCallback` pour handlers

4. **Cache Next.js** ✅
   - Revalidation après mutations
   - Cache automatique Server Components

### ⚠️ Points à Améliorer

#### 3.1 Pas de Lazy Loading des Composants Lourds

**Problème** : Composants volumineux chargés immédiatement.

**Composants à lazy loader** :
- `react-d3-tree` dans `genealogie-client.tsx` (~100KB)
- `react-chartjs-2` dans `chart/page.tsx` (~80KB)
- `ConfirmDeleteModal` (si volumineux)

**Solution** :

```tsx
// Avant
import Tree from 'react-d3-tree';

// Après
import dynamic from 'next/dynamic';

const Tree = dynamic(() => import('react-d3-tree'), {
  ssr: false,
  loading: () => <div>Chargement de l'arbre...</div>
});
```

**Impact estimé** : Réduction bundle initial de ~180KB

**Priorité** : 🟡 **MOYENNE**

---

#### 3.2 Bibliothèques Lourdes Non Optimisées

**Problème** : Plusieurs bibliothèques de visualisation.

**Bibliothèques** :
- `react-d3-tree` : ~100KB
- `react-chartjs-2` : ~80KB
- `chart.js` : ~250KB (partagé)
- `recharts` : ~150KB (non utilisé ?)

**Recommandation** :
- ✅ Garder `react-d3-tree` (nécessaire)
- ✅ Garder `react-chartjs-2` (nécessaire)
- ❓ Vérifier si `recharts` est utilisé (sinon supprimer)

**Solution** : Vérifier les imports

```bash
grep -r "from 'recharts'" src/
```

**Priorité** : 🟡 **MOYENNE**

---

#### 3.3 Bundle Size Non Analysé

**Problème** : Pas d'analyse automatique de la taille des bundles.

**Solution** : Ajouter `@next/bundle-analyzer`

```bash
npm install --save-dev @next/bundle-analyzer
```

```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

**Priorité** : 🟢 **FAIBLE**

---

#### 3.4 Pas de Code Splitting des Routes

**Problème** : Toutes les pages sont chargées dans le bundle initial.

**Note** : Next.js 15 fait déjà du code splitting automatique, mais on peut optimiser.

**Priorité** : 🟢 **FAIBLE** (Next.js gère déjà bien)

---

#### 3.5 Re-renders Inutiles Potentiels

**Problème** : Certains composants pourraient être optimisés avec `React.memo`.

**Composants candidats** :
- `UserCard` dans `users-client.tsx`
- `ObjectCard` dans `objects-client.tsx`
- Composants de liste

**Solution** : Ajouter `React.memo` sur les composants de liste

**Priorité** : 🟢 **FAIBLE**

---

#### 3.6 Images Sans Dimensions

**Problème** : Certaines images n'ont pas de dimensions fixes, causant des CLS (Cumulative Layout Shift).

**Solution** : Toujours spécifier width/height ou utiliser aspect-ratio

```tsx
// ✅ Bon
<Image
  src={photo.url}
  width={500}
  height={500}
  alt="Description"
/>

// ✅ Ou avec aspect-ratio
<div className="aspect-square">
  <Image fill src={photo.url} alt="Description" />
</div>
```

**Priorité** : 🟡 **MOYENNE**

---

### 📋 Checklist Performances

- ✅ Server Components (7 pages)
- ✅ Images optimisées (next/image)
- ✅ Memoization (useMemo, useCallback)
- ✅ Cache Next.js
- ⚠️ **Lazy loading composants lourds** (à améliorer)
- ⚠️ **Bundle size analysé** (à ajouter)
- ⚠️ **Dimensions images** (quelques améliorations)
- ✅ Code splitting automatique Next.js

**Score Performances** : **70/100** 🟡

---

## 🎯 Recommandations Prioritaires

### 🔴 Priorité CRITIQUE (À faire immédiatement)

1. **Appliquer la Protection CSRF**
   - Protéger toutes les routes de mutation
   - Ajouter hook côté client pour tokens
   - Tester sur toutes les routes

2. **Remplacer alert()/confirm()**
   - Créer composant toast accessible
   - Utiliser pour tous les messages
   - 19 occurrences à remplacer

### 🟡 Priorité MOYENNE (À faire bientôt)

3. **Lazy Loading Composants Lourds**
   - `react-d3-tree` dans généalogie
   - `react-chartjs-2` dans charts

4. **Améliorer Accessibilité**
   - Navigation clavier complète
   - Validation formulaires accessible
   - Améliorer alt text

5. **Optimiser Images**
   - Vérifier dimensions sur toutes les images
   - Éviter CLS

6. **Rate Limiting Redis**
   - Pour production multi-instances
   - Configuration Redis

### 🟢 Priorité FAIBLE (Améliorations)

7. **Analyse Bundle Size**
   - Installer bundle analyzer
   - Identifier optimisations

8. **React.memo sur Composants Liste**
   - Optimiser re-renders

9. **Vérifier Contraste Couleurs**
   - Audit avec axe-core

---

## 📊 Score Global

```
Sécurité      : ████████████████████░░░░░░░░░░ 75/100 🟡
Accessibilité : █████████████████░░░░░░░░░░░░░ 65/100 🟡
Performances  : ███████████████████░░░░░░░░░░░ 70/100 🟡
─────────────────────────────────────────────────────
SCORE MOYEN   : ███████████████████░░░░░░░░░░░ 70/100 🟡
```

---

## 📝 Plan d'Action

### Semaine 1 : Sécurité Critique
- [ ] Implémenter protection CSRF sur toutes les routes
- [ ] Créer hook CSRF côté client
- [ ] Tests de protection CSRF

### Semaine 2 : Accessibilité
- [ ] Remplacer tous les alert()/confirm()
- [ ] Améliorer navigation clavier
- [ ] Audit contraste avec axe-core

### Semaine 3 : Performances
- [ ] Lazy loading composants lourds
- [ ] Analyse bundle size
- [ ] Optimiser dimensions images

### Semaine 4 : Production
- [ ] Configurer Redis pour rate limiting
- [ ] Tests de charge
- [ ] Documentation sécurité

---

**Date de l'audit** : Aujourd'hui  
**Prochaine révision recommandée** : Dans 3 mois

---

## 📦 Fichiers Créés pour les Corrections

### Protection CSRF

1. ✅ **`src/lib/api/csrf-wrapper.ts`** - Wrapper pour protéger les routes API
2. ✅ **`src/hooks/use-csrf.ts`** - Hook pour gérer les tokens CSRF côté client
3. ✅ **`src/app/api/csrf/token/route.ts`** - Route pour obtenir un token CSRF

### Accessibilité

4. ✅ **`src/components/Toast.tsx`** - Composant toast accessible pour remplacer `alert()/confirm()`

### Prochaines Étapes

**À appliquer maintenant** :
1. Utiliser `withCsrfProtection` sur toutes les routes POST/PUT/DELETE
2. Remplacer tous les `alert()`/`confirm()` par le composant Toast
3. Tester la protection CSRF

**Exemple d'utilisation CSRF** :
```typescript
// Dans une route API
import { withCsrfProtection } from '@/lib/api/csrf-wrapper';

export const POST = withCsrfProtection(async (request: Request) => {
  // ... logique de la route
});
```

**Exemple d'utilisation Toast** :
```typescript
// Dans un composant client
import { useToast } from '@/components/Toast';

const { showToast } = useToast();

// Remplacer alert('Message') par :
showToast('Message de succès', 'success');
```

