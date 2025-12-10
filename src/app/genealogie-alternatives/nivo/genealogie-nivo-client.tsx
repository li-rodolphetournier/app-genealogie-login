'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { hierarchy, HierarchyNode } from 'd3-hierarchy';
import { tree } from 'd3-hierarchy';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ToastProvider';
import { getErrorMessage } from '@/lib/errors/messages';
import GenericImageUploader from '@/components/ImageUploader';
import type { Person } from '@/types/genealogy';

// Composant de rendu SVG pour l'arbre Nivo
type NivoTreeRendererProps = {
  data: TreeNode;
  width: number;
  height: number;
  translate: { x: number; y: number };
  isDragging: boolean;
  selectedNodeId?: string;
  onNodeClick: (node: TreeNode) => void;
  getImage: (node: TreeNode) => string;
  getDefaultImage: (genre?: 'homme' | 'femme') => string;
};

const defaultMargin = { top: 40, left: 40, right: 40, bottom: 40 };

function NivoTreeRenderer({
  data,
  width,
  height,
  translate,
  isDragging,
  selectedNodeId,
  onNodeClick,
  getImage,
  getDefaultImage
}: NivoTreeRendererProps) {
  const root = useMemo(() => hierarchy(data), [data]);
  
  const yMax = Math.max(600, height - defaultMargin.top - defaultMargin.bottom);
  const xMax = Math.max(800, width - defaultMargin.left - defaultMargin.right);
  
  const treeLayout = useMemo(() => {
    const t = tree<TreeNode>();
    t.size([yMax, xMax]);
    return t;
  }, [yMax, xMax]);
  
  const treeRoot = useMemo(() => {
    return treeLayout(root);
  }, [treeLayout, root]);
  
  // Fonction pour créer un chemin step (lignes droites) - arbre vertical
  const linkPath = (source: any, target: any) => {
    // Dans un arbre vertical : source.x et target.x = positions horizontales
    // source.y et target.y = positions verticales (profondeur)
    const sx = source.x || 0; // Position horizontale source
    const sy = source.y || 0; // Position verticale source
    const tx = target.x || 0; // Position horizontale target
    const ty = target.y || 0; // Position verticale target
    // Chemin vertical : ligne verticale depuis source, puis horizontale vers target
    return `M${sx},${sy}V${ty}H${tx}`;
  };
  
  return (
    <svg
      width={width}
      height={height}
      style={{ display: 'block', cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <rect width="100%" height="100%" fill="#f9fafb" />
      <g transform={`translate(${defaultMargin.left + translate.x},${defaultMargin.top + translate.y})`}>
        {/* Liens entre les nœuds */}
        {treeRoot.links().map((link, i) => {
          const sourceId = link.source.data?.id;
          const targetId = link.target.data?.id;
          if (sourceId === 'root' || targetId === 'root') return null;
          
          const isDeceased = link.target.data?.dateDeces;
          return (
            <path
              key={`link-${sourceId}-${targetId}-${i}`}
              d={linkPath(link.source, link.target)}
              fill="none"
              stroke={isDeceased ? "#9ca3af" : "#7c3aed"}
              strokeWidth="2"
              strokeOpacity={isDeceased ? 0.5 : 0.8}
              strokeDasharray={isDeceased ? "5,5" : undefined}
            />
          );
        })}
        
        {/* Nœuds */}
        {treeRoot.descendants().map((node, i) => {
          const nodeData = node.data;
          if (nodeData.id === 'root') return null;
          
          const nodeWidth = 200;
          const nodeHeight = 100;
          // Dans un arbre vertical avec size([yMax, xMax]):
          // node.y = position verticale (profondeur/génération) - de haut en bas
          // node.x = position horizontale (position dans la branche) - de gauche à droite
          const top = node.y || 0; // Position verticale (profondeur)
          const left = node.x || 0; // Position horizontale (branche)
          const isDead = !!nodeData.dateDeces;
          const isSelected = selectedNodeId === nodeData.id;
          
          // Couleurs inspirées de Nivo
          const borderColor = isDead 
            ? '#9ca3af' 
            : isSelected 
            ? '#7c3aed' 
            : '#6366f1';
          
          return (
            <g key={`node-${nodeData.id}-${i}`} transform={`translate(${left},${top})`}>
              <foreignObject
                width={nodeWidth}
                height={nodeHeight}
                x={-nodeWidth / 2}
                y={-nodeHeight / 2}
                className="nivo-node"
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onNodeClick(nodeData);
                  }}
                  className={`bg-white border-2 rounded-lg p-2 cursor-pointer transition-all hover:shadow-xl ${
                    isDead
                      ? 'border-gray-400 opacity-70'
                      : isSelected
                      ? 'border-purple-600 shadow-xl ring-2 ring-purple-300'
                      : 'border-indigo-500'
                  }`}
                  style={{
                    width: nodeWidth,
                    height: nodeHeight,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderColor: borderColor,
                  }}
                >
                  <img
                    src={getImage(nodeData)}
                    alt={nodeData.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = getDefaultImage(nodeData.genre);
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs truncate" title={nodeData.name}>
                      {nodeData.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {nodeData.dateNaissance && new Date(nodeData.dateNaissance).getFullYear()}
                      {nodeData.dateDeces && ` - ${new Date(nodeData.dateDeces).getFullYear()}`}
                    </div>
                    {nodeData.description && (
                      <div className="text-xs text-gray-600 truncate" title={nodeData.description}>
                        {nodeData.description}
                      </div>
                    )}
                  </div>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

type TreeNode = {
  name: string;
  id: string;
  genre: 'homme' | 'femme';
  description: string;
  dateNaissance: string;
  dateDeces: string | null;
  image: string | null;
  children?: TreeNode[];
};

type GenealogieNivoClientProps = {
  initialPersons: Person[];
};

export function GenealogieNivoClient({ initialPersons }: GenealogieNivoClientProps) {
  const { showToast } = useToast();
  const [persons, setPersons] = useState<Person[]>(initialPersons);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Omit<Person, 'id'>>({
    nom: '',
    prenom: '',
    genre: 'homme',
    description: '',
    mere: null,
    pere: null,
    ordreNaissance: 1,
    dateNaissance: '',
    dateDeces: null,
    image: null
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // États pour le drag/pan
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth({
    redirectIfUnauthenticated: true,
    redirectTo: '/',
  });

  const userStatus = user?.status || '';

  // Déterminer les dimensions du viewport
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth - (isMenuOpen ? 384 : 0),
        height: window.innerHeight - 64, // Header height
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isMenuOpen]);

  // Construction de l'arbre à partir des données Person
  const treeData = useMemo(() => {
    const buildFamilyTree = (personsData: Person[]): TreeNode[] => {
      const roots = personsData.filter(p => !p.pere && !p.mere);
      const processedIds = new Set<string>();

      const buildPersonNode = (person: Person): TreeNode | null => {
        if (processedIds.has(person.id)) {
          return null;
        }

        processedIds.add(person.id);

        const children = personsData
          .filter(p => (p.pere === person.id || p.mere === person.id))
          .sort((a, b) => {
            if (a.ordreNaissance !== b.ordreNaissance) {
              return a.ordreNaissance - b.ordreNaissance;
            }
            const dateA = a.dateNaissance ? new Date(a.dateNaissance).getTime() : 0;
            const dateB = b.dateNaissance ? new Date(b.dateNaissance).getTime() : 0;
            return dateA - dateB;
          });

        const childNodes = children
          .map(child => {
            processedIds.delete(child.id);
            return buildPersonNode(child);
          })
          .filter((node): node is TreeNode => node !== null);

        return {
          name: `${person.prenom} ${person.nom}`.trim() || `Personne ${person.id.slice(0, 8)}`,
          id: person.id,
          genre: person.genre,
          description: person.description || '',
          dateNaissance: person.dateNaissance || '',
          dateDeces: person.dateDeces,
          image: person.image,
          children: childNodes.length > 0 ? childNodes : undefined
        };
      };

      return roots
        .map(person => {
          processedIds.clear();
          return buildPersonNode(person);
        })
        .filter((node): node is TreeNode => node !== null);
    };

    const roots = buildFamilyTree(persons);
    if (roots.length === 0) return null;

    if (roots.length === 1) {
      return roots[0];
    }

    if (roots.length === 0 && persons.length > 0) {
      const firstPerson = persons[0];
      return {
        name: `${firstPerson.prenom} ${firstPerson.nom}`.trim() || 'Racine',
        id: firstPerson.id,
        genre: firstPerson.genre,
        description: firstPerson.description,
        dateNaissance: firstPerson.dateNaissance,
        dateDeces: firstPerson.dateDeces,
        image: firstPerson.image,
        children: undefined
      };
    }

    return {
      name: 'Famille Racine',
      id: 'root',
      genre: 'homme' as const,
      description: 'Racine de l\'arbre généalogique',
      dateNaissance: '',
      dateDeces: null,
      image: null,
      children: roots
    };
  }, [persons]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' && (name === 'mere' || name === 'pere' || name === 'dateDeces' || name === 'image') ? null : value
    }));
  };

  const handleImageUploadSuccess = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      image: imageUrl
    }));
  };

  const handleImageUploadError = (errorMessage: string) => {
    console.error("Upload error:", errorMessage);
    showToast(getErrorMessage('FILE_UPLOAD_FAILED'), 'error');
  };

  const handleBackgroundClick = () => {
    setSelectedNode(null);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleNodeClick = (node: TreeNode) => {
    if (node.id === 'root') return;
    setSelectedNode(node);
    const person = persons.find(p => p.id === node.id);
    if (person) {
      setFormData({
        nom: person.nom,
        prenom: person.prenom,
        genre: person.genre,
        description: person.description,
        mere: person.mere,
        pere: person.pere,
        ordreNaissance: person.ordreNaissance,
        dateNaissance: person.dateNaissance,
        dateDeces: person.dateDeces,
        image: person.image
      });
      setEditingId(person.id);
      setIsEditing(true);
      setIsMenuOpen(true);
    }
  };

  // Fonction pour rafraîchir les données depuis l'API
  const refreshData = async () => {
    try {
      const response = await fetch('/api/genealogie-alternatives');
      if (response.ok) {
        const data = await response.json();
        setPersons(data);
      } else {
        console.error('Erreur lors du rafraîchissement des données');
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formDataCopy = { ...formData };
    if (!formDataCopy.nom && formDataCopy.pere) {
      const pereNode = persons.find(p => p.id === formDataCopy.pere);
      if (pereNode?.nom) {
        formDataCopy.nom = pereNode.nom;
      }
    }

    const newPerson: Person = {
      ...formDataCopy,
      id: crypto.randomUUID(),
      image: formDataCopy.image
    };

    try {
      const response = await fetch('/api/genealogie/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPerson),
      });

      if (response.ok) {
        await refreshData();
        showToast('Personne ajoutée avec succès !', 'success');
        setFormData({
          nom: '',
          prenom: '',
          genre: 'homme',
          description: '',
          mere: null,
          pere: null,
          ordreNaissance: 1,
          dateNaissance: '',
          dateDeces: null,
          image: null
        });
      } else {
        const error = await response.json();
        const errorMessage = error.error || error.message || getErrorMessage('GENEALOGY_PERSON_ADD_FAILED');
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout :', error);
      showToast(getErrorMessage('GENEALOGY_PERSON_ADD_FAILED'), 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    const updatedPerson: Person = {
      ...formData,
      id: editingId,
      image: formData.image || null,
      dateDeces: formData.dateDeces || null,
      mere: formData.mere || null,
      pere: formData.pere || null,
    };

    try {
      const response = await fetch('/api/genealogie/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPerson),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (response.ok) {
        if (isJson) {
          const result = await response.json();
          await refreshData();
          setIsEditing(false);
          setEditingId(null);
          setSelectedNode(null);
          showToast(result.message || 'Personne mise à jour avec succès !', 'success');
        } else {
          await refreshData();
          setIsEditing(false);
          setEditingId(null);
          setSelectedNode(null);
          showToast('Personne mise à jour avec succès !', 'success');
        }
      } else {
        const status = response?.status ?? 0;
        const statusText = response?.statusText ?? 'Inconnu';
        
        let responseText = '';
        try {
          responseText = await response.text();
        } catch (textError) {
          console.error('Impossible de lire le texte de la réponse:', textError);
        }
        
        let errorMessage = getErrorMessage('GENEALOGY_PERSON_UPDATE_FAILED');
        
        if (responseText) {
          if (isJson) {
            try {
              const errorData = JSON.parse(responseText);
              if (errorData.details && Array.isArray(errorData.details)) {
                const validationErrors = errorData.details
                  .map((d: { field?: string; message?: string }) => 
                    d.field ? `${d.field}: ${d.message || 'Erreur'}` : d.message || 'Erreur'
                  )
                  .join(', ');
                errorMessage = `${errorData.error || 'Erreur de validation'}: ${validationErrors}`;
              } else if (errorData.error) {
                errorMessage = errorData.error;
              } else if (errorData.message) {
                errorMessage = errorData.message;
              }
            } catch (parseError) {
              errorMessage = responseText || `Erreur ${status}: ${statusText}`;
            }
          } else {
            errorMessage = responseText;
          }
        } else {
          errorMessage = `Erreur ${status}: ${statusText}`;
        }
        
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Erreur réseau lors de la mise à jour :', error);
      const errorMsg = error instanceof Error 
        ? `Erreur réseau: ${error.message}` 
        : getErrorMessage('GENEALOGY_PERSON_UPDATE_FAILED');
      showToast(errorMsg, 'error');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setSelectedNode(null);
    setFormData({
      nom: '',
      prenom: '',
      genre: 'homme',
      description: '',
      mere: null,
      pere: null,
      ordreNaissance: 1,
      dateNaissance: '',
      dateDeces: null,
      image: null
    });
  };

  const getDefaultImage = (genre?: 'homme' | 'femme') => {
    return genre === 'femme'
      ? '/uploads/genealogie-photo/profile/female-avatar.png'
      : '/uploads/genealogie-photo/profile/male-avatar.png';
  };

  const getImage = (node: TreeNode) => {
    return node.image || getDefaultImage(node.genre);
  };

  const canEdit = (status: string) => {
    return status === 'administrateur' || status === 'redacteur';
  };

  // Handlers pour le drag/pan
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      const target = e.target as HTMLElement;
      if (target.closest('.nivo-node') || target.closest('svg')) {
        return;
      }
      
      setIsDragging(true);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDragStart({
          x: e.clientX - rect.left - translate.x,
          y: e.clientY - rect.top - translate.y
        });
      }
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setTranslate({
          x: e.clientX - rect.left - dragStart.x,
          y: e.clientY - rect.top - dragStart.y
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  if (!treeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Aucune donnée généalogique disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-100 flex">
      {/* Bouton pour ouvrir/fermer le menu */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`fixed top-1/2 ${isMenuOpen ? 'left-96' : 'left-0'} z-20 bg-white p-2 rounded-r-md shadow-md transition-all duration-300 hover:bg-gray-50`}
        aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      >
        <svg
          className={`h-6 w-6 text-gray-600 transform transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Menu latéral */}
      <div
        className={`fixed left-0 top-0 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-10 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '24rem' }}
      >
        {canEdit(userStatus) ? (
          <div className="h-full p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {isEditing ? "Modifier une personne" : "Ajouter une personne"}
              </h2>
              <div className="space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className={`px-4 py-2 rounded ${
                    !isEditing
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Ajouter
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className={`px-4 py-2 rounded ${
                    isEditing
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                  disabled={!editingId}
                >
                  Modifier
                </button>
              </div>
            </div>

            <form onSubmit={isEditing ? handleUpdate : handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Prénom</label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Si non renseigné, le nom du père sera utilisé
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Genre</label>
                <select
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                >
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                </select>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Courte)</label>
                <textarea name="description" id="description" value={formData.description} onChange={handleInputChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Père</label>
                <select
                  name="pere"
                  value={formData.pere || ''}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                >
                  <option value="">Aucun</option>
                  {persons
                    .filter(person => person.genre === 'homme')
                    .map(person => (
                      <option key={person.id} value={person.id}>
                        {person.prenom} {person.nom} (né en {new Date(person.dateNaissance).getFullYear()})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mère</label>
                <select
                  name="mere"
                  value={formData.mere || ''}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                >
                  <option value="">Aucune</option>
                  {persons
                    .filter(person => person.genre === 'femme')
                    .map(person => (
                      <option key={person.id} value={person.id}>
                        {person.prenom} {person.nom} (née en {new Date(person.dateNaissance).getFullYear()})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Photo de profil</label>
                <GenericImageUploader
                  onUploadSuccess={handleImageUploadSuccess}
                  onError={handleImageUploadError}
                  onUploadStart={() => {}}
                >
                  <button type="button" className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Choisir une image
                  </button>
                </GenericImageUploader>
                {formData.image && (
                  <div className="mt-2">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-full"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date de naissance</label>
                <input
                  type="date"
                  name="dateNaissance"
                  value={formData.dateNaissance}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date de décès</label>
                <input
                  type="date"
                  name="dateDeces"
                  value={formData.dateDeces || ''}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ordre de naissance</label>
                <input
                  type="number"
                  name="ordreNaissance"
                  value={formData.ordreNaissance}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                  min="1"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                >
                  {isEditing ? "Mettre à jour" : "Ajouter à l'arbre"}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div className="h-full p-6 overflow-y-auto">
            {selectedNode ? (
              <>
                <h2 className="text-xl font-bold mb-6">Détails de la personne</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom complet</label>
                    <p className="w-full border rounded p-2 bg-gray-50">{selectedNode.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <p className="w-full border rounded p-2 bg-gray-50">{selectedNode.description || 'Aucune description'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date de naissance</label>
                    <p className="w-full border rounded p-2 bg-gray-50">
                      {selectedNode.dateNaissance ? new Date(selectedNode.dateNaissance).toLocaleDateString() : 'Non renseignée'}
                    </p>
                  </div>
                  {selectedNode.dateDeces && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Date de décès</label>
                      <p className="w-full border rounded p-2 bg-gray-50">
                        {new Date(selectedNode.dateDeces).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedNode.image && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Photo</label>
                      <img
                        src={selectedNode.image}
                        alt={selectedNode.name}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">
                  Sélectionnez une personne pour voir ses informations
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Header */}
      <div className={`fixed top-0 right-0 bg-white shadow-md z-10 p-4 transition-all duration-300 ${
        isMenuOpen ? 'left-96' : 'left-0'
      }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Arbre Généalogique - Nivo</h1>
            <button
              onClick={refreshData}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              title="Rafraîchir les données"
            >
              🔄 Actualiser
            </button>
          </div>
          <Link href="/accueil" className="text-blue-500 hover:underline">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>

      {/* Arbre généalogique avec Nivo (rendu SVG personnalisé) */}
      <div 
        ref={containerRef}
        className={`flex-1 transition-all duration-300 ${isMenuOpen ? 'ml-96' : 'ml-0'} overflow-hidden`} 
        style={{ paddingTop: '64px' }}
        onClick={handleBackgroundClick}
        onMouseDown={handleMouseDown}
      >
        {dimensions.width > 0 && dimensions.height > 0 && treeData && (
          <NivoTreeRenderer
            data={treeData}
            width={dimensions.width}
            height={dimensions.height}
            translate={translate}
            isDragging={isDragging}
            selectedNodeId={selectedNode?.id}
            onNodeClick={handleNodeClick}
            getImage={getImage}
            getDefaultImage={getDefaultImage}
          />
        )}
      </div>
    </div>
  );
}
