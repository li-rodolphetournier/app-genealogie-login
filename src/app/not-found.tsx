import Link from 'next/link';
import { BackToHomeButton } from '@/components/navigation';

export default function NotFound() {
  return (
    <main role="main" className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-4">404</h1>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Page non trouvée</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Désolé, la page que vous recherchez n'existe pas.
        </p>
        <BackToHomeButton variant='button' className="px-6 py-3 text-base bg-blue-800 hover:bg-blue-900 text-white" />
      </div>
    </main>
  );
}

