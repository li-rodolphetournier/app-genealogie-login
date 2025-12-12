'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import { logAuth } from '@/lib/utils/auth-logger';
import { motion } from 'framer-motion';
import { AnimatedContainer } from '@/components/animations';

export default function Login() {
  const router = useRouter();
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLogo, setHasLogo] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // Timeout pour éviter que la vérification reste bloquée
    const timeoutId = setTimeout(() => {
      setCheckingAuth(false);
    }, 5000); // 5 secondes maximum
    
    // Vérifier si l'utilisateur est déjà connecté
    const checkAuth = async () => {
      logAuth.login('Vérification si utilisateur déjà connecté');
      try {
        // Créer une promesse avec timeout
        const authPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 4000)
        );
        
        const { data: { user } } = await Promise.race([authPromise, timeoutPromise]);
        
        if (user) {
          logAuth.login('Utilisateur déjà connecté, redirection vers accueil', { email: user.email });
          // Utilisateur déjà connecté, rediriger vers l'accueil
          clearTimeout(timeoutId);
          setCheckingAuth(false); // Libérer l'écran de chargement avant la redirection
          logAuth.redirect('/', '/accueil', 'Utilisateur déjà connecté');
          // Utiliser window.location pour forcer une navigation complète et éviter les blocages
          window.location.href = '/accueil';
          return;
        } else {
          logAuth.login('Aucun utilisateur connecté');
        }
      } catch (error) {
        logAuth.warn('LOGIN', 'Erreur lors de la vérification auth', { 
          error: error instanceof Error ? error.message : 'Erreur inconnue' 
        });
        // Ignorer les erreurs silencieusement (timeout ou erreur réseau)
        // L'utilisateur pourra quand même se connecter
        logger.debug('Vérification auth:', error instanceof Error ? error.message : 'Erreur inconnue');
      } finally {
        clearTimeout(timeoutId);
        setCheckingAuth(false);
      }
    };
    
    void checkAuth();
    
    // Vérifier si l'image existe
    const checkLogo = async () => {
      try {
        const response = await fetch('/uploads/login/armoirie.png', { method: 'HEAD' });
        setHasLogo(response.ok);
      } catch {
        setHasLogo(false);
      }
    };
    void checkLogo();
    
    return () => {
      clearTimeout(timeoutId);
    };
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
    e.preventDefault();
    
    // Validation
    if (!formData.login.trim() || !formData.password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Vérifier si le login ressemble à un email
      const loginValue = formData.login.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginValue);
      
      let authResult;
      
      if (isEmail) {
        // Tentative 1 : Le login est un email, essayer directement
        authResult = await supabase.auth.signInWithPassword({
          email: loginValue,
          password: formData.password,
        });
      } else {
        // Tentative 1 : Le login n'est pas un email, chercher l'email via l'API
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
            setError('Identifiant introuvable');
            setIsLoading(false);
            return;
          }
        } else {
          setError('Erreur lors de la récupération de l\'email');
          setIsLoading(false);
          return;
        }
      }

      // Tentative 2 : Si la première tentative a échoué et que c'était un email, essayer avec l'API
      if (authResult.error && isEmail) {
        const response = await fetch('/api/auth/get-email-by-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ login: loginValue }),
        });

        if (response.ok) {
          const { email } = await response.json();
          if (email && email !== loginValue) {
            // L'email trouvé est différent, réessayer
            authResult = await supabase.auth.signInWithPassword({
              email,
              password: formData.password,
            });
          }
        }
      }

      if (authResult.error) {
        // Ne pas afficher les détails techniques de l'erreur
        const errorMessage = authResult.error.message || '';
        if (errorMessage.includes('Invalid login credentials') || 
            errorMessage.includes('Email not confirmed') ||
            errorMessage.includes('invalid_grant')) {
          setError('Identifiants incorrects');
        } else if (errorMessage.includes('Email rate limit exceeded')) {
          setError('Trop de tentatives. Veuillez réessayer plus tard.');
        } else {
          setError('Erreur de connexion. Veuillez vérifier vos identifiants.');
        }
        setIsLoading(false);
        return;
      }

      if (authResult.data?.user) {
        // Connexion réussie
        logAuth.login('Connexion réussie', { 
          email: authResult.data.user.email,
          hasSession: !!authResult.data.session?.access_token 
        });
        logger.debug('[LOGIN] Connexion réussie, utilisateur:', authResult.data.user.email);
        logger.debug('[LOGIN] Session:', authResult.data.session?.access_token ? 'présente' : 'absente');
        
        // Si on a une session directement dans authResult, l'utiliser sans vérifier avec getUser()
        // Cela évite les problèmes de timeout en production
        const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('vercel');
        
        if (authResult.data.session?.access_token) {
          // On a une session valide directement, rediriger immédiatement
          logAuth.login('Session disponible directement depuis authResult, redirection vers /accueil', { 
            email: authResult.data.user.email 
          });
          logger.debug('[LOGIN] Session disponible directement, redirection vers /accueil');
          
          // Libérer l'état de chargement avant la redirection
          setIsLoading(false);
          
          // Délai pour la propagation des cookies (augmenté en production)
          const redirectDelay = isProduction ? 1500 : 800;
          await new Promise(resolve => setTimeout(resolve, redirectDelay));
          
          logAuth.redirect('/', '/accueil', 'Connexion réussie avec session directe');
          // Utiliser window.location pour forcer une navigation complète et éviter les blocages
          window.location.href = '/accueil';
        } else {
          // Pas de session dans authResult, essayer de vérifier avec getUser()
          // En production (Vercel), augmenter le nombre de tentatives et le délai
          const maxAttempts = isProduction ? 15 : 10;
          const attemptDelay = isProduction ? 400 : 300;
          
          let verifyUser = null;
          for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, attemptDelay));
            try {
              const { data: { user }, error } = await supabase.auth.getUser();
              if (user && !error) {
                verifyUser = user;
                logAuth.session(`Session vérifiée avec succès (tentative ${i + 1})`, { email: user.email });
                logger.debug(`[LOGIN] Session vérifiée avec succès (tentative ${i + 1})`);
                break;
              }
            } catch (err) {
              logAuth.warn('LOGIN', `Erreur lors de la vérification (tentative ${i + 1})`, { error: err });
              logger.debug(`[LOGIN] Erreur lors de la vérification (tentative ${i + 1}):`, err);
            }
          }
          
          if (verifyUser) {
            logAuth.login('Vérification session OK, redirection vers /accueil', { email: verifyUser.email });
            logger.debug('[LOGIN] Vérification session OK, redirection vers /accueil');
            // Libérer l'état de chargement avant la redirection
            setIsLoading(false);
            // Délai supplémentaire pour la propagation des cookies (augmenté en production)
            const redirectDelay = isProduction ? 1500 : 800;
            await new Promise(resolve => setTimeout(resolve, redirectDelay));
            logAuth.redirect('/', '/accueil', 'Connexion réussie après vérification');
            // Utiliser window.location pour forcer une navigation complète et éviter les blocages
            window.location.href = '/accueil';
          } else {
            logAuth.error('LOGIN', 'Session perdue après connexion !', { 
              userId: authResult.data.user.id,
              attempts: maxAttempts
            });
            logger.error('[LOGIN] Session perdue après connexion !');
            setError('Erreur de session. Veuillez réessayer.');
            setIsLoading(false);
          }
        }
      } else {
        logAuth.error('LOGIN', 'Pas de user dans authResult.data');
        logger.error('[LOGIN] Pas de user dans authResult.data');
        setError('Erreur de connexion. Veuillez réessayer.');
        setIsLoading(false);
      }
    } catch (error) {
      logAuth.error('LOGIN', 'Erreur de connexion', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      });
      logger.error('Erreur de connexion:', error);
      setError('Erreur de connexion au serveur. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  if (!mounted || checkingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8"
    >
      <AnimatedContainer variant="fadeIn" delay={0.1}>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {hasLogo && (
            <motion.div
              className="flex justify-center mb-8"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <div className="relative w-32 h-32 flex items-center justify-center">
                <Image
                  src="/uploads/login/armoirie.png"
                  alt="Armoiries"
                  width={128}
                  height={128}
                  className="object-contain"
                  style={{ maxWidth: '100%', width: 'auto', height: 'auto' }}
                  priority
                  loading="eager"
                  onError={() => setHasLogo(false)}
                />
              </div>
            </motion.div>
          )}

          {/* Titre */}
          <motion.h1
            className="text-center text-3xl font-bold tracking-tight text-gray-900 mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            Bienvenue
          </motion.h1>
          <motion.p
            className="text-center text-sm text-gray-600 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            Connectez-vous pour accéder à votre compte
          </motion.p>
        </div>
      </AnimatedContainer>

      <AnimatedContainer variant="scale" delay={0.5}>
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <motion.div
            className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            {/* Message d'erreur */}
            {error && (
              <motion.div
                role="alert"
                className="bg-red-50 border-l-4 border-red-500 p-4 mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Formulaire */}
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-6"
              noValidate
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
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

              <motion.div>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                  aria-busy={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <motion.svg
                        className="h-5 w-5 text-white -ml-1 mr-3"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
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
                      </motion.svg>
                      <span>Connexion en cours...</span>
                    </div>
                  ) : (
                    'Se connecter'
                  )}
                </motion.button>
              </motion.div>
            </motion.form>
          </motion.div>
        </div>
      </AnimatedContainer>

      {/* Footer */}
      <AnimatedContainer variant="fadeIn" delay={0.8}>
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            En cas de problème de connexion, contactez l&apos;administrateur
          </p>
        </div>
      </AnimatedContainer>
    </motion.div>
  );
}
