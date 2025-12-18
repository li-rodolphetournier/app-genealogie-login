'use client';

import { useState, useEffect } from 'react';
import { useTheme, type ThemeTemplate } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ToastProvider';
import { motion, AnimatePresence } from 'framer-motion';

const TEMPLATES: Array<{ id: ThemeTemplate; name: string; description: string; colors: string[] }> = [
  {
    id: 'default',
    name: 'Par défaut',
    description: 'Thème classique (blanc et noir)',
    colors: ['#ffffff', '#0a0a0a'],
  },
  {
    id: 'ocean-sunset',
    name: 'Ocean Sunset',
    description: 'Bleu, jaune, orange, rose',
    colors: ['#4a90e2', '#f5d76e', '#ff8c42', '#ff6b9d'],
  },
  {
    id: 'warm-gradient',
    name: 'Warm Gradient',
    description: 'Palette nature (vert profond, sauge, accent terre)',
    colors: ['#F3F6F2', '#4F6F52', '#A9B7A0', '#8C6A4A'],
  },
  {
    id: 'fragonard',
    name: 'Fragonard',
    description: 'Ambiance XVIIIème siècle (terres cuites, crème, or pâle)',
    colors: ['#faf8f5', '#c97d60', '#d4a574', '#a67c52'],
  },
  {
    id: 'test',
    name: 'Test',
    description: 'Ambiance Fragonard (beiges chauds, pêches douces, élégance XVIIIème)',
    colors: ['#fef9f5', '#c99d7a', '#d4b89a', '#b88a6a'],
  },
  {
    id: 'fragonard-refined',
    name: 'Fragonard Refined',
    description: 'Élégance aristocratique (vert sauge, rose poudré, or patiné)',
    colors: ['#F7F4EF', '#7A8F7A', '#D8A7A0', '#C2A14D'],
  },
];

export function ThemeFloatingMenu() {
  const { userStatus, isLoading } = useAuth();
  const { theme, toggleTheme, template, setTemplate, applyGlobalTemplate, mounted } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isConfirmModalOpen) {
          setIsConfirmModalOpen(false);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isConfirmModalOpen]);

  const isAdmin = userStatus === 'administrateur';

  if (!mounted || isLoading || !isAdmin) {
    return null;
  }

  const isDark = theme === 'dark';

  return (
    <>
      {/* Bouton flottant pour ouvrir le menu */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full bg-white dark:bg-gray-800 shadow-lg border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center hover:shadow-xl transition-shadow"
        aria-label="Ouvrir le menu de thème"
      >
        <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </motion.button>

      {/* Modal sticky à droite */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-96 max-w-[90vw] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Personnalisation du thème
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 bg-transparent transition-colors"
                  aria-label="Fermer le menu"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenu */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Switch Dark Mode */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Mode d'affichage
                  </h3>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Mode sombre
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {isDark ? 'Activé' : 'Désactivé'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isDark ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      aria-label="Basculer le mode sombre"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isDark ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Sélection des templates */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Templates de thème
                  </h3>
                  <div className="space-y-2">
                    {TEMPLATES.map((templateOption) => {
                      const isSelected = templateOption.id === template;
                      return (
                        <label
                          key={templateOption.id}
                          className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name="theme-template"
                            value={templateOption.id}
                            checked={isSelected}
                            onChange={() => setTemplate(templateOption.id)}
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {templateOption.name}
                              </span>
                              {isSelected && (
                                <svg
                                  className="w-4 h-4 text-blue-600 dark:text-blue-400"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              {templateOption.description}
                            </p>
                            <div className="flex gap-1.5">
                              {templateOption.colors.map((color, idx) => (
                                <div
                                  key={idx}
                                  className="w-6 h-6 rounded-sm border border-gray-300 dark:border-gray-600 shadow-sm"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <div className="pt-3 space-y-2">
                    <button
                      onClick={() => setIsConfirmModalOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Appliquer pour tous les utilisateurs
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Définit ce template comme valeur par défaut pour toutes les sessions de ce navigateur
                      (utilisateur, rédacteur, administrateur). Les autres navigateurs devront être configurés séparément.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modale de confirmation */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmModalOpen(false)}
              className="fixed inset-0 bg-black/50 dark:bg-black/60 z-[60]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 flex items-center justify-center z-[70] p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Confirmer l'application du template
                  </h3>
                  <button
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Fermer"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Contenu */}
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      Êtes-vous sûr de vouloir appliquer le template{' '}
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        "{TEMPLATES.find(t => t.id === template)?.name ?? template}"
                      </span>{' '}
                      à tous les utilisateurs ?
                    </p>
                    <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">
                        ⚠️ Attention
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        Ce template sera utilisé par défaut pour toutes les sessions de ce navigateur 
                        (utilisateur, rédacteur, administrateur). Les autres navigateurs devront être configurés séparément.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={async () => {
                      setIsConfirmModalOpen(false);
                      
                      try {
                        // 1) appliquer immédiatement dans ce navigateur
                        await Promise.resolve(applyGlobalTemplate(template));

                        // 2) persister le choix côté serveur pour les futures sessions
                        const response = await fetch('/api/theme/default-template', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ template }),
                        });

                        if (!response.ok) {
                          const errorData = await response.json().catch(() => ({}));
                          throw new Error(errorData.error || 'Erreur lors de la mise à jour du thème global');
                        }
                        showToast(
                          `Le template "${TEMPLATES.find(t => t.id === template)?.name ?? template}" sera utilisé par défaut pour tous les utilisateurs sur ce navigateur.`,
                          'success',
                        );
                      } catch (error) {
                        console.error("Erreur lors de l'application globale du template:", error);
                        showToast("Impossible d'appliquer le template globalement.", 'error');
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

