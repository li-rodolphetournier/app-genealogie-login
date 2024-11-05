import React from 'react';

type NodeDatum = {
  name: string;
  attributes?: {
    genre: 'homme' | 'femme';
    description: string;
    dateNaissance: string;
    dateDeces: string | null;
    ordreNaissance: number;
    image: string | null;
  };
};

type FamilyTreeNodeProps = {
  nodeDatum: NodeDatum;
};

const FamilyTreeNode: React.FC<FamilyTreeNodeProps> = ({ nodeDatum }) => {
  // Image par défaut selon le genre
  const getDefaultImage = (genre?: 'homme' | 'femme') => {
    return genre === 'femme' 
      ? '/uploads/genealogie-photo/profile/female-avatar.png' 
      : '/uploads/genealogie-photo/profile/male-avatar.png';
  };

  const getImage = () => {
    if (nodeDatum.attributes?.image) {
      return nodeDatum.attributes.image;
    }
    return getDefaultImage(nodeDatum.attributes?.genre);
  };

  const opacity = nodeDatum.attributes?.dateDeces ? '0.7' : '1';

  return (
    <g>
      <circle 
        r={30} 
        fill="white" 
        stroke={nodeDatum.attributes?.dateDeces ? '#999' : '#666'} 
        strokeWidth={2}
      />
      
      <image
        href={getImage()}
        x="-25"
        y="-25"
        width="50"
        height="50"
        clipPath="circle(25px at center)"
        style={{ opacity }}
        preserveAspectRatio="xMidYMid slice"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.setAttribute('href', getDefaultImage(nodeDatum.attributes?.genre));
        }}
      />

      <text
        y="45"
        textAnchor="middle"
        style={{ 
          fontSize: '12px', 
          fontWeight: 'bold',
          fill: nodeDatum.attributes?.dateDeces ? '#666' : '#000'
        }}
      >
        {nodeDatum.name}
      </text>

      <text
        y="60"
        textAnchor="middle"
        style={{ fontSize: '10px', fill: '#666' }}
      >
        {nodeDatum.attributes?.dateNaissance && new Date(nodeDatum.attributes.dateNaissance).getFullYear()}
        {nodeDatum.attributes?.dateDeces && ` - ${new Date(nodeDatum.attributes.dateDeces).getFullYear()}`}
      </text>
    </g>
  );
};

export default FamilyTreeNode;