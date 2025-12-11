'use client';

import dynamic from 'next/dynamic';
import { RawNodeDatum } from 'react-d3-tree';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy loading du composant Tree (lourd ~100KB)
const Tree = dynamic(
  () => import('react-d3-tree').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Chargement de l'arbre généalogique...</div>
      </div>
    ),
  }
);

import FamilyTreeNode from '../../components/FamilyTreeNode';
import GenericImageUploader from '../../components/ImageUploader';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ToastProvider';
import { getErrorMessage } from '@/lib/errors/messages';
import type { Person } from '@/types/genealogy';

// Modifié pour être compatible avec RawNodeDatum
interface CustomNodeDatum extends Omit<RawNodeDatum, 'attributes'> {
  name: string;
  attributes: {
    id: string;
    genre: 'homme' | 'femme';
    description: string;
    detail: string | '';
    dateNaissance: string;
    dateDeces: string | '';
    ordreNaissance: number;
    image: string | '';
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

type GenealogieClientProps = {
  initialPersons: Person[];
};

export function GenealogieClient({ initialPersons }: GenealogieClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [treeData, setTreeData] = useState<CustomNodeDatum | null>(null);
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.6); // Zoom initial pour react-d3-tree
  const { user } = useAuth({
    redirectIfUnauthenticated: true,
    redirectTo: '/',
  });
  
  const userStatus = user?.status || '';
  const isAdmin = userStatus === 'administrateur';
  
  // État pour l'historique (admin seulement)
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<Array<{
    id: string;
    personId: string;
    x: number;
    y: number;
    action: string;
    updatedAt: string;
    updatedBy: { id: string; login: string; email: string } | null;
  }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const buildFamilyTree = (personsData: Person[]): CustomNodeDatum[] => {
      if (personsData.length === 0) {
        return [];
      }

      const roots = personsData.filter(p => !p.pere && !p.mere);
      const processedIds = new Set<string>();

      const buildPersonNode = (person: Person): CustomNodeDatum | null => {
        if (processedIds.has(person.id)) {
          return null;
        }

        processedIds.add(person.id);

        const children = personsData
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
            detail: '',
            dateNaissance: person.dateNaissance,
            dateDeces: person.dateDeces || '',
            ordreNaissance: person.ordreNaissance,
            image: person.image || ''
          },
          children: childNodes.length > 0 ? childNodes : undefined
        };
      };

      // Si on a des racines, construire l'arbre normalement
      if (roots.length > 0) {
        return roots
          .map(person => buildPersonNode(person))
          .filter((node): node is CustomNodeDatum => node !== null);
      }

      // Si pas de racines, construire l'arbre à partir de la première personne
      // et construire récursivement à partir d'elle
      if (personsData.length > 0) {
        const firstPerson = personsData[0];
        const node = buildPersonNode(firstPerson);
        return node ? [node] : [];
      }

