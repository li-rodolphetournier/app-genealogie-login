# 🔐 Actions de Sécurité à Implémenter

**Date**: 2025-12-07  
**Priorité**: À faire avant le déploiement en production

---

## 🔴 Critique (Faire immédiatement)

### 1. Migrer Rate Limiting vers Redis/Upstash

**Fichier**: `src/lib/security/rate-limit.ts`

**Action**:
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Configuration**:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
});
```

---

### 2. Valider les Fichiers avec Magic Bytes

**Fichier**: `src/app/api/upload/route.ts`

**Action**:
```bash
npm install file-type
```

**Implémentation**:
```typescript
import { fileTypeFromBuffer } from 'file-type';

const buffer = await file.arrayBuffer();
const type = await fileTypeFromBuffer(Buffer.from(buffer));

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!type || !allowedMimeTypes.includes(type.mime)) {
  return NextResponse.json({ error: 'Type de fichier invalide' }, { status: 400 });
}
```

---

### 3. Corriger CORS

**Fichier**: `src/lib/security/headers.ts`

**Statut**: ✅ Déjà corrigé

---

## 🟠 Important (Faire avant production)

### 4. Améliorer CSP (Réduire unsafe-inline)

**Fichier**: `src/lib/security/headers.ts`

**Action**: Implémenter les nonces pour les scripts/styles inline.

---

### 5. Améliorer Validation des Mots de Passe

**Fichier**: `src/lib/validations/user.schema.ts`

**Action**: Ajouter les règles de complexité.

---

### 6. Ajouter Sanitization HTML

**Fichier**: Nouveau fichier `src/lib/utils/sanitize.ts`

**Action**:
```bash
npm install isomorphic-dompurify
```

---

## 📋 Checklist de Vérification

### Avant chaque déploiement

- [ ] `npm audit` passe sans vulnérabilités
- [ ] Tous les tests passent
- [ ] Variables d'environnement configurées
- [ ] Rate limiting fonctionnel
- [ ] Headers de sécurité activés
- [ ] RLS Supabase vérifié
- [ ] Backups configurés

---

**Dernière mise à jour**: 2025-12-07
