'use client';

import { useMemo, useRef, useState } from 'react';
import { hierarchy } from 'd3-hierarchy';
import { Tree } from '@visx/hierarchy';
import { Group } from '@visx/group';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ToastProvider';
import { getErrorMessage } from '@/lib/errors/messages';
import { 
  useGenealogyForm, 
  useGenealogyData, 
  useGenealogyHistory,
  useGenealogyZoom,
  useGenealogyDimensions,
  useGenealogyTree,
  useGenealogyPositions,
  useGenealogyDrag,
  type TreeNode
} from '@/hooks';
import { GenealogyMenu } from '@/components/genealogy/GenealogyMenu';
import { GenealogyHeader } from '@/components/genealogy/GenealogyHeader';
import { MenuToggleButton } from '@/components/genealogy/MenuToggleButton';
import { TreeLinksRenderer } from '@/components/genealogy/TreeLinksRenderer';
import { TreeNodeRenderer } from '@/components/genealogy/TreeNodeRenderer';
import { 
  getDefaultImage, 
  canEdit, 
  identifyCouples, 
  createPartnerMap,
  groupChildrenByParents,
  resolveCollisions,
  type Position
} from '@/utils/genealogy-tree-utils';
import type { Person } from '@/types/genealogy';

type GenealogieVisxClientProps = {
  initialPersons: Person[];
};

const defaultMargin = { top: 40, left: 40, right: 40, bottom: 40 };

