/**
 * Utilitaires pour le cache et la revalidation Next.js 15
 */

import { cache } from 'react';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Mémorise une fonction avec cache React
 * Utile pour éviter les lectures multiples du même fichier dans un même rendu
 */
export function cached<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return cache(fn) as T;
}

/**
 * Revalide un chemin spécifique
 */
export function revalidate(path: string, type?: 'layout' | 'page' | 'layout' | 'page') {
  revalidatePath(path, type);
}

/**
 * Revalide tous les chemins liés à une ressource
 */
export function revalidateResource(resource: 'users' | 'objects' | 'messages' | 'genealogie') {
  const paths = {
    users: ['/users', '/users/[login]'],
    objects: ['/objects', '/objects/[objectId]'],
    messages: ['/messages', '/accueil'],
    genealogie: ['/genealogie'],
  };

  const resourcePaths = paths[resource] || [];
  resourcePaths.forEach((path) => {
    revalidatePath(path, 'page');
  });
}

/**
 * Revalide par tag (pour cache distribué)
 */
export function revalidateByTag(tag: string) {
  revalidateTag(tag);
}

/**
 * Tags de cache par ressource
 */
export const CacheTags = {
  users: 'users',
  user: (login: string) => `user:${login}`,
  objects: 'objects',
  object: (id: string) => `object:${id}`,
  messages: 'messages',
  message: (id: string) => `message:${id}`,
  genealogie: 'genealogie',
} as const;

