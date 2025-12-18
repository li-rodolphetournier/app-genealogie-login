import Image from 'next/image';
import { BackToHomeButton } from '@/components/navigation';

export default function NotFound() {
  return (
    <main
      role="main"
      className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-12"
    >
      <div className="max-w-4xl w-full mx-auto">
        <div className="grid gap-10 md:grid-cols-2 items-center bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden">
          {/* Colonne gauche : logo / illustration */}
          <div className="relative h-full bg-gradient-to-br from-red-700 via-red-600 to-red-500 p-6 md:p-8 flex items-center justify-center">
            <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-xl border border-white/30">
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-white shadow-lg">
                <Image
                  src="/uploads/login/armoirie.png"
                  alt="Armoiries du site de généalogie"
                  fill
                  sizes="160px"
                  className="object-contain"
                />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 opacity-30">
              <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-yellow-300/30 blur-3xl" />
            </div>
          </div>

          {/* Colonne droite : texte et actions */}
          <div className="px-6 py-8 md:px-8 md:py-10 flex flex-col justify-center">
            <p className="text-sm font-semibold tracking-widest text-blue-700 dark:text-blue-400 uppercase mb-2">
              Site de Généalogie
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3">
              404
            </h1>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Page non trouvée
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Désolé, la page que vous cherchez n&apos;existe pas, a été déplacée ou n&apos;est plus
              disponible. Utilisez le bouton ci-dessous pour revenir a notre arbre généalogique de
              l&apos;application.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <BackToHomeButton
                variant="button"
                className="px-6 py-3 text-base bg-blue-800 hover:bg-blue-900 text-white rounded-lg shadow-md hover:shadow-lg transition"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Vous pouvez aussi vérifier l&apos;URL ou utiliser la navigation principale.
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

