import React, { memo } from 'react';

type NodeDatum = {
  name: string;
  attributes?: {
    genre: 'homme' | 'femme';
    description: string;
    detail?: string;
    dateNaissance: string;
    dateDeces: string | null;
    ordreNaissance: number;
    image: string | null;
  };
};

type FamilyTreeNodeProps = {
  nodeDatum: NodeDatum;
  foreignObjectProps?: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
  onNodeClick?: (node: NodeDatum) => void;
};

const foreignObjectWidth = 250;
const foreignObjectHeight = 100;

const FamilyTreeNode: React.FC<FamilyTreeNodeProps> = memo(({ nodeDatum, foreignObjectProps, onNodeClick }) => {
  const foProps = {
    width: foreignObjectWidth,
    height: foreignObjectHeight,
    x: -foreignObjectWidth / 2,
    y: -foreignObjectHeight / 2,
    ...foreignObjectProps,
  };

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

  const opacity = nodeDatum.attributes?.dateDeces ? 0.7 : 1;

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(nodeDatum);
    }
  };

  return (
    <g onClick={handleClick} style={{ cursor: onNodeClick ? 'pointer' : 'default' }}>
      <foreignObject {...foProps}>
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            border: `2px solid ${nodeDatum.attributes?.dateDeces ? '#ccc' : '#888'}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            padding: '10px',
            boxSizing: 'border-box',
            opacity: opacity,
          }}
        >
          <img
            src={getImage()}
            alt={nodeDatum.name}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              objectFit: 'cover',
              marginRight: '10px',
              flexShrink: 0,
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = getDefaultImage(nodeDatum.attributes?.genre);
            }}
          />
          <div style={{ overflow: 'hidden', fontSize: '12px', lineHeight: '1.3' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nodeDatum.name}
            </div>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>
              {nodeDatum.attributes?.dateNaissance && new Date(nodeDatum.attributes.dateNaissance).getFullYear()}
              {nodeDatum.attributes?.dateDeces && ` - ${new Date(nodeDatum.attributes.dateDeces).getFullYear()}`}
            </div>
            {nodeDatum.attributes?.description && (
              <div style={{ fontSize: '10px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {nodeDatum.attributes.description}
              </div>
            )}
            {nodeDatum.attributes?.detail && (
              <div
                title={nodeDatum.attributes.detail}
                style={{
                  fontSize: '10px',
                  color: '#444',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {nodeDatum.attributes.detail}
              </div>
            )}
          </div>
        </div>
      </foreignObject>
    </g>
  );
});

FamilyTreeNode.displayName = 'FamilyTreeNode';

export default FamilyTreeNode;