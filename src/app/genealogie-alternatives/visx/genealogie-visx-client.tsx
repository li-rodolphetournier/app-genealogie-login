'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { hierarchy, HierarchyNode, HierarchyPointNode } from 'd3-hierarchy';
import { Tree } from '@visx/hierarchy';
import { Group } from '@visx/group';
import { LinkVertical } from '@visx/shape';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ToastProvider';
import { getErrorMessage } from '@/lib/errors/messages';
import GenericImageUploader from '@/components/ImageUploader';
import type { Person } from '@/types/genealogy';

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

type GenealogieVisxClientProps = {
  initialPersons: Person[];
};

const defaultMargin = { top: 40, left: 40, right: 40, bottom: 40 };

export function GenealogieVisxClient({ initialPersons }: GenealogieVisxClientProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
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
  const [translate, setTranslate] = useState({ x: 400, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  
  // États pour le drag and drop des nœuds
  const [customPositions, setCustomPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragNodeStart, setDragNodeStart] = useState({ x: 0, y: 0, nodeX: 0, nodeY: 0 });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // Charger les positions depuis Supabase au montage, puis depuis localStorage si disponible
  useEffect(() => {
    const loadPositions = async () => {
      try {
        // D'abord charger depuis Supabase (source de vérité)
        const response = await fetch('/api/genealogie/positions');
        if (response.ok) {
          const positions = await response.json();
          const positionsMap = new Map(Object.entries(positions).map(([key, value]) => [
            key,
            value as { x: number; y: number }
          ]));
          setCustomPositions(positionsMap);
          
          // Synchroniser avec localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('genealogy-node-positions', JSON.stringify(positions));
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des positions depuis Supabase:', error);
        // En cas d'erreur, charger depuis localStorage comme fallback
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('genealogy-node-positions');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              const positionsMap = new Map(Object.entries(parsed).map(([key, value]) => [
                key,
                value as { x: number; y: number }
              ]));
              setCustomPositions(positionsMap);
            } catch (e) {
              console.error('Erreur lors du chargement depuis localStorage:', e);
            }
          }
        }
      }
    };
    loadPositions();
  }, []);
  
  // Sauvegarder dans localStorage (rapide, pour modifications temporaires)
  const saveToLocalStorage = (positions: Map<string, { x: number; y: number }>) => {
    if (typeof window !== 'undefined') {
      const positionsObject = Object.fromEntries(positions);
      localStorage.setItem('genealogy-node-positions', JSON.stringify(positionsObject));
    }
  };
  
  // Fonction de sauvegarde vers Supabase (pour persistance partagée)
  const savePositionsToSupabase = async (positions: Map<string, { x: number; y: number }>) => {
    if (!canEdit(userStatus)) {
      showToast('Vous n\'avez pas les droits pour sauvegarder', 'error');
      return false;
    }
    
    setIsSaving(true);
    try {
      const positionsObject = Object.fromEntries(positions);
      const response = await fetch('/api/genealogie/positions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: positionsObject }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        throw new Error(errorData.error || 'Erreur de sauvegarde');
      }
      
      // Synchroniser localStorage après sauvegarde réussie
      saveToLocalStorage(positions);
      
      showToast('Positions sauvegardées avec succès dans Supabase', 'success');
      return true;
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      showToast(`Erreur lors de la sauvegarde: ${error.message}`, 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Fonction pour sauvegarder et rediriger vers l'accueil
  const handleSaveAndGoHome = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Sauvegarder dans Supabase avant de partir
    await savePositionsToSupabase(customPositions);
    
    // Utiliser router.push() au lieu de window.location.href pour éviter la perte de session
    // et permettre une navigation fluide avec Next.js
    router.push('/accueil');
  };

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
            // Trier par ordre de naissance
            if (a.ordreNaissance !== b.ordreNaissance) {
              return a.ordreNaissance - b.ordreNaissance;
            }
            // Si même ordre, trier par date de naissance
            const dateA = a.dateNaissance ? new Date(a.dateNaissance).getTime() : 0;
            const dateB = b.dateNaissance ? new Date(b.dateNaissance).getTime() : 0;
            return dateA - dateB;
          });

        const childNodes = children
          .map(child => buildPersonNode(child))
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
        .map(person => buildPersonNode(person))
        .filter((node): node is TreeNode => node !== null);
    };

    const roots = buildFamilyTree(persons);
    if (roots.length === 0) return null;

    // Si plusieurs racines, créer un nœud parent virtuel
    if (roots.length === 1) {
      return roots[0];
    }

    // Si aucune racine trouvée mais qu'il y a des données, utiliser la première personne comme point de départ
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

  const root = useMemo(() => {
    if (!treeData) return null;
    return hierarchy<TreeNode>(treeData);
  }, [treeData]);

  // Pour un dendrogramme vertical selon la doc Visx:
  // size={[yMax, xMax]} où yMax = hauteur verticale, xMax = largeur horizontale
  const yMax = Math.max(1200, dimensions.height - defaultMargin.top - defaultMargin.bottom);
  const xMax = Math.max(800, dimensions.width - defaultMargin.left - defaultMargin.right);

  // Handlers pour le drag/pan
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Seulement si clic gauche (bouton principal)
    if (e.button === 0) {
      const target = e.target as HTMLElement;
      // Ne pas activer le drag si on clique sur un nœud (foreignObject ou son contenu)
      if (target.closest('foreignObject') || target.tagName === 'foreignObject') {
        return;
      }
      
      setIsDragging(true);
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (svgRect) {
        setDragStart({
          x: e.clientX - svgRect.left - translate.x,
          y: e.clientY - svgRect.top - translate.y
        });
      }
      e.preventDefault();
    }
  };

  // Gérer les événements globaux pour le drag même en dehors du SVG
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggedNodeId && svgRef.current) {
        // Drag d'un nœud individuel
        const svgRect = svgRef.current.getBoundingClientRect();
        const svgX = e.clientX - svgRect.left - translate.x;
        const svgY = e.clientY - svgRect.top - translate.y;
        
        const newX = dragNodeStart.nodeX + (svgX - dragNodeStart.x);
        const newY = dragNodeStart.nodeY + (svgY - dragNodeStart.y);
        
        // Mettre à jour la position personnalisée
        setCustomPositions(prev => {
          const newMap = new Map(prev);
          newMap.set(draggedNodeId, { x: newX, y: newY });
          // Sauvegarder uniquement dans localStorage (rapide, pas de logs)
          saveToLocalStorage(newMap);
          return newMap;
        });
      } else if (isDragging && svgRef.current) {
        // Drag du pan (déplacement de la vue)
        const svgRect = svgRef.current.getBoundingClientRect();
        setTranslate({
          x: e.clientX - svgRect.left - dragStart.x,
          y: e.clientY - svgRect.top - dragStart.y
        });
      }
    };

    const handleGlobalMouseUp = () => {
      if (draggedNodeId) {
        setDraggedNodeId(null);
      }
      setIsDragging(false);
    };

    if (isDragging || draggedNodeId) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStart, draggedNodeId, dragNodeStart, translate]);

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

  const handleNodeClick = (node: { data: TreeNode }) => {
    if (node.data.id === 'root') return;
    setSelectedNode(node.data);
    const person = persons.find(p => p.id === node.data.id);
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    // Préparer les données de mise à jour en nettoyant les valeurs vides
    const updatedPerson: Person = {
      ...formData,
      id: editingId,
      image: formData.image || null,
      dateDeces: formData.dateDeces || null,
      mere: formData.mere || null,
      pere: formData.pere || null,
    };

    // Log pour debug
    console.log('Données envoyées pour mise à jour:', updatedPerson);

    try {
      const response = await fetch('/api/genealogie/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPerson),
      });

      // Vérifier le type de contenu avant de parser
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (response.ok) {
        if (isJson) {
          const result = await response.json();
          // Rafraîchir toutes les données depuis l'API pour avoir les données à jour
          await refreshData();
          setIsEditing(false);
          setEditingId(null);
          setSelectedNode(null);
          showToast(result.message || 'Personne mise à jour avec succès !', 'success');
        } else {
          // Si pas de JSON mais succès, rafraîchir quand même
          await refreshData();
          setIsEditing(false);
          setEditingId(null);
          setSelectedNode(null);
          showToast('Personne mise à jour avec succès !', 'success');
        }
      } else {
        // Gérer les erreurs - capturer les infos AVANT de lire le body
        const status = response?.status ?? 0;
        const statusText = response?.statusText ?? 'Inconnu';
        
        // Lire le texte de la réponse
        let responseText = '';
        try {
          responseText = await response.text();
        } catch (textError) {
          console.error('Impossible de lire le texte de la réponse:', textError);
          responseText = '';
        }
        
        let errorMessage = getErrorMessage('GENEALOGY_PERSON_UPDATE_FAILED');
        
        // Logger toutes les infos disponibles avec vérifications
        const errorDetails = {
          status: String(status),
          statusText: String(statusText),
          contentType: String(contentType || 'non défini'),
          hasBody: Boolean(responseText),
          bodyLength: responseText ? String(responseText.length) : '0',
          bodyPreview: responseText ? responseText.substring(0, 200) : 'vide',
          url: '/api/genealogie/update',
          method: 'PUT'
        };
        
        console.error('=== Erreur API lors de la mise à jour ===');
        console.error('Statut HTTP:', status);
        console.error('Status Text:', statusText);
        console.error('Content-Type:', contentType);
        console.error('Body présent:', !!responseText);
        console.error('Body length:', responseText?.length || 0);
        if (responseText) {
          console.error('Body preview:', responseText.substring(0, 500));
        }
        console.error('Toutes les infos:', errorDetails);
        
        if (responseText) {
          if (isJson) {
            try {
              const errorData = JSON.parse(responseText);
              console.error('Erreur API - Données parsées:', errorData);
              
              // Gérer les erreurs de validation avec détails
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
              } else {
                errorMessage = `Erreur ${status}: ${JSON.stringify(errorData)}`;
              }
            } catch (parseError) {
              console.error('Erreur lors du parsing JSON:', parseError, 'Texte reçu:', responseText);
              errorMessage = responseText || `Erreur ${status}: ${statusText || 'Erreur inconnue'}`;
            }
          } else {
            errorMessage = responseText || `Erreur ${status}: ${statusText || 'Erreur inconnue'}`;
          }
        } else {
          errorMessage = `Erreur ${status}: ${statusText || 'Erreur inconnue - réponse vide'}`;
        }
        
        console.error('Message d\'erreur final:', errorMessage);
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
    resetForm();
  };

  const resetForm = () => {
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

  if (!root) {
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
                {historyOpen ? "Historique des positions" : (isEditing ? "Modifier une personne" : "Ajouter une personne")}
              </h2>
              <div className="space-x-2">
                {!historyOpen && (
                  <>
                    <button
                       onClick={resetForm}
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
                  </>
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
            ) : !historyOpen ? (
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
            ) : null}
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
            <h1 className="text-2xl font-bold">Arbre Généalogique - Visx</h1>
            <button
              onClick={refreshData}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              title="Rafraîchir les données"
            >
              🔄 Actualiser
            </button>
            {canEdit(userStatus) && (
              <button
                onClick={() => savePositionsToSupabase(customPositions)}
                disabled={isSaving || customPositions.size === 0}
                className="px-4 py-2 text-sm bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center gap-2"
                title="Sauvegarder les positions dans Supabase (partagé avec tous les utilisateurs)"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin">⏳</span> Sauvegarde...
                  </>
                ) : (
                  <>
                    💾 Sauvegarder dans Supabase
                  </>
                )}
              </button>
            )}
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

      {/* Arbre généalogique avec Visx */}
      <div 
        className={`flex-1 transition-all duration-300 ${isMenuOpen ? 'ml-96' : 'ml-0'} overflow-hidden`} 
        style={{ paddingTop: '64px' }}
        onClick={handleBackgroundClick}
      >
        {dimensions.width > 0 && dimensions.height > 0 && root && (
          <svg 
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            style={{ display: 'block', cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
          >
            <rect width="100%" height="100%" fill="#f9fafb" />
            <Group top={translate.y} left={translate.x}>
              <Tree<TreeNode>
                root={root}
                size={[yMax, xMax]}
                nodeSize={[220, 200]}
                separation={(a, b) => {
                    // Séparation horizontale pour les enfants du même parent (frères/sœurs)
                    if (a.parent === b.parent) {
                      // Valeur élevée pour bien séparer (alice Lidl et ses 2 frères/sœurs)
                      return 1;  // Ajustez cette valeur (2.0, 2.5, 3.0) selon l'espace souhaité
                    }
                    // Pour les nœuds à différents niveaux : réduction normale
                    return 1.0 / (a.depth * 2 + 1);
                }}
              >
                {(tree) => {
                  // Fonction pour détecter et résoudre les collisions
                  const nodeWidth = 200;
                  const nodeHeight = 100;
                  const minSpacing = 30; // Espace minimum entre les nœuds
                  const coupleSpacing = 50; // Espace entre les parents d'un couple
                  
                  // Récupérer tous les nœuds (sans root)
                  const nodes = tree.descendants().filter(n => n.data.id !== 'root');
                  
                  // Identifier les couples (père et mère qui ont des enfants ensemble)
                  const couplesMap = new Map<string, { pereId: string; mereId: string }>();
                  persons.forEach(person => {
                    if (person.pere && person.mere) {
                      const coupleKey = [person.pere, person.mere].sort().join('-');
                      if (!couplesMap.has(coupleKey)) {
                        couplesMap.set(coupleKey, { 
                          pereId: person.pere, 
                          mereId: person.mere 
                        });
                      }
                    }
                  });
                  
                  // Créer un map pour trouver le partenaire d'un parent
                  const partnerMap = new Map<string, string>();
                  couplesMap.forEach((couple, key) => {
                    partnerMap.set(couple.pereId, couple.mereId);
                    partnerMap.set(couple.mereId, couple.pereId);
                  });
                  
                  // Créer une copie des positions avec les IDs pour l'ajustement
                  interface NodePosition {
                    id: string;
                    x: number;
                    y: number;
                    depth: number;
                    node: typeof nodes[0];
                  }
                  
                  const nodePositions: NodePosition[] = nodes.map(node => ({
                    id: node.data.id,
                    x: node.x || 0,
                    y: node.y || 0,
                    depth: node.depth,
                    node: node
                  }));
                  
                  // Fonction pour vérifier si deux rectangles se chevauchent
                  const rectanglesOverlap = (
                    x1: number, y1: number, w1: number, h1: number,
                    x2: number, y2: number, w2: number, h2: number
                  ): boolean => {
                    return !(x1 + w1/2 < x2 - w2/2 || 
                             x2 + w2/2 < x1 - w1/2 || 
                             y1 + h1/2 < y2 - h2/2 || 
                             y2 + h2/2 < y1 - h1/2);
                  };
                  
                  // Regrouper les couples avant la résolution des collisions
                  // Parcourir tous les niveaux de profondeur
                  for (let depth = 0; depth <= Math.max(...nodePositions.map(n => n.depth)); depth++) {
                    const nodesAtDepth = nodePositions.filter(n => n.depth === depth);
                    
                    if (nodesAtDepth.length === 0) continue;
                    
                    // Identifier et regrouper les couples
                    const processedCouples = new Set<string>();
                    nodesAtDepth.forEach(nodePos => {
                      const partnerId = partnerMap.get(nodePos.id);
                      if (partnerId && !processedCouples.has(nodePos.id) && !processedCouples.has(partnerId)) {
                        const partnerNode = nodesAtDepth.find(n => n.id === partnerId);
                        if (partnerNode) {
                          processedCouples.add(nodePos.id);
                          processedCouples.add(partnerId);
                          
                          // Positionner les parents côte à côte
                          // Identifier qui est le père et qui est la mère
                          const node1IsHomme = nodePos.node.data.genre === 'homme';
                          const pereNode = node1IsHomme ? nodePos : partnerNode;
                          const mereNode = node1IsHomme ? partnerNode : nodePos;
                          
                          // Centrer le couple autour de la position moyenne
                          const centerX = (nodePos.x + partnerNode.x) / 2;
                          
                          // Positionner le père à gauche du centre
                          pereNode.x = centerX - coupleSpacing / 2 - nodeWidth / 2;
                          // Positionner la mère à droite du centre
                          mereNode.x = centerX + coupleSpacing / 2 + nodeWidth / 2;
                        }
                      }
                    });
                  }
                  
                  // Résoudre les collisions niveau par niveau
                  // Parcourir tous les niveaux de profondeur
                  for (let depth = 0; depth <= Math.max(...nodePositions.map(n => n.depth)); depth++) {
                    const nodesAtDepth = nodePositions.filter(n => n.depth === depth);
                    
                    if (nodesAtDepth.length === 0) continue;
                    
                    // Trier par position horizontale (de gauche à droite)
                    nodesAtDepth.sort((a, b) => a.x - b.x);
                    
                    // Ajuster les positions pour éviter les chevauchements
                    // On parcourt de gauche à droite et on s'assure que chaque nœud
                    // est suffisamment espacé du précédent
                    for (let i = 1; i < nodesAtDepth.length; i++) {
                      const currentNode = nodesAtDepth[i];
                      const previousNode = nodesAtDepth[i - 1];
                      
                      // Calculer la position minimale pour le nœud actuel
                      const minX = previousNode.x + nodeWidth / 2 + minSpacing + nodeWidth / 2;
                      
                      // Si le nœud actuel est trop proche, le déplacer
                      if (currentNode.x < minX) {
                        const offset = minX - currentNode.x;
                        currentNode.x = minX;
                        
                        // Vérifier si le nœud déplacé fait partie d'un couple
                        const partnerId = partnerMap.get(currentNode.id);
                        if (partnerId) {
                          const partnerNode = nodesAtDepth.find(n => n.id === partnerId);
                          if (partnerNode && partnerNode.x < currentNode.x + nodeWidth / 2 + coupleSpacing + nodeWidth / 2) {
                            // Déplacer aussi le partenaire pour maintenir l'espacement du couple
                            partnerNode.x = currentNode.x + nodeWidth / 2 + coupleSpacing + nodeWidth / 2;
                          }
                        }
                        
                        // Déplacer aussi tous les nœuds suivants pour maintenir l'ordre
                        for (let j = i + 1; j < nodesAtDepth.length; j++) {
                          const nextNode = nodesAtDepth[j];
                          // Sauter si c'est le partenaire du nœud actuel (déjà traité)
                          if (partnerId && nextNode.id === partnerId) continue;
                          
                          const nextMinX = currentNode.x + nodeWidth / 2 + minSpacing + nodeWidth / 2;
                          if (nextNode.x < nextMinX) {
                            nextNode.x = nextMinX;
                            
                            // Si le nœud suivant fait partie d'un couple, déplacer aussi le partenaire
                            const nextPartnerId = partnerMap.get(nextNode.id);
                            if (nextPartnerId) {
                              const nextPartnerNode = nodesAtDepth.find(n => n.id === nextPartnerId);
                              if (nextPartnerNode && nextPartnerNode.x < nextNode.x + nodeWidth / 2 + coupleSpacing + nodeWidth / 2) {
                                nextPartnerNode.x = nextNode.x + nodeWidth / 2 + coupleSpacing + nodeWidth / 2;
                              }
                            }
                          } else {
                            // Si le nœud suivant est déjà bien positionné, on peut s'arrêter
                            break;
                          }
                        }
                      }
                    }
                  }
                  
                  // Vérification finale : s'assurer qu'il n'y a plus de collisions
                  // Cette étape est optionnelle mais peut être utile pour les cas complexes
                  let hasCollisions = true;
                  let finalIterations = 0;
                  const maxFinalIterations = 10;
                  
                  while (hasCollisions && finalIterations < maxFinalIterations) {
                    hasCollisions = false;
                    finalIterations++;
                    
                    for (let depth = 0; depth <= Math.max(...nodePositions.map(n => n.depth)); depth++) {
                      const nodesAtDepth = nodePositions.filter(n => n.depth === depth);
                      
                      for (let i = 0; i < nodesAtDepth.length; i++) {
                        for (let j = i + 1; j < nodesAtDepth.length; j++) {
                          const nodeA = nodesAtDepth[i];
                          const nodeB = nodesAtDepth[j];
                          
                          if (rectanglesOverlap(
                            nodeA.x, nodeA.y, nodeWidth, nodeHeight,
                            nodeB.x, nodeB.y, nodeWidth, nodeHeight
                          )) {
                            hasCollisions = true;
                            const distance = Math.abs(nodeB.x - nodeA.x);
                            const requiredDistance = nodeWidth + minSpacing;
                            
                            if (distance < requiredDistance) {
                              const offset = (requiredDistance - distance) / 2 + 5;
                              if (nodeA.x < nodeB.x) {
                                nodeA.x -= offset;
                                nodeB.x += offset;
                              } else {
                                nodeA.x += offset;
                                nodeB.x -= offset;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  
                  // Créer un map pour accéder rapidement aux positions ajustées
                  const positionMap = new Map<string, { x: number; y: number }>();
                  nodePositions.forEach(nodePos => {
                    // Utiliser la position personnalisée si elle existe, sinon la position calculée
                    const customPos = customPositions.get(nodePos.id);
                    positionMap.set(nodePos.id, customPos || { x: nodePos.x, y: nodePos.y });
                  });
                  
                  return (
                    <Group>
                      {/* Liens horizontaux entre les parents (couples) */}
                      {Array.from(couplesMap.values()).map((couple, i) => {
                        const perePos = positionMap.get(couple.pereId);
                        const merePos = positionMap.get(couple.mereId);
                        
                        if (!perePos || !merePos) return null;
                        
                        // Vérifier que les parents sont au même niveau
                        const pereNode = nodePositions.find(n => n.id === couple.pereId);
                        const mereNode = nodePositions.find(n => n.id === couple.mereId);
                        if (!pereNode || !mereNode || pereNode.depth !== mereNode.depth) return null;
                        
                        // Dessiner une ligne horizontale entre les deux parents
                        return (
                          <line
                            key={`couple-link-${couple.pereId}-${couple.mereId}-${i}`}
                            x1={perePos.x + nodeWidth / 2}
                            y1={perePos.y}
                            x2={merePos.x - nodeWidth / 2}
                            y2={merePos.y}
                            stroke="#e11d48"
                            strokeWidth="2"
                            strokeDasharray="3,3"
                            strokeOpacity={0.7}
                          />
                        );
                      })}
                      
                      {/* Liens verticaux entre parents et enfants */}
                      {(() => {
                        const links: React.ReactElement[] = [];
                        
                        // Grouper les enfants par couple de parents (père + mère)
                        const childrenByCouple = new Map<string, Person[]>();
                        const singleParentChildren = new Map<string, Person[]>();
                        
                        persons.forEach(person => {
                          if (person.pere && person.mere) {
                            // Enfant avec les deux parents
                            const coupleKey = [person.pere, person.mere].sort().join('-');
                            if (!childrenByCouple.has(coupleKey)) {
                              childrenByCouple.set(coupleKey, []);
                            }
                            childrenByCouple.get(coupleKey)!.push(person);
                          } else if (person.pere) {
                            // Enfant avec seulement le père
                            const key = `pere-${person.pere}`;
                            if (!singleParentChildren.has(key)) {
                              singleParentChildren.set(key, []);
                            }
                            singleParentChildren.get(key)!.push(person);
                          } else if (person.mere) {
                            // Enfant avec seulement la mère
                            const key = `mere-${person.mere}`;
                            if (!singleParentChildren.has(key)) {
                              singleParentChildren.set(key, []);
                            }
                            singleParentChildren.get(key)!.push(person);
                          }
                        });
                        
                        // Traiter les enfants avec les deux parents
                        childrenByCouple.forEach((children, coupleKey) => {
                          const [pereId, mereId] = coupleKey.split('-');
                          const perePos = positionMap.get(pereId);
                          const merePos = positionMap.get(mereId);
                          
                          if (!perePos || !merePos) return;
                          
                          if (children.length === 1) {
                            // Un seul enfant : les deux liens se rejoignent sur l'enfant
                            const child = children[0];
                            const childPos = positionMap.get(child.id);
                            if (!childPos) return;
                            
                            // Lien depuis le père
                            links.push(
                              <LinkVertical
                                key={`pere-link-${pereId}-${child.id}`}
                                data={{
                                  source: { x: perePos.x, y: perePos.y },
                                  target: { x: childPos.x, y: childPos.y }
                                }}
                                stroke="#2563eb"
                                strokeWidth="2"
                                fill="none"
                                strokeOpacity={0.7}
                                strokeDasharray={child.dateDeces ? "5,5" : undefined}
                              />
                            );
                            
                            // Lien depuis la mère
                            links.push(
                              <LinkVertical
                                key={`mere-link-${mereId}-${child.id}`}
                                data={{
                                  source: { x: merePos.x, y: merePos.y },
                                  target: { x: childPos.x, y: childPos.y }
                                }}
                                stroke="#ec4899"
                                strokeWidth="2"
                                fill="none"
                                strokeOpacity={0.7}
                                strokeDasharray={child.dateDeces ? "5,5" : undefined}
                              />
                            );
                          } else {
                            // Plusieurs enfants : les liens se rejoignent en un point central
                            const centerX = (perePos.x + merePos.x) / 2;
                            const centerY = perePos.y + 20; // Petit décalage en dessous de la ligne horizontale
                            
                            // Lien depuis le père vers le point central
                            links.push(
                              <LinkVertical
                                key={`pere-to-center-${coupleKey}`}
                                data={{
                                  source: { x: perePos.x, y: perePos.y },
                                  target: { x: centerX, y: centerY }
                                }}
                                stroke="#2563eb"
                                strokeWidth="2"
                                fill="none"
                                strokeOpacity={0.7}
                              />
                            );
                            
                            // Lien depuis la mère vers le point central
                            links.push(
                              <LinkVertical
                                key={`mere-to-center-${coupleKey}`}
                                data={{
                                  source: { x: merePos.x, y: merePos.y },
                                  target: { x: centerX, y: centerY }
                                }}
                                stroke="#ec4899"
                                strokeWidth="2"
                                fill="none"
                                strokeOpacity={0.7}
                              />
                            );
                            
                            // Point central (petit cercle)
                            links.push(
                              <circle
                                key={`center-point-${coupleKey}`}
                                cx={centerX}
                                cy={centerY}
                                r={3}
                                fill="#6b7280"
                              />
                            );
                            
                            // Lien depuis le point central vers chaque enfant
                            children.forEach(child => {
                              const childPos = positionMap.get(child.id);
                              if (!childPos) return;
                              
                              links.push(
                                <LinkVertical
                                  key={`center-to-child-${coupleKey}-${child.id}`}
                                  data={{
                                    source: { x: centerX, y: centerY },
                                    target: { x: childPos.x, y: childPos.y }
                                  }}
                                  stroke="#6b7280"
                                  strokeWidth="2"
                                  fill="none"
                                  strokeOpacity={0.7}
                                  strokeDasharray={child.dateDeces ? "5,5" : undefined}
                                />
                              );
                            });
                          }
                        });
                        
                        // Traiter les enfants avec un seul parent
                        singleParentChildren.forEach((children, key) => {
                          if (key.startsWith('pere-')) {
                            // Enfants avec seulement le père
                            const pereId = key.replace('pere-', '');
                            const perePos = positionMap.get(pereId);
                            
                            if (perePos) {
                              children.forEach(child => {
                                const childPos = positionMap.get(child.id);
                                if (!childPos) return;
                                
                                links.push(
                                  <LinkVertical
                                    key={`pere-link-${pereId}-${child.id}`}
                                    data={{
                                      source: { x: perePos.x, y: perePos.y },
                                      target: { x: childPos.x, y: childPos.y }
                                    }}
                                    stroke="#2563eb"
                                    strokeWidth="2"
                                    fill="none"
                                    strokeOpacity={0.7}
                                    strokeDasharray={child.dateDeces ? "5,5" : undefined}
                                  />
                                );
                              });
                            }
                          } else if (key.startsWith('mere-')) {
                            // Enfants avec seulement la mère
                            const mereId = key.replace('mere-', '');
                            const merePos = positionMap.get(mereId);
                            
                            if (merePos) {
                              children.forEach(child => {
                                const childPos = positionMap.get(child.id);
                                if (!childPos) return;
                                
                                links.push(
                                  <LinkVertical
                                    key={`mere-link-${mereId}-${child.id}`}
                                    data={{
                                      source: { x: merePos.x, y: merePos.y },
                                      target: { x: childPos.x, y: childPos.y }
                                    }}
                                    stroke="#ec4899"
                                    strokeWidth="2"
                                    fill="none"
                                    strokeOpacity={0.7}
                                    strokeDasharray={child.dateDeces ? "5,5" : undefined}
                                  />
                                );
                              });
                            }
                          }
                        });
                        
                        return links;
                      })()}
                      {/* Nœuds */}
                      {tree.descendants().map((node, i) => {
                        const nodeData = node.data;
                        if (nodeData.id === 'root') return null;
                        
                        // Utiliser les positions ajustées si disponibles
                        const adjustedPosition = positionMap.get(nodeData.id);
                        const top = adjustedPosition?.y ?? node.y ?? 0;
                        const left = adjustedPosition?.x ?? node.x ?? 0;
                        
                        const isDead = !!nodeData.dateDeces;
                        const isSelected = selectedNode?.id === nodeData.id;

                        return (
                          <Group key={`node-${nodeData.id}-${i}`} top={top} left={left}>
                          {/* Container du nœud */}
                          <foreignObject
                            width={nodeWidth}
                            height={nodeHeight}
                            x={-nodeWidth / 2}
                            y={-nodeHeight / 2}
                          >
                            <div
                              onMouseDown={(e) => {
                                // Empêcher le drag du pan si on clique sur un nœud
                                e.stopPropagation();
                                
                                // Vérifier les droits avant de permettre le drag
                                if (!canEdit(userStatus)) {
                                  e.preventDefault();
                                  return;
                                }
                                
                                // Démarrer le drag du nœud
                                if (svgRef.current && e.button === 0) {
                                  const svgRect = svgRef.current.getBoundingClientRect();
                                  const svgX = e.clientX - svgRect.left - translate.x;
                                  const svgY = e.clientY - svgRect.top - translate.y;
                                  
                                  // Utiliser la position actuelle (personnalisée ou calculée)
                                  const currentPos = adjustedPosition || { x: node.x || 0, y: node.y || 0 };
                                  
                                  setDraggedNodeId(nodeData.id);
                                  setDragNodeStart({
                                    x: svgX,
                                    y: svgY,
                                    nodeX: currentPos.x,
                                    nodeY: currentPos.y
                                  });
                                }
                              }}
                              onClick={(e) => {
                                // Empêcher le drag du pan si on clique sur un nœud
                                e.stopPropagation();
                                // Sélectionner le nœud uniquement si on n'était pas en train de le déplacer
                                if (!draggedNodeId || draggedNodeId !== nodeData.id) {
                                  handleNodeClick(node);
                                }
                              }}
                              style={{
                                width: nodeWidth,
                                height: nodeHeight,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: canEdit(userStatus) 
                                  ? (draggedNodeId === nodeData.id ? 'grabbing' : 'grab')
                                  : 'default',
                              }}
                              className={`${isDead ? 'bg-gray-300' : 'bg-white'} border-2 rounded-lg p-2 cursor-pointer transition-all hover:shadow-lg ${
                                nodeData.genre === 'homme' 
                                  ? isDead 
                                    ? 'border-blue-400' 
                                    : isSelected 
                                    ? 'border-blue-600 shadow-lg ring-2 ring-blue-300' 
                                    : 'border-blue-500'
                                  : isDead 
                                    ? 'border-pink-400' 
                                    : isSelected 
                                    ? 'border-pink-600 shadow-lg ring-2 ring-pink-300' 
                                    : 'border-pink-500'
                              } ${draggedNodeId === nodeData.id ? (nodeData.genre === 'homme' ? 'shadow-xl ring-2 ring-blue-400' : 'shadow-xl ring-2 ring-pink-400') : ''}`}
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
                        </Group>
                      );
                    })}
                    </Group>
                  );
                }}
              </Tree>
            </Group>
          </svg>
        )}
      </div>
    </div>
  );
}

