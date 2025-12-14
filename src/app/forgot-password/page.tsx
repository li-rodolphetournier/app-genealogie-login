'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/animations';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [emailOrLogin, setEmailOrLogin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Déterminer si c'est un email ou un login
      const isEmail = emailOrLogin.includes('@');
      const body = isEmail 
        ? { email: emailOrLogin }
        : { login: emailOrLogin };

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Erreur lors de la demande de réinitialisation');
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
        <main role="main" className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Email envoyé
              </h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Si cet email/login existe, un lien de réinitialisation a été envoyé.
                Vérifiez votre boîte de réception.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        </main>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <main role="main" className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Mot de passe oublié
          </h1>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="emailOrLogin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email ou Login
              </label>
              <input
                type="text"
                id="emailOrLogin"
                value={emailOrLogin}
                onChange={(e) => setEmailOrLogin(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="votre@email.com ou votre_login"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {isLoading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}

