'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

const LoginPage = () => {
  const router = useRouter();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        router.push('/accueil');
      }
    };
    checkAuth();
  }, [router, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Empêcher le rechargement de la page
    
    // Validation
    if (!formData.login.trim() || !formData.password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const loginValue = formData.login.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginValue);
      
      let authResult;
      
      if (isEmail) {
        // Le login est un email, essayer directement
        authResult = await supabase.auth.signInWithPassword({
          email: loginValue,
          password: formData.password,
        });
      } else {
        // Le login n'est pas un email, chercher l'email via l'API
        const response = await fetch('/api/auth/get-email-by-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ login: loginValue }),
        });

        if (response.ok) {
          const { email } = await response.json();
          if (email) {
            authResult = await supabase.auth.signInWithPassword({
              email,
              password: formData.password,
            });
          } else {
            setError('Identifiants incorrects');
            setIsLoading(false);
            return;
          }
        } else {
          setError('Identifiants incorrects');
          setIsLoading(false);
          return;
        }
      }

      if (authResult.error || !authResult.data?.user) {
        setError('Identifiants incorrects');
        setIsLoading(false);
        return;
      }

      // Connexion réussie
      logger.debug('[LOGIN] Connexion réussie, utilisateur:', authResult.data.user.email);
      
      // Attendre un peu pour la propagation de la session
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Rediriger vers l'accueil
      router.push('/accueil');
    } catch (err) {
      logger.error('[LOGIN] Erreur de connexion:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-3xl font-bold mb-6 text-gray-900 dark:text-white"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Connexion
      </motion.h1>

      <motion.div
        className="w-full max-w-md mb-4"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <motion.div
          className="rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-red-700 via-red-600 to-red-500 p-3"
          initial={{ y: 0, scale: 1 }}
          animate={{ y: [0, -8, 0], scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', repeatType: 'mirror' }}
        >
          <div className="bg-white rounded-lg overflow-hidden">
            <Image
              src="/uploads/login/armoirie.png"
              alt="Armoirie"
              width={500}
              height={300}
              className="w-full h-auto"
            />
          </div>
        </motion.div>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        className="mt-2 w-full max-w-md bg-gray-50 dark:bg-gray-800 shadow-lg rounded-lg px-6 py-6 border border-gray-200 dark:border-gray-700"
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="login" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            Nom d'utilisateur ou Email
          </label>
          <input
            type="text"
            id="login"
            name="login"
            value={formData.login}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-1 block w-full border-2 border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-800 focus:ring-blue-800 disabled:opacity-50"
            required
          />
        </div>
        <div className="mt-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            Mot de passe
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-1 block w-full border-2 border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-800 focus:ring-blue-800 disabled:opacity-50"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2.5 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </button>
        
        <div className="mt-4 text-center">
          <a
            href="/forgot-password"
            className="text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
          >
            Mot de passe oublié ?
          </a>
        </div>
      </motion.form>
    </motion.div>
  );
};

export default LoginPage;