// Next.js 16 : serverRuntimeConfig est déprécié, utiliser des variables d'environnement à la place
export function getTempDir() {
  // Utiliser la variable d'environnement ou un répertoire par défaut
  return process.env.TEMP_DIR || process.env.NEXT_PUBLIC_TEMP_DIR || '/tmp';
} 