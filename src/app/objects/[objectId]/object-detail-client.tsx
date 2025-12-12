'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { PageTransition } from '@/components/animations';
import { ObjectImageCarousel } from '@/components/carousel/ObjectImageCarousel';
import type { ObjectData } from '@/types/objects';

type ObjectDetailClientProps = {
  object: ObjectData;
};

export function ObjectDetailClient({ object }: ObjectDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();

  const canEdit = user && (user.status === 'administrateur' || user.login === object.utilisateur);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow lg:grid lg:grid-cols-1 lg:gap-x-8 px-6 py-8">
          <div className="lg:col-span-1 mt-8 lg:mt-0">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 pb-4 border-b border-gray-200">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{object?.nom}</h1>
                <p className="text-sm text-gray-500">Type: {object?.type}</p>
              </div>
              <div className="flex space-x-3 mt-4 sm:mt-0 flex-shrink-0">
                {canEdit && (
                  <Link
                    href={`/objects/edit/${object.id}`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Modifier
                  </Link>
                )}
                <button
                  onClick={() => router.push('/objects')}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Retour
                </button>
              </div>
            </div>

            {object?.description && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-1">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{object.description}</p>
              </div>
            )}

            {object?.longDescription && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-1">Détails</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{object.longDescription}</p>
              </div>
            )}
            <div className="lg:col-span-1">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4 lg:hidden">Photos</h2>
               <ObjectImageCarousel
                photos={object?.photos || []}
                objectName={object?.nom || 'objet'}
              />
            </div>
          </div>
          </div>
          {object && (
            <div className="lg:col-span-3 mt-8 pt-6 border-t border-gray-200 flex flex-wrap justify-between items-baseline gap-x-4 gap-y-2">
              <div className="text-sm">
                <span className="font-medium text-gray-500">Créé par: </span>
                <span className="text-gray-900">{object.utilisateur}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-500">Statut: </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${object.status === 'publie' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {object.status === 'publie' ? 'Publié' : 'Brouillon'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </PageTransition>
  );
}

