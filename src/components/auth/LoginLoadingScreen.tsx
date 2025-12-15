'use client';

import Image from 'next/image';

/**
 * Écran de chargement optimisé pour la page de login
 * Affiche immédiatement le logo avec un loader pour améliorer le LCP
 */
export function LoginLoadingScreen() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        {/* Logo avec dimensions fixes pour éviter le layout shift */}
        <div className="relative w-32 h-32 flex items-center justify-center mx-auto mb-8">
          <Image
            src="/uploads/login/armoirie.png"
            alt="Armoiries"
            width={128}
            height={128}
            className="object-contain"
            priority
            loading="eager"
            style={{ maxWidth: '100%', width: 'auto', height: 'auto' }}
          />
        </div>
        
        {/* Spinner optimisé */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
        <p className="mt-4 text-gray-700 dark:text-gray-300">Vérification...</p>
      </div>
    </div>
  );
}

