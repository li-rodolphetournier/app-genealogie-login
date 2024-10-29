'use client';

import { useEffect, useState } from 'react';
import Tree from 'react-d3-tree';
import Layout from '../../components/Layout';
import Link from 'next/link';
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
};

type TreeData = {
  name: string;
  attributes?: {
    genre: string;
    description: string;
    dateNaissance: string;
    ordreNaissance: number;
  };
  children?: TreeData[];
};

export default function Genealogie() {
  const [treeData, setTreeData] = useState<TreeData | null>(null);

  useEffect(() => {
    const buildFamilyTree = (persons: Person[]): TreeData[] => {
      // Trouver les personnes racines (sans parents)
      const roots = persons.filter(p => !p.pere && !p.mere);
      
      const buildPersonNode = (person: Person): TreeData => {
        // Trouver les enfants de cette personne
        const children = persons.filter(p => p.pere === person.id || p.mere === person.id);
        
        return {
          name: `${person.prenom} ${person.nom}`,
          attributes: {
            genre: person.genre,
            description: person.description,
            dateNaissance: person.dateNaissance,
            ordreNaissance: person.ordreNaissance
          },
          children: children.length > 0 ? children.map(buildPersonNode) : undefined
        };
      };

      return roots.map(buildPersonNode);
    };

    const treeDataResult = buildFamilyTree(genealogieData);
    setTreeData({ name: "Famille", children: treeDataResult });
  }, []);

  const renderCustomNode = ({ nodeDatum }: any) => (
    <g>
      <circle 
        r={25} 
        fill={nodeDatum.attributes?.genre === 'femme' ? '#FFB6C1' : '#87CEEB'} 
        stroke="#666" 
        strokeWidth={2} 
      />
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: '12px', fontWeight: 'bold' }}
      >
        {nodeDatum.name.split(' ')[0]}
      </text>
      <text
        y="40"
        textAnchor="middle"
        style={{ fontSize: '11px' }}
      >
        {nodeDatum.name.split(' ')[1]}
      </text>
      {nodeDatum.attributes && (
        <>
          <text
            y="55"
            textAnchor="middle"
            style={{ fontSize: '10px', fill: '#666' }}
          >
            {nodeDatum.attributes.description}
          </text>
          <text
            y="70"
            textAnchor="middle"
            style={{ fontSize: '10px', fill: '#666' }}
          >
            {new Date(nodeDatum.attributes.dateNaissance).getFullYear()}
          </text>
        </>
      )}
    </g>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Arbre Généalogique Familial</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg" style={{ height: '800px' }}>
          {treeData ? (
            <Tree
              data={treeData}
              renderCustomNodeElement={renderCustomNode}
              orientation="vertical"
              pathFunc="step"
              translate={{ x: 400, y: 50 }}
              separation={{ siblings: 2, nonSiblings: 2.5 }}
              zoom={0.7}
              nodeSize={{ x: 200, y: 120 }}
              enableLegacyTransitions={true}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>Chargement de l&apos;arbre généalogique...</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link href="/accueil" className="text-blue-500 hover:underline">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </Layout>
  );
} 