'use client';

import { useEffect, useState, memo } from 'react';
import Image from 'next/image';

// Props pour le composant
type ImageWithFallbackProps = {
  src?: string | null;
  alt: string;
  fallback?: React.ReactNode; // Optionnel: pour un fallback custom
  className?: string;        // Classes pour le wrapper/fallback
  imgClassName?: string;    // Classes spécifiques pour l'image elle-même
  fill?: boolean;           // Utiliser fill au lieu de width/height
  width?: number;           // Largeur (si fill n'est pas utilisé)
  height?: number;          // Hauteur (si fill n'est pas utilisé)
  sizes?: string;           // Tailles pour les images responsives
  priority?: boolean;       // Chargement prioritaire
};

// Le SVG Placeholder par défaut
const DefaultFallback = ({ className }: { className?: string }) => (
  <div className={`w-full h-full bg-gray-200 flex items-center justify-center ${className || ''}`}>
    <svg className="h-1/2 w-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>
);

// Composant ImageWithFallback optimisé avec next/image
const ImageWithFallback = memo(function ImageWithFallback({
  src,
  alt,
  fallback,
  className = '',
  imgClassName = '',
  fill = false,
  width,
  height,
  sizes,
  priority = false,
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(!src);
  const [imageSrc, setImageSrc] = useState<string | null>(src || null);

  useEffect(() => {
    // Réinitialise si la source change
    setImageSrc(src || null);
    setHasError(!src);
  }, [src]);

  if (hasError || !imageSrc) {
    // Affiche le fallback custom ou le SVG par défaut
    return fallback ? <>{fallback}</> : <DefaultFallback className={className} />;
  }

  // Vérifier si l'URL est externe ou interne
  const isExternal = imageSrc.startsWith('http://') || imageSrc.startsWith('https://');
  
  // Props de base pour next/image
  const imageProps = {
    src: imageSrc,
    alt,
    className: `${className} ${imgClassName}`.trim(),
    onError: () => setHasError(true),
    priority,
    ...(fill
      ? {
          fill: true,
          sizes: sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
        }
      : {
          width: width || 500,
          height: height || 500,
        }),
    ...(isExternal && {
      unoptimized: true, // Pour les images externes non optimisées
    }),
  };

  // Affiche l'image optimisée avec next/image
  return <Image {...imageProps} />;
});

ImageWithFallback.displayName = 'ImageWithFallback';

export default ImageWithFallback;
