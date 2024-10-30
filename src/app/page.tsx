'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Login() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLogo, setHasLogo] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Vérifier si l'image existe
    const checkLogo = async () => {
      try {
        const response = await fetch('/uploads/login/armoirie.png', { method: 'HEAD' });
        setHasLogo(response.ok);
      } catch {
        setHasLogo(false);
      }
    };
    checkLogo();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        router.push('/accueil');
      } else {
        setError(data.message || 'Identifiants incorrects');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Erreur de connexion au serveur. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo - uniquement si l'image existe */}
        {hasLogo && (
          <div className="flex justify-center mb-8">
            <div className="relative w-32 h-32">
              <Image
                src="/uploads/login/armoirie.png"
                alt="Armoiries"
                width={128}
                height={128}
                className="object-contain"
                priority
                onError={() => setHasLogo(false)}
              />
            </div>
          </div>
        )}

        {/* Titre */}
        <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900 mb-2">
          Bienvenue
        </h1>
        <p className="text-center text-sm text-gray-600 mb-8">
          Connectez-vous pour accéder à votre compte
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
          {/* Message d'erreur */}
          {error && (
            <div 
              role="alert"
              className="bg-red-50 border-l-4 border-red-500 p-4 mb-6"
            >
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Formulaire */}
          <form 
            onSubmit={handleSubmit} 
            className="space-y-6"
            noValidate
          >
            <div>
              <label 
                htmlFor="login"
                className="block text-sm font-medium text-gray-700"
              >
                Identifiant
              </label>
              <div className="mt-1 relative">
                <input
                  id="login"
                  name="login"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.login}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                  aria-required="true"
                  aria-invalid={error ? "true" : "false"}
                  aria-describedby={error ? "login-error" : undefined}
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Mot de passe
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                  aria-required="true"
                  aria-invalid={error ? "true" : "false"}
                  aria-describedby={error ? "password-error" : undefined}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg 
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Connexion en cours...</span>
                  </div>
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            En cas de problème de connexion, contactez l&apos;administrateur
          </p>
        </div>
      </div>
    </div>
  );
}
