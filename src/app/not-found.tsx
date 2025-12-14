import Link from 'next/link';
import { BackToHomeButton } from '@/components/navigation';

export default function NotFound() {
  return (
    <main role="main" className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white mb-4">Page non trouvée</h1>
        <p className="text-9xl font-bold text-gray-200 dark:text-gray-700 mb-4" aria-hidden="true">404</p>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Désolé, la page que vous recherchez n'existe pas.
        </p>
        <BackToHomeButton variant='button' className="px-6 py-3 text-base bg-blue-600 hover:bg-blue-700" />
      </div>
    </main>
  );
}