export function GenealogieVisxClient({ initialPersons }: GenealogieVisxClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [translate, setTranslate] = useState({ x: 400, y: 100 });
  const svgRef = useRef<SVGSVGElement>(null);
  
  const { user } = useAuth({
    redirectIfUnauthenticated: true,
    redirectTo: '/',
  });
  
  const userStatus = user?.status || '';
  const isAdmin = userStatus === 'administrateur';
  const canEditUser = canEdit(userStatus);
  
  // Hooks personnalisés
  const {
    formData,
    isEditing,
    editingId,
    handleInputChange,
    handleImageUploadSuccess,
    resetForm,
    loadPersonIntoForm
  } = useGenealogyForm();
  
  const {
    persons,
    isRefreshing,
    refreshData,
    addPerson,
    updatePerson
  } = useGenealogyData(initialPersons, '/api/genealogie-alternatives');
  
  const {
    history,
    loadingHistory,
    historyOpen,
    toggleHistory
  } = useGenealogyHistory(isAdmin);
  
  const { zoomLevel, zoomIn, zoomOut } = useGenealogyZoom(1.0);
  const dimensions = useGenealogyDimensions(isMenuOpen);
  
  const {
    customPositions,
    setCustomPositions,
    isSaving,
    saveToLocalStorage,
    savePositionsToSupabase,
    loadPositions
  } = useGenealogyPositions('genealogy-node-positions', canEditUser);
  
  const {
    isDragging,
    draggedNodeId,
    handleMouseDown,
    handleNodeMouseDown
  } = useGenealogyDrag(
    svgRef,
    translate,
    (nodeId, position) => {
      setCustomPositions(prev => {
        const newMap = new Map(prev);
        newMap.set(nodeId, position);
        saveToLocalStorage(newMap);
        return newMap;
      });
    },
    setTranslate
  );
  
  const treeData = useGenealogyTree(persons);
  
  const root = useMemo(() => {
    if (!treeData) return null;
    return hierarchy<TreeNode>(treeData);
  }, [treeData]);

  const yMax = Math.max(1200, dimensions.height - defaultMargin.top - defaultMargin.bottom);
  const xMax = Math.max(800, dimensions.width - defaultMargin.left - defaultMargin.right);

  const handleImageUploadError = (errorMessage: string) => {
    console.error("Upload error:", errorMessage);
    showToast(getErrorMessage('FILE_UPLOAD_FAILED'), 'error');
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

    const success = await addPerson(newPerson);
    if (success) {
      resetForm();
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

    const success = await updatePerson(updatedPerson);
    if (success) {
      resetForm();
      setSelectedNodeId(null);
    }
  };

  const handleNodeClick = (node: TreeNode) => {
    if (node.id === 'root') return;
    const person = persons.find(p => p.id === node.id);
    if (person) {
      loadPersonIntoForm(person);
      setSelectedNodeId(node.id);
      setIsMenuOpen(true);
    }
  };

  const handleSaveAndGoHome = (e?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e?.preventDefault();
    savePositionsToSupabase(customPositions);
    router.push('/accueil');
  };

  const handleBackgroundClick = () => {
    resetForm();
    setSelectedNodeId(null);
  };

  const getImage = (node: TreeNode) => {
    return node.image || getDefaultImage(node.genre);
  };

  const selectedPerson = selectedNodeId ? persons.find(p => p.id === selectedNodeId) : null;
  const selectedNode = selectedPerson ? {
    name: `${selectedPerson.prenom} ${selectedPerson.nom}`,
    description: selectedPerson.description,
    dateNaissance: selectedPerson.dateNaissance,
    dateDeces: selectedPerson.dateDeces,
    image: selectedPerson.image
  } : null;

  if (!root) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Aucune donnée généalogique disponible</p>
        </div>
      </div>
    );
  }

  // Préparer les données pour le rendu
  const couplesMap = identifyCouples(persons);
  const partnerMap = createPartnerMap(couplesMap);
  const { childrenByCouple, singleParentChildren } = groupChildrenByParents(persons);

  return (
    <motion.div 
      className="w-screen h-screen overflow-hidden bg-gray-100 flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <MenuToggleButton 
        isOpen={isMenuOpen} 
        onToggle={() => setIsMenuOpen(!isMenuOpen)} 
      />

      <GenealogyMenu
        isOpen={isMenuOpen}
        canEdit={canEditUser}
        isEditing={isEditing}
        historyOpen={historyOpen}
        loadingHistory={loadingHistory}
        history={history}
        formData={formData}
        persons={persons}
        selectedNode={selectedNode}
        onInputChange={handleInputChange}
        onImageUploadSuccess={handleImageUploadSuccess}
        onImageUploadError={handleImageUploadError}
        onSubmit={isEditing ? handleUpdate : handleSubmit}
        onCancel={resetForm}
        onToggleHistory={isAdmin ? toggleHistory : undefined}
      />

      <motion.div 
        className={`flex-1 transition-all duration-300 ${isMenuOpen ? 'ml-96' : 'ml-0'} overflow-hidden`} 
        style={{ paddingTop: '64px' }}
        onClick={handleBackgroundClick}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GenealogyHeader
          title="Arbre Généalogique - Visx"
          isRefreshing={isRefreshing}
          isSaving={isSaving}
          canEdit={canEditUser}
          hasPositions={customPositions.size > 0}
          zoomLevel={zoomLevel}
          onRefresh={refreshData}
          onSavePositions={() => savePositionsToSupabase(customPositions)}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onGoHome={handleSaveAndGoHome}
          isMenuOpen={isMenuOpen}
        />

        {dimensions.width > 0 && dimensions.height > 0 && root && (
          <svg 
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            style={{ display: 'block', cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
          >
            <rect width="100%" height="100%" fill="#f9fafb" />
            <g transform={`translate(${translate.x}, ${translate.y}) scale(${zoomLevel})`}>
              <Group top={0} left={0}>
                <Tree<TreeNode>
                  root={root}
                  size={[yMax, xMax]}
                  nodeSize={[220, 200]}
                  separation={(a, b) => {
                    if (a.parent === b.parent) {
                      return 1;
                    }
                    return 1.0 / (a.depth * 2 + 1);
                  }}
                >
                  {(tree) => {
                    const nodeWidth = 200;
                    const nodeHeight = 100;
                    const minSpacing = 30;
                    const coupleSpacing = 50;
                    
                    const nodes = tree.descendants().filter(n => n.data.id !== 'root');
                    
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
                    
                    // Regrouper les couples
                    for (let depth = 0; depth <= Math.max(...nodePositions.map(n => n.depth)); depth++) {
                      const nodesAtDepth = nodePositions.filter(n => n.depth === depth);
                      if (nodesAtDepth.length === 0) continue;
                      
                      const processedCouples = new Set<string>();
                      nodesAtDepth.forEach(nodePos => {
                        const partnerId = partnerMap.get(nodePos.id);
                        if (partnerId && !processedCouples.has(nodePos.id) && !processedCouples.has(partnerId)) {
                          const partnerNode = nodesAtDepth.find(n => n.id === partnerId);
                          if (partnerNode) {
                            processedCouples.add(nodePos.id);
                            processedCouples.add(partnerId);
                            
                            const node1IsHomme = nodePos.node.data.genre === 'homme';
                            const pereNode = node1IsHomme ? nodePos : partnerNode;
                            const mereNode = node1IsHomme ? partnerNode : nodePos;
                            
                            const centerX = (nodePos.x + partnerNode.x) / 2;
                            pereNode.x = centerX - coupleSpacing / 2 - nodeWidth / 2;
                            mereNode.x = centerX + coupleSpacing / 2 + nodeWidth / 2;
                          }
                        }
                      });
                    }
                    
                    resolveCollisions(nodePositions, nodeWidth, minSpacing, coupleSpacing, partnerMap);
                    
                    const positionMap = new Map<string, Position>();
                    nodePositions.forEach(nodePos => {
                      const customPos = customPositions.get(nodePos.id);
                      positionMap.set(nodePos.id, customPos || { x: nodePos.x, y: nodePos.y });
                    });
                    
                    return (
                      <Group>
                        <TreeLinksRenderer
                          persons={persons}
                          positionMap={positionMap}
                          nodeWidth={nodeWidth}
                          couplesMap={couplesMap}
                          childrenByCouple={childrenByCouple}
                          singleParentChildren={singleParentChildren}
                          useVisx={true}
                        />
                        
                        {tree.descendants().map((node, i) => {
                          const nodeData = node.data;
                          if (nodeData.id === 'root') return null;
                          
                          const adjustedPosition = positionMap.get(nodeData.id);
                          const top = adjustedPosition?.y ?? node.y ?? 0;
                          const left = adjustedPosition?.x ?? node.x ?? 0;
                          
                          const isDead = !!nodeData.dateDeces;
                          const isSelected = selectedNodeId === nodeData.id;

                          return (
                            <TreeNodeRenderer
                              key={`node-${nodeData.id}-${i}`}
                              node={nodeData}
                              x={left}
                              y={top}
                              nodeWidth={nodeWidth}
                              nodeHeight={nodeHeight}
                              isDead={isDead}
                              isSelected={isSelected}
                              isDragging={isDragging}
                              canEdit={canEditUser}
                              draggedNodeId={draggedNodeId}
                              onNodeMouseDown={handleNodeMouseDown}
                              onNodeClick={handleNodeClick}
                              getImage={getImage}
                              style="default"
                            />
                          );
                        })}
                      </Group>
                    );
                  }}
                </Tree>
              </Group>
            </g>
          </svg>
        )}
      </motion.div>
    </motion.div>
  );
}

