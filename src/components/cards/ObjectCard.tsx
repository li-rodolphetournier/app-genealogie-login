/**
 * Composant ObjectCard optimisé avec React.memo
 */

'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/ImageWithFallback';
import type { ObjectData } from '@/types/objects';

type ObjectCardProps = {
  object: ObjectData;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
};

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    publie: 'Publié',
    brouillon: 'Brouillon',
    archive: 'Archivé',
  };
  return statusMap[status] || status;
};

export const ObjectCard = React.memo<ObjectCardProps>(({ object, onDelete, canEdit }) => {
  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(object.id);
    }
  }, [object.id, onDelete]);

  return (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      <Link
        href={`/objects/${object.id}`}
        className="block h-48 flex-shrink-0 p-4"
      ><div className=" h-48 flex-shrink-0 p-4" style={{ backgroundColor: 'white' }}>
        <ImageWithFallback
          src={object.photos?.[0]?.url}
          alt={object.photos?.[0]?.description?.[0] || `Photo de ${object.nom}`}
          className="w-full h-full"
          imgClassName="object-contain"
          width={400}
          height={300}
        /></div>
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{object.nom}</h2>
        <p className="text-sm text-gray-600 mb-2">Type: {object.type}</p>
        <p className="text-sm text-gray-600 mb-3">Par: {object.utilisateur}</p>
        <div className="flex items-center justify-between mt-auto">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              object.status === 'publie'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {getStatusLabel(object.status)}
          </span>
          <div className="flex space-x-2">
            {canEdit && (
              <Link
                href={`/objects/edit/${object.id}`}
                className="px-3 py-1 text-xs border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Modifier
              </Link>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="px-3 py-1 text-xs border border-red-300 rounded-md text-red-700 bg-white hover:bg-red-50"
                aria-label={`Supprimer ${object.nom}`}
              >
                Supprimer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ObjectCard.displayName = 'ObjectCard';