      return [];
    };

    const treeDataResult = buildFamilyTree(persons);
    
    if (treeDataResult.length > 0) {
      setTreeData({
        name: "Famille",
        attributes: {
          id: "root",
          genre: 'homme' as const,
          description: 'Racine',
          detail: '',
          dateNaissance: '',
          dateDeces: '',
          ordreNaissance: 0,
          image: ''
        },
        children: treeDataResult
      });
    } else {
      // Aucune personne ou aucune donnée valide, treeData reste null
      setTreeData(null);
    }
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

  const handleImageUploadStart = () => {
    // Upload démarré
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
      id: crypto.randomUUID(),
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
        await refreshData(); // Rafraîchir toutes les données depuis l'API
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

  // Fonction pour rafraîchir les données depuis l'API
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // Recharger les personnes depuis l'API principale
      const response = await fetch('/api/genealogie');
      if (response.ok) {
        const data = await response.json();
        setPersons(data);
        showToast('Données rafraîchies avec succès', 'success');
      } else {
        showToast('Erreur lors du rafraîchissement des données', 'error');
        console.error('Erreur lors du rafraîchissement des données');
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données:', error);
      showToast('Erreur lors du rafraîchissement des données', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Charger l'historique (admin seulement)
  const loadHistory = async () => {
    if (!isAdmin) return;
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/genealogie/positions/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      } else {
        showToast('Erreur lors du chargement de l\'historique', 'error');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      showToast('Erreur lors du chargement de l\'historique', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fonction pour sauvegarder et retourner à l'accueil
  const handleSaveAndGoHome = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Utiliser router.push() au lieu de window.location.href pour éviter la perte de session
    // et permettre une navigation fluide avec Next.js
    router.push('/accueil');
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
        await refreshData(); // Rafraîchir toutes les données depuis l'API
        handleCancelEdit();
        showToast('Personne mise à jour avec succès !', 'success');
      } else {
        const error = await response.json();
        const errorMessage = error.error || error.message || getErrorMessage('GENEALOGY_PERSON_UPDATE_FAILED');
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour :', error);
      showToast(getErrorMessage('GENEALOGY_PERSON_UPDATE_FAILED'), 'error');
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Vérifier si le clic est sur l'arrière-plan (pas sur un nœud ou un élément enfant)
    const target = e.target as HTMLElement;
    // Si c'est un clic sur le conteneur div ou le SVG de base (pas sur un élément g ou foreignObject)
    if (target.tagName === 'DIV' || (target.tagName === 'svg' && !target.closest('g'))) {
      setIsMenuOpen(true);
      // Revenir au formulaire d'ajout et vider le formulaire
      handleCancelEdit();
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
    <motion.div 
      className="w-screen h-screen overflow-hidden bg-gray-100 flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
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
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed left-0 top-0 h-full bg-white shadow-lg z-10"
            style={{ width: '24rem' }}
            initial={{ x: -384 }} // -24rem
            animate={{ x: 0 }}
            exit={{ x: -384 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
        {canEdit(userStatus) ? (
          // Formulaire d'édition pour admin/rédacteur
          <div className="h-full p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4 flex-col gap-4">
              <h2 className="text-xl font-bold">
                {historyOpen ? "Historique des positions" : (isEditing ? "Modifier une personne" : "Ajouter une personne")}
              </h2>
              <div className="flex flex-wrap gap-2 w-full justify-center">
                <button
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded transition-colors flex items-center gap-2"
                  title="Rafraîchir les données depuis le serveur"
                >
                  {isRefreshing ? (
                    <>
                      <span className="animate-spin">⏳</span> Actualisation...
                    </>
                  ) : (
                    <>
                      🔄 Actualiser
                    </>
                  )}
                </button>
                {!historyOpen && isEditing && (
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Ajouter une personne
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (!historyOpen) {
                        loadHistory();
                      }
                      setHistoryOpen(!historyOpen);
                    }}
                    className={`px-4 py-2 rounded ${
                      historyOpen
                        ? 'bg-blue-500 text-white'
                        : 'bg-purple-500 text-white'
                    }`}
                  >
                    {historyOpen ? 'Fermer' : 'Historique'}
                  </button>
                )}
              </div>
            </div>

            {historyOpen && isAdmin ? (
              <div className="space-y-4">
                {loadingHistory ? (
                  <p className="text-gray-500">Chargement de l'historique...</p>
                ) : history.length === 0 ? (
                  <p className="text-gray-500">Aucun historique disponible</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => {
                      const person = persons.find(p => p.id === item.personId);
                      return (
                        <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold">
                                {person ? `${person.prenom} ${person.nom}` : `Personne ${item.personId.substring(0, 8)}...`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(item.updatedAt).toLocaleString('fr-FR')}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.action === 'created' ? 'bg-green-100 text-green-800' :
                              item.action === 'updated' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.action === 'created' ? 'Créé' : item.action === 'updated' ? 'Modifié' : 'Supprimé'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700">
                            <p>Position: X={item.x.toFixed(2)}, Y={item.y.toFixed(2)}</p>
                            {item.updatedBy && (
                              <p className="mt-1">Par: {item.updatedBy.login}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : !historyOpen && (
              <motion.form 
                onSubmit={isEditing ? handleUpdate : handleSubmit} 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                key={isEditing ? `edit-${editingId}` : 'add'}
              >
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
                  onUploadStart={handleImageUploadStart}
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
            </motion.form>
            )}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Arbre généalogique */}
      <motion.div 
        className={`flex-1 transition-all duration-300 ${isMenuOpen ? 'ml-96' : 'ml-0'}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.div 
          className={`fixed top-0 right-0 bg-white shadow-md z-10 p-4 transition-all duration-300 ${isMenuOpen ? 'left-96' : 'left-0'
          }`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Arbre Généalogique Familial</h1>
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded transition-colors flex items-center gap-2"
                title="Rafraîchir les données depuis le serveur"
              >
                {isRefreshing ? (
                  <>
                    <span className="animate-spin">⏳</span> Actualisation...
                  </>
                ) : (
                  <>
                    🔄 Actualiser
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center gap-4">
              {/* Contrôle de zoom */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.1, prev - 0.1))}
                  className="px-3 py-1 bg-white hover:bg-gray-50 rounded text-lg font-bold transition-colors"
                  title="Réduire"
                >
                  −
                </button>
                <span className="px-2 text-sm font-medium min-w-[3rem] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.1))}
                  className="px-3 py-1 bg-white hover:bg-gray-50 rounded text-lg font-bold transition-colors"
                  title="Agrandir"
                >
                  +
                </button>
              </div>
              <a 
                href="/accueil" 
                onClick={handleSaveAndGoHome}
                className="text-blue-500 hover:underline"
              >
                Retour à l&apos;accueil
              </a>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="w-full h-full pt-16" 
          onClick={handleBackgroundClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {treeData ? (
            <div 
              className="w-full h-full bg-white"
              style={{ width: '100%', height: '100%', position: 'relative', minHeight: '600px' }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                style={{ width: '100%', height: '100%' }}
              >
                <div id="tree-wrapper" style={{ width: '100%', height: '100%', minHeight: '600px' }}>
                  <Tree
                    data={treeData as unknown as RawNodeDatum}
                    renderCustomNodeElement={(rd) => (
                      <g onClick={(e) => {
                        e.stopPropagation();
                        handleNodeClick(rd.nodeDatum as unknown as CustomNodeDatum);
                        setIsMenuOpen(true);
                      }}>
                        <FamilyTreeNode nodeDatum={rd.nodeDatum as unknown as CustomNodeDatum} />
                      </g>
                    )}
                    orientation="vertical"
                    pathFunc="step"
                    translate={{ x: 400, y: 100 }}
                    separation={{ siblings: 2, nonSiblings: 2.5 }}
                    zoom={zoomLevel}
                    nodeSize={{ x: 200, y: 120 }}
                  />
                </div>
              </motion.div>
            </div>
          ) : (
            <motion.div 
              className="flex items-center justify-center h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div>
                <p>Chargement de l&apos;arbre généalogique...</p>
                <p className="text-sm text-gray-500 mt-2">
                  {persons.length === 0 ? 'Aucune donnée disponible' : `Chargement de ${persons.length} personne(s)...`}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

