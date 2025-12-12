'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

type BackToHomeButtonProps = {
  /**
   * Variante du bouton
   * - 'button': Bouton avec bordure (style par défaut)
   * - 'link': Lien simple avec soulignement
   * - 'icon': Bouton avec icône flèche
   */
  variant?: 'button' | 'link' | 'icon';
  /**
   * Utiliser router.push au lieu de Link (pour les cas spéciaux)
   */
  useRouter?: boolean;
  /**
   * Classe CSS supplémentaire
   */
  className?: string;
  /**
   * Texte du bouton (par défaut: "Retour à l'accueil")
   */
  label?: string;
  /**
   * Callback personnalisé au clic (remplace le comportement par défaut)
   */
  onClick?: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
};

/**
 * Composant uniforme pour le bouton "Retour à l'accueil"
 * Utilise un style cohérent dans toute l'application
 */
export function BackToHomeButton({
  variant = 'button',
  useRouter: useRouterProp = false,
  className = '',
  label = "Retour à l'accueil",
  onClick,
}: BackToHomeButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
      return;
    }

    if (useRouterProp) {
      e.preventDefault();
      router.push('/accueil');
    }
  };

  // Variante: Lien simple
  if (variant === 'link') {
    return (
      <Link
        href="/accueil"
        onClick={handleClick}
        className={`text-blue-600 hover:text-blue-800 font-medium transition-colors ${className}`}
        aria-label={label}
      >
        ← {label}
      </Link>
    );
  }

  // Variante: Bouton avec icône
  if (variant === 'icon') {
    return (
      <Link
        href="/accueil"
        onClick={handleClick}
        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${className}`}
        aria-label={label}
      >
        <svg
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        {label}
      </Link>
    );
  }

  // Variante par défaut: Bouton avec bordure
  return (
    <Link
      href="/accueil"
      onClick={handleClick}
      className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${className}`}
      aria-label={label}
    >
      {label}
    </Link>
  );
}

