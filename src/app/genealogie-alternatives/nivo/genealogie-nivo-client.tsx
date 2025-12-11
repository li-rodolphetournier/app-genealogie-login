'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { hierarchy, HierarchyNode } from 'd3-hierarchy';
import { tree } from 'd3-hierarchy';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  persons: Person[];
  customPositions: Map<string, { x: number; y: number }>;
  draggedNodeId: string | null;
  onNodeMouseDown: (e: React.MouseEvent, nodeId: string, nodeX: number, nodeY: number) => void;
  canEdit: boolean;
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
  getDefaultImage,
  persons,
  customPositions,
  draggedNodeId,
  onNodeMouseDown,
  canEdit
}: NivoTreeRendererProps) {
  const root = useMemo(() => hierarchy(data), [data]);
  
  const yMax = Math.max(1200, height - defaultMargin.top - defaultMargin.bottom);
  const xMax = Math.max(800, width - defaultMargin.left - defaultMargin.right);
  
  const treeLayout = useMemo(() => {
    const t = tree<TreeNode>();
    t.size([yMax, xMax]);
    t.separation((a, b) => {
      // Séparation horizontale pour les enfants du même parent (frères/sœurs)
      if (a.parent === b.parent) {
        return 1;
      }
      // Pour les nœuds à différents niveaux : réduction normale
      return 1.0 / (a.depth * 2 + 1);
    });
    return t;
  }, [yMax, xMax]);
  
  const treeRoot = useMemo(() => {
    return treeLayout(root);
  }, [treeLayout, root]);
  
  // Fonction pour créer un chemin vertical simple
  const verticalLinkPath = (sourceX: number, sourceY: number, targetX: number, targetY: number) => {
    // Chemin vertical : ligne verticale depuis source, puis horizontale vers target
    return `M${sourceX},${sourceY}V${targetY}H${targetX}`;
  };
  
  // Fonction pour détecter et résoudre les collisions
  const nodeWidth = 200;
  const nodeHeight = 100;
  const minSpacing = 30;
  const coupleSpacing = 50;
  
  // Récupérer tous les nœuds (sans root)
  const nodes = treeRoot.descendants().filter(n => n.data.id !== 'root');
  
  // Identifier les couples
  const couplesMap = new Map<string, { pereId: string; mereId: string }>();
  persons.forEach(person => {
    if (person.pere && person.mere) {
      const coupleKey = [person.pere, person.mere].sort().join('-');
      if (!couplesMap.has(coupleKey)) {
        couplesMap.set(coupleKey, { pereId: person.pere, mereId: person.mere });
      }
    }
  });
  
  // Créer un map pour trouver le partenaire
  const partnerMap = new Map<string, string>();
  couplesMap.forEach((couple) => {
    partnerMap.set(couple.pereId, couple.mereId);
    partnerMap.set(couple.mereId, couple.pereId);
  });
  
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
  
  // Résoudre les collisions niveau par niveau (simplifié)
  for (let depth = 0; depth <= Math.max(...nodePositions.map(n => n.depth)); depth++) {
    const nodesAtDepth = nodePositions.filter(n => n.depth === depth);
    if (nodesAtDepth.length === 0) continue;
    nodesAtDepth.sort((a, b) => a.x - b.x);
    
    for (let i = 1; i < nodesAtDepth.length; i++) {
      const currentNode = nodesAtDepth[i];
      const previousNode = nodesAtDepth[i - 1];
      const minX = previousNode.x + nodeWidth / 2 + minSpacing + nodeWidth / 2;
      if (currentNode.x < minX) {
        currentNode.x = minX;
      }
    }
  }
  
  // Créer un map pour accéder rapidement aux positions ajustées
  const positionMap = new Map<string, { x: number; y: number }>();
  nodePositions.forEach(nodePos => {
    const customPos = customPositions.get(nodePos.id);
    positionMap.set(nodePos.id, customPos || { x: nodePos.x, y: nodePos.y });
  });
  
  // Grouper les enfants par couple de parents
  const childrenByCouple = new Map<string, Person[]>();
  const singleParentChildren = new Map<string, Person[]>();
  persons.forEach(person => {
    if (person.pere && person.mere) {
      const coupleKey = [person.pere, person.mere].sort().join('-');
      if (!childrenByCouple.has(coupleKey)) {
        childrenByCouple.set(coupleKey, []);
      }
      childrenByCouple.get(coupleKey)!.push(person);
    } else if (person.pere) {
      const key = `pere-${person.pere}`;
      if (!singleParentChildren.has(key)) {
        singleParentChildren.set(key, []);
      }
      singleParentChildren.get(key)!.push(person);
    } else if (person.mere) {
      const key = `mere-${person.mere}`;
      if (!singleParentChildren.has(key)) {
        singleParentChildren.set(key, []);
      }
      singleParentChildren.get(key)!.push(person);
    }
  });
  
  return (
    <svg
      width={width}
      height={height}
      style={{ display: 'block', cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <rect width="100%" height="100%" fill="#f9fafb" />
      <g transform={`translate(${defaultMargin.left + translate.x},${defaultMargin.top + translate.y})`}>
        {/* Liens horizontaux entre les parents (couples) */}
        {Array.from(couplesMap.values()).map((couple, i) => {
          const perePos = positionMap.get(couple.pereId);
          const merePos = positionMap.get(couple.mereId);
          if (!perePos || !merePos) return null;
          const pereNode = nodePositions.find(n => n.id === couple.pereId);
          const mereNode = nodePositions.find(n => n.id === couple.mereId);
          if (!pereNode || !mereNode || pereNode.depth !== mereNode.depth) return null;
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
                <path
                  key={`pere-link-${pereId}-${child.id}`}
                  d={verticalLinkPath(perePos.x, perePos.y, childPos.x, childPos.y)}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeOpacity={0.7}
                  strokeDasharray={child.dateDeces ? "5,5" : undefined}
                />
              );
              
              // Lien depuis la mère
              links.push(
                <path
                  key={`mere-link-${mereId}-${child.id}`}
                  d={verticalLinkPath(merePos.x, merePos.y, childPos.x, childPos.y)}
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="2"
                  strokeOpacity={0.7}
                  strokeDasharray={child.dateDeces ? "5,5" : undefined}
                />
              );
            } else {
              // Plusieurs enfants : les liens se rejoignent en un point central
              const centerX = (perePos.x + merePos.x) / 2;
              const centerY = perePos.y + 20;
              
              // Lien depuis le père vers le point central
              links.push(
                <path
                  key={`pere-to-center-${coupleKey}`}
                  d={verticalLinkPath(perePos.x, perePos.y, centerX, centerY)}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeOpacity={0.7}
                />
              );
              
              // Lien depuis la mère vers le point central
              links.push(
                <path
                  key={`mere-to-center-${coupleKey}`}
                  d={verticalLinkPath(merePos.x, merePos.y, centerX, centerY)}
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="2"
                  strokeOpacity={0.7}
                />
              );
              
              // Point central
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
                  <path
                    key={`center-to-child-${coupleKey}-${child.id}`}
                    d={verticalLinkPath(centerX, centerY, childPos.x, childPos.y)}
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="2"
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
              const pereId = key.replace('pere-', '');
              const perePos = positionMap.get(pereId);
              if (perePos) {
                children.forEach(child => {
                  const childPos = positionMap.get(child.id);
                  if (!childPos) return;
                  links.push(
                    <path
                      key={`pere-link-${pereId}-${child.id}`}
                      d={verticalLinkPath(perePos.x, perePos.y, childPos.x, childPos.y)}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2"
                      strokeOpacity={0.7}
                      strokeDasharray={child.dateDeces ? "5,5" : undefined}
                    />
                  );
                });
              }
            } else if (key.startsWith('mere-')) {
              const mereId = key.replace('mere-', '');
              const merePos = positionMap.get(mereId);
              if (merePos) {
                children.forEach(child => {
                  const childPos = positionMap.get(child.id);
                  if (!childPos) return;
                  links.push(
                    <path
                      key={`mere-link-${mereId}-${child.id}`}
                      d={verticalLinkPath(merePos.x, merePos.y, childPos.x, childPos.y)}
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="2"
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
        {treeRoot.descendants().map((node, i) => {
          const nodeData = node.data;
          if (nodeData.id === 'root') return null;
          
          // Utiliser les positions ajustées si disponibles
          const adjustedPosition = positionMap.get(nodeData.id);
          const top = adjustedPosition?.y ?? node.y ?? 0;
          const left = adjustedPosition?.x ?? node.x ?? 0;
          
          const isDead = !!nodeData.dateDeces;
          const isSelected = selectedNodeId === nodeData.id;
          
          // Couleurs inspirées de Nivo avec genre
          const borderColor = isDead 
            ? (nodeData.genre === 'homme' ? '#93c5fd' : '#f9a8d4')
            : isSelected 
            ? '#7c3aed'
            : (nodeData.genre === 'homme' ? '#3b82f6' : '#ec4899');
          
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
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (!canEdit) {
                      e.preventDefault();
                      return;
                    }
                    if (e.button === 0) {
                      onNodeMouseDown(e, nodeData.id, left, top);
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!draggedNodeId || draggedNodeId !== nodeData.id) {
                      onNodeClick(nodeData);
                    }
                  }}
                  className={`${isDead ? 'bg-gray-300' : 'bg-white'} border-2 rounded-lg p-2 cursor-pointer transition-all hover:shadow-xl ${
                    nodeData.genre === 'homme' 
                      ? isDead 
                        ? 'border-blue-400' 
                        : isSelected 
                        ? 'border-blue-600 shadow-xl ring-2 ring-blue-300' 
                        : 'border-blue-500'
                      : isDead 
                        ? 'border-pink-400' 
                        : isSelected 
                        ? 'border-pink-600 shadow-xl ring-2 ring-pink-300' 
                        : 'border-pink-500'
                  } ${draggedNodeId === nodeData.id ? (nodeData.genre === 'homme' ? 'shadow-xl ring-2 ring-blue-400' : 'shadow-xl ring-2 ring-pink-400') : ''}`}
                  style={{
                    width: nodeWidth,
                    height: nodeHeight,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderColor: borderColor,
                    cursor: canEdit 
                      ? (draggedNodeId === nodeData.id ? 'grabbing' : 'grab')
                      : 'default',
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
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
            localStorage.setItem('genealogy-node-positions-nivo', JSON.stringify(positions));
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des positions depuis Supabase:', error);
        // En cas d'erreur, charger depuis localStorage comme fallback
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('genealogy-node-positions-nivo');
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
      localStorage.setItem('genealogy-node-positions-nivo', JSON.stringify(positionsObject));
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
    setIsRefreshing(true);
    try {
      // Recharger les personnes depuis l'API
      const response = await fetch('/api/genealogie-alternatives');
      if (response.ok) {
        const data = await response.json();
        setPersons(data);
      } else {
        showToast('Erreur lors du rafraîchissement des données', 'error');
        console.error('Erreur lors du rafraîchissement des données');
        setIsRefreshing(false);
        return;
      }

      // Recharger les positions depuis Supabase
      try {
        const positionsResponse = await fetch('/api/genealogie/positions');
        if (positionsResponse.ok) {
          const positions = await positionsResponse.json();
          const positionsMap = new Map(Object.entries(positions).map(([key, value]) => [
            key,
            value as { x: number; y: number }
          ]));
          setCustomPositions(positionsMap);
          
          // Synchroniser avec localStorage
          saveToLocalStorage(positionsMap);
        }
      } catch (positionsError) {
        console.error('Erreur lors du rafraîchissement des positions:', positionsError);
        // Ne pas bloquer si les positions ne peuvent pas être rechargées
      }

      showToast('Données rafraîchies avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données:', error);
      showToast('Erreur lors du rafraîchissement des données', 'error');
    } finally {
      setIsRefreshing(false);
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
            <div className="flex justify-between items-center mb-4 flex-col">
              <h2 className="text-xl font-bold">
                {historyOpen ? "Historique des positions" : (isEditing ? "Modifier une personne" : "Ajouter une personne")}
              </h2>
              <div className="space-x-2">
                {!historyOpen && (
                  <>
                    <button
                      onClick={() => {
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
                      }}
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
            <h1 className="text-2xl font-bold">Arbre Généalogique - Nivo</h1>
            <button
              onClick={refreshData}
              disabled={isRefreshing || isSaving}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded transition-colors flex items-center gap-2"
              title="Rafraîchir les données et les positions depuis le serveur"
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

      {/* Arbre généalogique avec Nivo (rendu SVG personnalisé) */}
      <div 
        className={`flex-1 transition-all duration-300 ${isMenuOpen ? 'ml-96' : 'ml-0'} overflow-hidden`} 
        style={{ paddingTop: '64px' }}
        onClick={handleBackgroundClick}
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
            persons={persons}
            customPositions={customPositions}
            draggedNodeId={draggedNodeId}
            onNodeMouseDown={(e, nodeId, nodeX, nodeY) => {
              if (svgRef.current && e.button === 0) {
                const svgRect = svgRef.current.getBoundingClientRect();
                const svgX = e.clientX - svgRect.left - translate.x;
                const svgY = e.clientY - svgRect.top - translate.y;
                setDraggedNodeId(nodeId);
                setDragNodeStart({
                  x: svgX,
                  y: svgY,
                  nodeX,
                  nodeY
                });
              }
            }}
            canEdit={canEdit(userStatus)}
          />
        )}
      </div>
      {/* SVG ref pour le drag global */}
      <svg ref={svgRef} style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} />
    </div>
  );
}
