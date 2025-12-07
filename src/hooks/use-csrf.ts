/**
 * Hook pour gérer les tokens CSRF côté client
 */

'use client';

import { useEffect, useState } from 'react';

let csrfTokenCache: string | null = null;

/**
 * Récupère un token CSRF depuis le serveur
 */
async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/csrf/token', {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      return data.token || null;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du token CSRF:', error);
    return null;
  }
}

/**
 * Hook pour obtenir et utiliser le token CSRF
 */
export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(csrfTokenCache);
  const [isLoading, setIsLoading] = useState(!csrfTokenCache);

  useEffect(() => {
    if (csrfTokenCache) {
      setToken(csrfTokenCache);
      setIsLoading(false);
      return;
    }

    fetchCsrfToken().then((fetchedToken) => {
      csrfTokenCache = fetchedToken;
      setToken(fetchedToken);
      setIsLoading(false);
    });
  }, []);

  return { token, isLoading };
}

/**
 * Ajoute le header CSRF à une requête fetch
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = csrfTokenCache;

  if (!token) {
    token = await fetchCsrfToken();
    csrfTokenCache = token;
  }

  const headers = new Headers(options.headers);

  if (token) {
    headers.set('x-csrf-token', token);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}

