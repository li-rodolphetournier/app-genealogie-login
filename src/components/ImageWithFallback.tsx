'use client';

import { useEffect, useState } from 'react';

// Props pour le composant
type ImageWithFallbackProps = {
  src?: string | null;
  alt: string;
  fallback?: React.ReactNode; // Optionnel: pour un fallback custom
  className?: string;        // Classes pour le wrapper/fallback
  imgClassName?: string;    // Classes spécifiques pour l'image elle-même
};

// Le SVG Placeholder par défaut
const DefaultFallback = ({ className }: { className?: string }) => (
  <div className={`w-full h-full bg-gray-200 flex items-center justify-center ${className || ''}`}>
    <svg className="h-1/2 w-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"> {/* Taille SVG ajustée */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>
);

// Composant ImageWithFallback
export default function ImageWithFallback({
  src,
  alt,
  fallback,
  className = '',
  imgClassName = '',
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(!src);

  useEffect(() => {
    // Réinitialise si la source change
    setHasError(!src);
  }, [src]);

  if (hasError) {
    // Affiche le fallback custom ou le SVG par défaut
    return fallback ? <>{fallback}</> : <DefaultFallback className={className} />;
  }

  // Affiche l'image réelle
  return (
    <img
      src={src || ''}
      alt={alt}
      className={`${className} ${imgClassName}`} // Combine les classes
      onError={() => setHasError(true)} // Active le fallback en cas d'erreur
      loading="lazy" // Pour la performance
    />
  );
}
