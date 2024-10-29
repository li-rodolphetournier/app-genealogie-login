'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  const [object, setObject] = useState<Object | null>(null);

  useEffect(() => {
    const fetchObject = async () => {
      try {
        const response = await fetch(`/api/objects/${id}`);
        const data = await response.json();
        if (response.ok) {
          setObject(data);
        } else {
          console.error('Erreur lors de la récupération des détails de l\'objet:', data.message);
        }
      } catch (error) {
        console.error('Erreur réseau lors de la récupération des détails de l\'objet:', error);
      }
    };

    fetchObject();
  }, [id]);

  if (!object) {
    return <Layout><div>Chargement...</div></Layout>;
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Détails de l'objet</h1>
      <div className="space-y-2">
        <p><strong>Nom:</strong> {object.nom}</p>
        <p><strong>Type:</strong> {object.type}</p>
        <p><strong>Utilisateur:</strong> {object.utilisateur}</p>
        <p><strong>Statut:</strong> {object.status}</p>
        {object.photos && object.photos.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mt-4 mb-2">Photos:</h2>
            <div className="grid grid-cols-2 gap-4">
              {object.photos.map((photo, index) => (
                <div key={index} className="border p-2">
                  <img src={photo.url} alt={photo.description[0] || `Photo ${index + 1}`} className="w-full h-48 object-cover" />
                  <p className="mt-2">{photo.description.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Link href="/objects" className="mt-4 inline-block text-blue-500 hover:underline">
        Retour à la liste des objets
      </Link>
    </Layout>
  );
};

export default ObjectDetails;
