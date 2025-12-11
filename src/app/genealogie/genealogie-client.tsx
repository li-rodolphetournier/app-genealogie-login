'use client';

import dynamic from 'next/dynamic';
import { RawNodeDatum } from 'react-d3-tree';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import FamilyTreeNode from '../../components/FamilyTreeNode';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ToastProvider';
import { getErrorMessage } from '@/lib/errors/messages';
import { 
  useGenealogyForm, 
  useGenealogyData, 
  useGenealogyHistory,
  useGenealogyZoom
} from '@/hooks';
import { GenealogyMenu } from '@/components/genealogy/GenealogyMenu';
import { GenealogyHeader } from '@/components/genealogy/GenealogyHeader';
import { MenuToggleButton } from '@/components/genealogy/MenuToggleButton';
import type { Person } from '@/types/genealogy';

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
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  
  const { user } = useAuth({
    redirectIfUnauthenticated: true,
    redirectTo: '/',
  });
  
  const userStatus = user?.status || '';
  const isAdmin = userStatus === 'administrateur';
  const canEditUser = userStatus === 'administrateur' || userStatus === 'redacteur';
  
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
  } = useGenealogyData(initialPersons);
  
  const {
    history,
    loadingHistory,
    historyOpen,
    toggleHistory
  } = useGenealogyHistory(isAdmin);
  
  const { zoomLevel, zoomIn, zoomOut } = useGenealogyZoom(0.6);

  const treeData = useMemo(() => {
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

      if (roots.length > 0) {
        return roots
          .map(person => buildPersonNode(person))
          .filter((node): node is CustomNodeDatum => node !== null);
      }

      if (personsData.length > 0) {
        const firstPerson = personsData[0];
        const node = buildPersonNode(firstPerson);
        return node ? [node] : [];
      }

      return [];
    };

    const treeDataResult = buildFamilyTree(persons);
    
    if (treeDataResult.length > 0) {
      return {
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
      };
    }
    
    return null;
  }, [persons]);

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
      image: formData.image
    };

    const success = await updatePerson(updatedPerson);
    if (success) {
      resetForm();
      setSelectedPersonId(null);
    }
  };

  const handleNodeClick = (nodeDatum: CustomNodeDatum) => {
    if (nodeDatum.attributes?.id === 'root') return;

    const person = persons.find(p => p.id === nodeDatum.attributes?.id);
    if (person) {
      loadPersonIntoForm(person);
      setSelectedPersonId(person.id);
      setIsMenuOpen(true);
    }
  };

  const handleSaveAndGoHome = (e?: React.MouseEvent<HTMLAnchorElement>) => {
    e?.preventDefault();
    router.push('/accueil');
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'DIV' || (target.tagName === 'svg' && !target.closest('g'))) {
      setIsMenuOpen(true);
      resetForm();
      setSelectedPersonId(null);
    }
  };

  const selectedPerson = selectedPersonId ? persons.find(p => p.id === selectedPersonId) : null;
  const selectedNode = selectedPerson ? {
    name: `${selectedPerson.prenom} ${selectedPerson.nom}`,
    description: selectedPerson.description,
    dateNaissance: selectedPerson.dateNaissance,
    dateDeces: selectedPerson.dateDeces,
    image: selectedPerson.image
  } : null;

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

      {/* Arbre généalogique */}
      <motion.div 
        className={`flex-1 transition-all duration-300 ${isMenuOpen ? 'ml-96' : 'ml-0'}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GenealogyHeader
          title="Arbre Généalogique Familial"
          isRefreshing={isRefreshing}
          isSaving={false}
          canEdit={canEditUser}
          hasPositions={false}
          zoomLevel={zoomLevel}
          onRefresh={refreshData}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onGoHome={handleSaveAndGoHome}
          isMenuOpen={isMenuOpen}
        />

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

