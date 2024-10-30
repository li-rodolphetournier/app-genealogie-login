'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../components/Layout';
import Link from 'next/link';

type Object = {
  id: string;
  nom: string;
  type: string;
  utilisateur: string;
  status: 'disponible' | 'indisponible';
  photos: { url: string; description: string[] }[];
};

const ObjectDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const [object, setObject] = useState<Object | null>(null);
  const [userStatus, setUserStatus] = useState<string>('');

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const { status } = JSON.parse(currentUser);
      setUserStatus(status);
    }

    const fetchObject = async () => {
      try {
        const response = await fetch(`/api/objects/${id}`);
        const data = await response.json();
        if (response.ok) {
          setObject(data);
        } else {
          console.error('Erreur lors de la récupération des détails de l&apos;objet:', data.message);
        }
      } catch (error) {
        console.error('Erreur réseau lors de la récupération des détails de l&apos;objet:', error);
      }
    };

    fetchObject();
  }, [id]);

  if (!object) {
    return (
      <Layout>
        <div role="alert" className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="sr-only">Chargement...</span>
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête fixe */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" id="objectTitle">
                {object.nom}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Détails de l&apos;objet
              </p>
            </div>
            <div className="flex space-x-4">
              {userStatus !== 'utilisateur' && (
                <Link
                  href={`/objects/edit/${id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label={`Modifier ${object.nom}`}
                >
                  <svg 
                    className="-ml-1 mr-2 h-5 w-5" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    aria-hidden="true"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Modifier
                </Link>
              )}
              <Link
                href="/objects"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Retour à la liste
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal avec padding-top pour compenser l&apos;en-tête fixe */}
      <main className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-full mx-auto">
          {/* Informations principales */}
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Informations générales
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-lg text-gray-900">{object.type}</dd>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <dt className="text-sm font-medium text-gray-500">Utilisateur</dt>
                <dd className="mt-1 text-lg text-gray-900">{object.utilisateur}</dd>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <dt className="text-sm font-medium text-gray-500">Statut</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    object.status === 'disponible' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {object.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Photos */}
          {object.photos && object.photos.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Photos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {object.photos.map((photo, index) => (
                  <div 
                    key={index} 
                    className="group relative bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="aspect-w-1 aspect-h-1">
                      <img
                        src={photo.url}
                        alt={photo.description[0] || `Photo ${index + 1} de ${object.nom}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {photo.description && photo.description.length > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                        <ul className="text-sm space-y-1">
                          {photo.description.map((desc, descIndex) => (
                            <li key={descIndex}>{desc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ObjectDetails;
