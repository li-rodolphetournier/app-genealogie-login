'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PageTransition } from '@/components/animations';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  // Récupérer le token depuis l'URL
  // Supabase peut envoyer code, token_hash, token, ou access_token dans les query params
  // Il peut aussi être dans le hash de l'URL (#) que Next.js ne peut pas lire côté client
  // PRIORITÉ: code (format le plus courant pour resetPasswordForEmail)
  const token = searchParams?.get('code') || searchParams?.get('token_hash') || searchParams?.get('token') || searchParams?.get('access_token') || null;
  
  // Si pas de token dans les query params, essayer de le récupérer depuis le hash
  // Note: window.location.hash n'est disponible que côté client
  const [hashToken, setHashToken] = useState<string | null>(null);
  
  useEffect(() => {
    const initializeToken = async () => {
      if (typeof window !== 'undefined') {
        const supabase = createClient();
        
        // Extraire le token depuis le hash de l'URL
        const hash = window.location.hash;
        let extractedHashToken = null;
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1)); // Enlever le #
          // PRIORITÉ: code (format le plus courant)
          extractedHashToken = hashParams.get('code') || hashParams.get('access_token') || hashParams.get('token_hash') || hashParams.get('token');
          if (extractedHashToken) {
            setHashToken(extractedHashToken);
            setHasToken(true);
          }
        }
        
        // Utiliser le token depuis les query params ou le hash
        const currentToken = token || extractedHashToken;
        
        // Si on a un code, l'échanger immédiatement contre une session
        // C'est nécessaire pour que Supabase crée la session avant le submit
        if (currentToken) {
          try {
            const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(currentToken);
            if (exchangeError) {
              console.error('Erreur échange code au chargement:', exchangeError);
            } else if (sessionData?.session) {
              console.log('Code échangé avec succès au chargement');
              setHasToken(true);
            }
          } catch (err) {
            console.error('Exception lors de l\'échange du code:', err);
          }
        }
        
        // Vérifier si on a une session active
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasToken(true);
        }
      }
    };
    
    initializeToken();
    
    if (token) {
      setHasToken(true);
    }
  }, [token]);
  
  const finalToken = token || hashToken;

  useEffect(() => {
    if (!hasToken && !finalToken) {
      setError('Lien de réinitialisation invalide ou expiré');
    }
  }, [hasToken, finalToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!hasToken && !finalToken) {
      setError('Token manquant');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      
      // Si on a un code, l'échanger contre une session côté client
      // C'est la méthode recommandée par Supabase
      if (finalToken) {
        // Essayer d'abord d'échanger le code contre une session
        const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(finalToken);
        
        if (exchangeError) {
          console.error('Erreur échange code:', exchangeError);
          // Si l'échange échoue, essayer quand même avec le token directement
        } else if (sessionData?.session) {
          // Le code a été échangé avec succès, on a maintenant une session
          console.log('Code échangé avec succès, session créée');
        }
      }
      
      // Vérifier si on a une session (soit créée par l'échange, soit déjà existante)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (session) {
        // Utiliser la session pour changer le mot de passe
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password, useSession: true }),
        });
        
        const data = await response.json();

        if (response.ok) {
          setSuccess(true);
          setTimeout(() => {
            router.push('/');
          }, 3000);
        } else {
          setError(data.error || 'Erreur lors de la réinitialisation');
        }
      } else if (finalToken) {
        // Si pas de session mais on a un token, essayer avec le token
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: finalToken, password }),
        });
        
        const data = await response.json();

        if (response.ok) {
          setSuccess(true);
          setTimeout(() => {
            router.push('/');
          }, 3000);
        } else {
          setError(data.error || 'Erreur lors de la réinitialisation');
        }
      } else {
        setError('Token manquant ou session invalide');
      }

    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Mot de passe réinitialisé
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Votre mot de passe a été réinitialisé avec succès.
                Vous allez être redirigé vers la page de connexion...
              </p>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!hasToken && !finalToken) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Lien invalide
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Le lien de réinitialisation est invalide ou a expiré.
              </p>
              <Link
                href="/forgot-password"
                className="mt-6 inline-block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Demander un nouveau lien
              </Link>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Réinitialiser le mot de passe
          </h1>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <PageTransition>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
            </div>
          </div>
        </div>
      </PageTransition>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

