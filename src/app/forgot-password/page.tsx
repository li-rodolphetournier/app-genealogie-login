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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                Email envoyé
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Si cet email/login existe, un lien de réinitialisation a été envoyé.
                Vérifiez votre boîte de réception.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block text-blue-600 hover:text-blue-800"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Mot de passe oublié
          </h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="emailOrLogin" className="block text-sm font-medium text-gray-700">
                Email ou Login
              </label>
              <input
                type="text"
                id="emailOrLogin"
                value={emailOrLogin}
                onChange={(e) => setEmailOrLogin(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="votre@email.com ou votre_login"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {isLoading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

