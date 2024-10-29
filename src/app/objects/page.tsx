'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';

type Object = {
  id: string;
  nom: string;
  type: string;
  utilisateur: string;
  status: 'disponible' | 'indisponible';
};

const ObjectsList = () => {
  const [objects, setObjects] = useState<Object[]>([]);

  const fetchObjects = useCallback(async () => {
    try {
      const response = await fetch('/api/objects');
      if (response.ok) {
        const data = await response.json();
        console.log('Données reçues de l\'API:', data);
        setObjects(data);
      } else {
        const errorText = await response.text();
        console.error('Erreur lors de la récupération des objets:', response.status, errorText);
      }
    } catch (error) {
      console.error('Erreur réseau lors de la récupération des objets:', error);
    }
  }, []);

  useEffect(() => {
    fetchObjects();
  }, [fetchObjects]);

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet objet ?')) {
      try {
        const response = await fetch(`/api/objects/delete?id=${id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok) {
          fetchObjects(); // Recharger la liste après la suppression
          alert('Objet supprimé avec succès');
        } else {
          console.error('Erreur lors de la suppression de l\'objet:', data.message);
          alert(`Erreur lors de la suppression de l'objet: ${data.message}`);
        }
      } catch (error) {
        console.error('Erreur réseau lors de la suppression:', error);
        alert(`Une erreur est survenue lors de la suppression de l'objet: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Liste des objets</h1>
      <Link href="/objects/create" className="mb-4 inline-block text-blue-500 hover:underline">
        Créer un nouvel objet
      </Link>
      <ul className="space-y-2">
        {Array.isArray(objects) && objects.map((object) => (
          <li key={object.id} className="border p-2 rounded flex justify-between items-center">
            <span>{object.nom} ({object.type})</span>
            <div>
              <Link href={`/objects/${object.id}`} className="ml-2 text-blue-500 hover:underline">
                Voir détails
              </Link>
              <button 
                onClick={() => handleDelete(object.id)} 
                className="ml-2 text-red-500 hover:underline"
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
      <Link href="/accueil" className="mt-4 inline-block text-blue-500 hover:underline">
        Retour à l&apos;accueil
      </Link>
    </Layout>
  );
};

export default ObjectsList;
