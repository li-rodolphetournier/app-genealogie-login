'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Tree from 'react-d3-tree';
import { RawNodeDatum } from 'react-d3-tree';
import FamilyTreeNode from '../../components/FamilyTreeNode';
import ImageUploader from '../../components/ImageUploader';
import genealogieData from '../../data/genealogie.json';

type Person = {
  id: string;
  nom: string;
  prenom: string;
  genre: 'homme' | 'femme';
  description: string;
  mere: string | null;
  pere: string | null;
  ordreNaissance: number;
  dateNaissance: string;
  dateDeces: string | null;
  image: string | null;
};

// Modifié pour être compatible avec RawNodeDatum
interface CustomNodeDatum extends RawNodeDatum {
  name: string;
  attributes: {
    id: string;
    genre: 'homme' | 'femme';
    description: string;
    dateNaissance: string;
    dateDeces: string | null;
    ordreNaissance: number;
    image: string | null;
  };
  children?: CustomNodeDatum[];
}

type RenderCustomNodeProps = {
  nodeDatum: CustomNodeDatum;
  foreignObjectProps?: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
};

export default function Genealogie() {
  const router = useRouter();
  const [treeData, setTreeData] = useState<CustomNodeDatum | null>(null);
  const [persons, setPersons] = useState<Person[]>(() =>
    genealogieData.map(person => ({
      ...person,
      genre: person.genre as 'homme' | 'femme'
    }))
  );
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
  const [userStatus, setUserStatus] = useState<string>('');

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      router.push('/');
      return;
    }

    const { status } = JSON.parse(currentUser);
    setUserStatus(status);
  }, [router]);

  useEffect(() => {
    const buildFamilyTree = (persons: Person[]): CustomNodeDatum[] => {
      const roots = persons.filter(p => !p.pere && !p.mere);
      const processedIds = new Set<string>();

      const buildPersonNode = (person: Person): CustomNodeDatum | null => {
        if (processedIds.has(person.id)) {
          return null;
        }

        processedIds.add(person.id);

        const children = persons
          .filter(p => (p.pere === person.id || p.mere === person.id))
          .sort((a, b) => a.ordreNaissance - b.ordreNaissance);

        const childNodes = children
          .map(child => buildPersonNode(child))
          .filter((node): node is CustomNodeDatum => node !== null);

        return {
          name: `${person.prenom} ${person.nom}`,
          attributes: {
            id: person.id,
            genre: person.genre,
            description: person.description,
            dateNaissance: person.dateNaissance,
            dateDeces: person.dateDeces,
            ordreNaissance: person.ordreNaissance,
            image: person.image
          },
          children: childNodes.length > 0 ? childNodes : undefined
        };
      };

      return roots
        .map(person => buildPersonNode(person))
        .filter((node): node is CustomNodeDatum => node !== null);
    };

    const treeDataResult = buildFamilyTree(persons);
    if (treeDataResult.length > 0) {
      setTreeData({
        name: "Famille",
        attributes: {
          id: "root",
          genre: 'homme',
          description: 'Racine',
          dateNaissance: '',
          dateDeces: null,
          ordreNaissance: 0,
          image: null
        },
        children: treeDataResult
      });
    }
  }, [persons]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
  };

  const handleImageUpload = async (imageUrls: string[]) => {
    if (imageUrls.length > 0) {
      const imageUrl = imageUrls[0];
      console.log('Image URL reçue:', imageUrl);

      setFormData(prev => ({
        ...prev,
        image: imageUrl
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nom && formData.pere) {
      const pereNode = persons.find(p => p.id === formData.pere);
      if (pereNode?.nom) {
        formData.nom = pereNode.nom;
      }
    }

    const newPerson: Person = {
      ...formData,
      id: Date.now().toString(),
      image: formData.image
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
        setPersons(prev => [...prev, newPerson]);
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
        alert('Personne ajoutée avec succès !');
      } else {
        const error = await response.json();
        alert(`Erreur lors de l'ajout : ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout :', error);
      alert('Erreur lors de l\'ajout de la personne');
    }
  };

  const handleNodeClick = (nodeDatum: CustomNodeDatum) => {
    if (nodeDatum.attributes?.id === 'root') return;

    const person = persons.find(p => p.id === nodeDatum.attributes?.id);
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
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    const updatedPerson: Person = {
      ...formData,
      id: editingId,
      image: formData.image
    };

    try {
      const response = await fetch('/api/genealogie/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPerson),
      });

      if (response.ok) {
        setPersons(prev =>
          prev.map(p => p.id === editingId ? updatedPerson : p)
        );
        handleCancelEdit();
        alert('Personne mise à jour avec succès !');
      } else {
        const error = await response.json();
        alert(`Erreur lors de la mise à jour : ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour :', error);
      alert('Erreur lors de la mise à jour de la personne');
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Vérifier si le clic est sur l'arrière-plan (pas sur un nœud)
    if ((e.target as SVGElement).tagName === 'svg') {
      setIsMenuOpen(false);
    }
  };

  // Fonction pour vérifier si l'utilisateur peut modifier
  const canEdit = (status: string) => {
    return status === 'administrateur' || status === 'redacteur';
  };

  // Fonction pour afficher les informations en lecture seule
  const renderReadOnlyInfo = (person: Person) => (
    <div className="h-full p-6 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6">Détails de la personne</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Prénom</label>
          <p className="w-full border rounded p-2 bg-gray-50">{person.prenom}</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nom</label>
          <p className="w-full border rounded p-2 bg-gray-50">{person.nom}</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Genre</label>
          <p className="w-full border rounded p-2 bg-gray-50">{person.genre}</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <p className="w-full border rounded p-2 bg-gray-50">{person.description || 'Aucune description'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date de naissance</label>
          <p className="w-full border rounded p-2 bg-gray-50">
            {new Date(person.dateNaissance).toLocaleDateString()}
          </p>
        </div>
        {person.dateDeces && (
          <div>
            <label className="block text-sm font-medium mb-1">Date de décès</label>
            <p className="w-full border rounded p-2 bg-gray-50">
              {new Date(person.dateDeces).toLocaleDateString()}
            </p>
          </div>
        )}
        {person.image && (
          <div>
            <label className="block text-sm font-medium mb-1">Photo</label>
            <img
              src={person.image}
              alt={`Photo de ${person.prenom} ${person.nom}`}
              className="w-32 h-32 object-cover rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-100 flex">
      {/* Bouton pour ouvrir/fermer le menu - pour tout le monde */}
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

      {/* Menu latéral avec animation - contenu différent selon le statut */}
      <div
        className={`fixed left-0 top-0 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-10 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        style={{ width: '24rem' }}
      >
        {canEdit(userStatus) ? (
          // Formulaire d'édition pour admin/rédacteur
          <div className="h-full p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {isEditing ? "Modifier une personne" : "Ajouter une personne"}
              </h2>
              <div className="space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className={`px-4 py-2 rounded ${!isEditing
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                    }`}
                >
                  Ajouter
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className={`px-4 py-2 rounded ${isEditing
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                    }`}
                  disabled={!editingId}
                >
                  Modifier
                </button>
              </div>
            </div>

            {/* Formulaire existant */}
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
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                />
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
                <ImageUploader onUpload={handleImageUpload} type="genealogie" />
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
                  {isEditing ? "Mettre à jour" : "Ajouter à l&apos;arbre"}
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
          // Vue en lecture seule pour utilisateur
          editingId ? renderReadOnlyInfo(persons.find(p => p.id === editingId)!) : (
            <div className="h-full p-6 flex items-center justify-center">
              <p className="text-gray-500">
                Sélectionnez une personne pour voir ses informations
              </p>
            </div>
          )
        )}
      </div>

      {/* Arbre généalogique */}
      <div className={`flex-1 transition-all duration-300 ${isMenuOpen ? 'ml-96' : 'ml-0'}`}>
        <div className={`fixed top-0 right-0 bg-white shadow-md z-10 p-4 transition-all duration-300 ${isMenuOpen ? 'left-96' : 'left-0'
          }`}>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Arbre Généalogique Familial</h1>
            <Link href="/accueil" className="text-blue-500 hover:underline">
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>

        <div className="w-full h-full pt-16" onClick={handleBackgroundClick}>
          {treeData ? (
            <div className="w-full h-full bg-white">
              <Tree
                data={treeData as RawNodeDatum}
                renderCustomNodeElement={(rd) => (
                  <g onClick={() => {
                    handleNodeClick(rd.nodeDatum as CustomNodeDatum);
                    setIsMenuOpen(true);
                  }}>
                    <FamilyTreeNode nodeDatum={rd.nodeDatum as CustomNodeDatum} />
                  </g>
                )}
                orientation="vertical"
                pathFunc="step"
                translate={{ x: 400, y: 100 }}
                separation={{ siblings: 2, nonSiblings: 2.5 }}
                zoom={0.6}
                nodeSize={{ x: 200, y: 120 }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>Chargement de l&apos;arbre généalogique...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 