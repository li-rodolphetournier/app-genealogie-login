import Link from 'next/link';
import { BackToHomeButton } from '@/components/navigation';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mb-4">Page non trouvée</h2>
        <p className="text-gray-600 mb-8">
          Désolé, la page que vous recherchez n'existe pas.
        </p>
        <BackToHomeButton variant='button' className="px-6 py-3 text-base bg-blue-600 hover:bg-blue-700" />
      </div>
    </div>
  );
}

