'use client';

import { useState } from 'react';
import Image from 'next/image';

type ProfileImageProps = {
  src?: string | null;
  alt: string;
  fallbackText: string;
  size?: number;
  className?: string;
};

/**
 * Composant pour afficher une image de profil avec fallback lettrines
 * Affiche les initiales si l'image n'est pas disponible ou invalide
 */
export function ProfileImage({
  src,
  alt,
  fallbackText,
  size = 64,
  className = '',
}: ProfileImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Vérifier si l'URL est une URL locale qui n'existe plus (404)
  const isLocalUrl = src?.startsWith('/uploads/');
  
  // Utiliser les lettrines si pas d'image, si erreur, ou si URL locale (probablement 404)
  const showFallback = !src || imageError || isLocalUrl;

  // Extraire les initiales (première lettre de chaque mot)
  const getInitials = (text: string): string => {
    if (!text) return '?';
    const words = text.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return text.charAt(0).toUpperCase();
  };

  const initials = getInitials(fallbackText);

  if (showFallback) {
    return (
      <div
        className={`rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        aria-label={alt}
      >
        {initials}
      </div>
    );
  }

  return (
    <div 
      className={`relative rounded-full overflow-hidden ${className}`} 
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="object-cover w-full h-full"
        onError={() => {
          setImageError(true);
          setImageLoaded(false);
        }}
        onLoad={() => setImageLoaded(true)}
        style={{ display: imageError ? 'none' : 'block' }}
      />
      {!imageLoaded && !imageError && (
        <div
          className="absolute inset-0 rounded-full bg-gray-200 animate-pulse flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="text-gray-400 text-xs">...</span>
        </div>
      )}
    </div>
  );
}
