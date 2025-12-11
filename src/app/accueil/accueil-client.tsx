'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import type { Message } from '@/types/message';
import { motion } from 'framer-motion';
import { AnimatedContainer, FadeInStagger, FadeInStaggerItem } from '@/components/animations';

type AccueilClientProps = {
  initialLastMessage: Message | null;
};

export function AccueilClient({ initialLastMessage }: AccueilClientProps) {
  const { user, isLoading, logout } = useAuth({
    redirectIfUnauthenticated: true,
    redirectTo: '/',
  });
  const [lastMessage] = useState<Message | null>(initialLastMessage);
  
  // États pour la visibilité des cartes de généalogie (depuis Supabase)
  const [cardVisibility, setCardVisibility] = useState<Record<string, boolean>>({
    'genealogie': true,
    'genealogie-visx': true,
    'genealogie-nivo': true,
    'genealogie-treecharts': true,
  });
  const [loadingVisibility, setLoadingVisibility] = useState(true);
  
  // Charger la visibilité depuis Supabase au montage
  useEffect(() => {
    const loadVisibility = async () => {
      try {
        const response = await fetch('/api/genealogie/card-visibility');
        if (response.ok) {
          const visibility = await response.json();
          setCardVisibility(visibility);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la visibilité:', error);
      } finally {
        setLoadingVisibility(false);
      }
    };
    loadVisibility();
  }, []);
  
  // Fonction pour mettre à jour la visibilité d'une carte (admin seulement)
  const toggleCardVisibility = async (cardKey: string) => {
    if (user?.status !== 'administrateur') return;
    
    const newVisibility = !cardVisibility[cardKey];
    
    // Mise à jour optimiste
    setCardVisibility(prev => ({ ...prev, [cardKey]: newVisibility }));
    
    try {
      const response = await fetch('/api/genealogie/card-visibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardKey, isVisible: newVisibility }),
      });
      
      if (!response.ok) {
        // Revenir à l'état précédent en cas d'erreur
        setCardVisibility(prev => ({ ...prev, [cardKey]: !newVisibility }));
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        console.error('Erreur lors de la mise à jour de la visibilité:', {
          error: errorData.error,
          details: errorData.details,
          status: response.status,
        });
        // Erreur lors de la récupération de la visibilité de la carte
      }
    } catch (error) {
      // Revenir à l'état précédent en cas d'erreur
      setCardVisibility(prev => ({ ...prev, [cardKey]: !newVisibility }));
      console.error('Erreur lors de la mise à jour de la visibilité:', error);
    }
  };
  
  // Vérifier si l'utilisateur peut voir une carte
  const canSeeCard = (cardKey: string) => {
    // Les admins voient toujours toutes les cartes
    if (user?.status === 'administrateur') return true;
    // Pour les autres, vérifier la visibilité
    return cardVisibility[cardKey] !== false;
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        role="status"
      >
        <motion.div
          className="text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          <motion.p
            className="mt-4 text-gray-600"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Chargement...
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  if (!user) {
    return null; // Redirection gérée par useAuth
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50"
    >
      <AnimatedContainer variant="slideDown" delay={0.1}>
        <header className="bg-white shadow-sm" role="banner">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <motion.h1
              className="text-2xl font-bold text-gray-900"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              Tableau de bord
            </motion.h1>
            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <span className="text-gray-600">
                Connecté en tant que <span className="font-medium">{user.login ? user.login.charAt(0).toUpperCase() + user.login.slice(1) : user.email || 'Utilisateur'}</span>
              </span>
              <motion.button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                aria-label="Se déconnecter"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Se déconnecter
              </motion.button>
            </motion.div>
          </div>
        </header>
      </AnimatedContainer>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="navigation" aria-label="Menu principal">
        <FadeInStagger staggerDelay={0.1} delay={0.4}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {/* Liste des objets */}
          <FadeInStaggerItem>
            <motion.div
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              style={{ display: 'block', height: '100%' }}
            >
              <Link
                href="/objects"
                className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow-sm hover:shadow-md transition-shadow block h-full"
                aria-label="Accéder à la liste des objets"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-gray-900">Liste des objets</h2>
                    <p className="mt-1 text-sm text-gray-500">Voir tous les objets disponibles</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          </FadeInStaggerItem>

          {/* Créer un objet - accessible aux rédacteurs et administrateurs */}
          {user.status !== 'utilisateur' && (
            <FadeInStaggerItem>
              <motion.div
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                style={{ display: 'block', height: '100%' }}
              >
                <Link
                  href="/objects/create"
                  className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow-sm hover:shadow-md transition-shadow block h-full"
                  aria-label="Créer un nouvel objet"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-medium text-gray-900">Créer un objet</h2>
                      <p className="mt-1 text-sm text-gray-500">Ajouter un nouvel objet</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </FadeInStaggerItem>
          )}

          {/* Administration - accessible aux administrateurs */}
          {user.status === 'administrateur' && (
            <>
              <FadeInStaggerItem>
                <motion.div
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  style={{ display: 'block', height: '100%' }}
                >
                  <Link
                    href="/users"
                    className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-500 rounded-lg shadow-sm hover:shadow-md transition-shadow block h-full"
                    aria-label="Accéder à la gestion des utilisateurs"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-medium text-gray-900">Gestion des utilisateurs</h2>
                        <p className="mt-1 text-sm text-gray-500">Administrer les comptes utilisateurs</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </FadeInStaggerItem>

              <FadeInStaggerItem>
                <motion.div
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  style={{ display: 'block', height: '100%' }}
                >
                  <Link
                    href="/admin/categories"
                    className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-teal-500 rounded-lg shadow-sm hover:shadow-md transition-shadow block h-full"
                    aria-label="Accéder à la gestion des catégories"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-teal-500 flex items-center justify-center">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-medium text-gray-900">Gestion des catégories</h2>
                        <p className="mt-1 text-sm text-gray-500">Créer, modifier et supprimer les catégories</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </FadeInStaggerItem>

              <FadeInStaggerItem>
                <motion.div
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  style={{ display: 'block', height: '100%' }}
                >
                  <Link
                    href="/chart"
                    className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-yellow-500 rounded-lg shadow-sm hover:shadow-md transition-shadow block h-full"
                    aria-label="Accéder aux statistiques"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-yellow-500 flex items-center justify-center">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-medium text-gray-900">Statistiques</h2>
                        <p className="mt-1 text-sm text-gray-500">Voir les statistiques des objets</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </FadeInStaggerItem>
            </>
          )}

          {/* Généalogie - accessible selon visibilité */}
          {canSeeCard('genealogie') && (
            <FadeInStaggerItem>
              <motion.div
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                style={{ display: 'block', height: '100%' }}
                className="relative"
              >
                {user?.status === 'administrateur' && (
                  <div className="absolute top-2 right-2 z-10">
                    <label className="flex items-center gap-2 bg-white px-2 py-1 rounded shadow-sm border border-gray-300">
                      <input
                        type="checkbox"
                        checked={cardVisibility['genealogie']}
                        onChange={() => toggleCardVisibility('genealogie')}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-600">Afficher</span>
                    </label>
                  </div>
                )}
                <Link
                  href="/genealogie"
                  className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-lg shadow-sm hover:shadow-md transition-shadow block h-full"
                  aria-label="Accéder à l'arbre généalogique"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-medium text-gray-900">Généalogie</h2>
                      <p className="mt-1 text-sm text-gray-500">Visualiser l&apos;arbre généalogique</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </FadeInStaggerItem>
          )}

          {/* Alternatives de visualisation généalogique */}
          {/* Généalogie Visx - accessible selon visibilité */}
          {canSeeCard('genealogie-visx') && (
            <FadeInStaggerItem>
              <motion.div
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                style={{ display: 'block', height: '100%' }}
                className="relative"
              >
                {user?.status === 'administrateur' && (
                  <div className="absolute top-2 right-2 z-10">
                    <label className="flex items-center gap-2 bg-white px-2 py-1 rounded shadow-sm border border-gray-300">
                      <input
                        type="checkbox"
                        checked={cardVisibility['genealogie-visx']}
                        onChange={() => toggleCardVisibility('genealogie-visx')}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-600">Afficher</span>
                    </label>
                  </div>
                )}
                <Link
                  href="/genealogie-alternatives/visx"
                  className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-emerald-500 rounded-lg shadow-sm hover:shadow-md transition-shadow block h-full border-2 border-emerald-200"
                  aria-label="Accéder à l'arbre généalogique avec Visx"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-medium text-gray-900">Généalogie Visx</h2>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                          Alternative 1
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Arbre avec Visx - Bundle léger</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </FadeInStaggerItem>
          )}

          {/* Généalogie Nivo - accessible selon visibilité */}
          {canSeeCard('genealogie-nivo') && (
            <FadeInStaggerItem>
              <motion.div
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                style={{ display: 'block', height: '100%' }}
                className="relative"
              >
                {user?.status === 'administrateur' && (
                  <div className="absolute top-2 right-2 z-10">
                    <label className="flex items-center gap-2 bg-white px-2 py-1 rounded shadow-sm border border-gray-300">
                      <input
                        type="checkbox"
                        checked={cardVisibility['genealogie-nivo']}
                        onChange={() => toggleCardVisibility('genealogie-nivo')}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-600">Afficher</span>
                    </label>
                  </div>
                )}
                <Link
                  href="/genealogie-alternatives/nivo"
                  className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-cyan-500 rounded-lg shadow-sm hover:shadow-md transition-shadow block h-full border-2 border-cyan-200 opacity-75"
                  aria-label="Accéder à l'arbre généalogique avec Nivo"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-cyan-500 flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-medium text-gray-900">Généalogie Nivo</h2>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-800">
                          Alternative 2
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          À venir
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Arbre avec Nivo - Composants prêts à l&apos;emploi</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </FadeInStaggerItem>
          )}

          {/* Généalogie TreeCharts - accessible selon visibilité */}
          {canSeeCard('genealogie-treecharts') && (
            <FadeInStaggerItem>
              <motion.div
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                style={{ display: 'block', height: '100%' }}
                className="relative"
              >
                {user?.status === 'administrateur' && (
                  <div className="absolute top-2 right-2 z-10">
                    <label className="flex items-center gap-2 bg-white px-2 py-1 rounded shadow-sm border border-gray-300">
                      <input
                        type="checkbox"
                        checked={cardVisibility['genealogie-treecharts']}
                        onChange={() => toggleCardVisibility('genealogie-treecharts')}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-600">Afficher</span>
                    </label>
                  </div>
                )}
                <Link
                  href="/genealogie-alternatives/treecharts"
                  className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-amber-500 rounded-lg shadow-sm hover:shadow-md transition-shadow block h-full border-2 border-amber-200 opacity-75"
                  aria-label="Accéder à l'arbre généalogique avec TreeCharts"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-medium text-gray-900">Généalogie TreeCharts</h2>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          Alternative 3
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          À venir
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Arbre avec TreeCharts - Spécialisé généalogie</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </FadeInStaggerItem>
          )}

          {/* Historique des positions - accessible uniquement aux administrateurs */}
          {user.status === 'administrateur' && (
            <FadeInStaggerItem>
              <motion.div
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                style={{ display: 'block', height: '100%' }}
              >
                <Link
                  href="/genealogie/historique"
                  className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-violet-500 rounded-lg shadow-sm hover:shadow-md transition-shadow block h-full border-2 border-violet-200"
                  aria-label="Consulter l'historique des positions"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-violet-500 flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-medium text-gray-900">Historique des modifications</h2>
                      <p className="mt-1 text-sm text-gray-500">Consulter l'historique de création et modifications des positions</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </FadeInStaggerItem>
          )}

          {/* Modifier mon profil - accessible à tous */}
          <FadeInStaggerItem>
            <motion.div
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              style={{ display: 'block', height: '100%' }}
            >
              <Link
                href="/admin"
                className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-pink-500 rounded-lg shadow-sm hover:shadow-md transition-shadow block h-full"
                aria-label="Modifier mon profil"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-pink-500 flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-gray-900">Mon profil</h2>
                    <p className="mt-1 text-sm text-gray-500">Modifier mes informations personnelles</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          </FadeInStaggerItem>

          {/* Administration des messages - accessible aux administrateurs */}
          {user.status === 'administrateur' && (
            <FadeInStaggerItem>
              <motion.div
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                style={{ display: 'block', height: '100%' }}
              >
                <Link
                  href="/messages"
                  className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-500 rounded-lg shadow-sm hover:shadow-md transition-shadow block h-full"
                  aria-label="Accéder à l'administration des messages"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-medium text-gray-900">Administration des messages</h2>
                      <p className="mt-1 text-sm text-gray-500">Gérer les messages et annonces</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </FadeInStaggerItem>
          )}
        </div>
      </FadeInStagger>

        {/* Affichage du dernier message */}
        {lastMessage && (
          <AnimatedContainer variant="slideUp" delay={0.6} className="mt-12">
            <motion.h2
              className="text-2xl font-bold mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              Dernier message
            </motion.h2>
            <motion.div
              className="bg-white rounded-lg shadow-md p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {lastMessage.title}
                </h3>
                <span className="text-sm text-gray-500">
                  {new Date(lastMessage.date).toLocaleDateString('fr-FR')}
                </span>
              </div>

              {lastMessage.images && lastMessage.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
                  {lastMessage.images.map((image, index) => (
                    image && (
                      <div key={index} className="relative aspect-square">
                        <Image
                          src={image}
                          alt={`Image ${index + 1} du message`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover rounded"
                        />
                      </div>
                    )
                  ))}
                </div>
              )}

              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {lastMessage.content}
                </p>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                Publié par {lastMessage.userName}
              </div>
            </motion.div>
          </AnimatedContainer>
        )}
      </nav>
    </motion.div>
  );
}

