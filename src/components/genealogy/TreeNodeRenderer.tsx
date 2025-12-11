'use client';

import type { TreeNode } from '@/hooks/use-genealogy-tree';
import { getDefaultImage } from '@/utils/genealogy-tree-utils';

type TreeNodeRendererProps = {
  node: TreeNode;
  x: number;
  y: number;
  nodeWidth: number;
  nodeHeight: number;
  isDead: boolean;
  isSelected: boolean;
  isDragging: boolean;
  canEdit: boolean;
  draggedNodeId: string | null;
  onNodeMouseDown: (e: React.MouseEvent, nodeId: string, nodeX: number, nodeY: number) => void;
  onNodeClick: (node: TreeNode) => void;
  getImage: (node: TreeNode) => string;
  borderColor?: string;
  style?: 'default' | 'nivo' | 'treecharts';
};

export function TreeNodeRenderer({
  node,
  x,
  y,
  nodeWidth,
  nodeHeight,
  isDead,
  isSelected,
  isDragging,
  canEdit,
  draggedNodeId,
  onNodeMouseDown,
  onNodeClick,
  getImage,
  borderColor,
  style = 'default'
}: TreeNodeRendererProps) {
  const defaultBorderColor = borderColor || (
    isDead 
      ? (node.genre === 'homme' ? '#93c5fd' : '#f9a8d4')
      : isSelected 
      ? '#7c3aed'
      : (node.genre === 'homme' ? '#3b82f6' : '#ec4899')
  );

  const baseClasses = `${isDead ? 'bg-gray-300' : 'bg-white'} border-2 p-2 cursor-pointer transition-all`;
  
  const styleClasses = {
    default: 'rounded-lg hover:shadow-lg',
    nivo: 'rounded-lg hover:shadow-xl',
    treecharts: 'rounded-xl hover:shadow-2xl'
  };

  const selectedClasses = isSelected 
    ? (node.genre === 'homme' 
      ? 'border-blue-600 shadow-lg ring-2 ring-blue-300' 
      : 'border-pink-600 shadow-lg ring-2 ring-pink-300')
    : (node.genre === 'homme' ? 'border-blue-500' : 'border-pink-500');

  const draggingClasses = draggedNodeId === node.id 
    ? (node.genre === 'homme' ? 'shadow-xl ring-2 ring-blue-400' : 'shadow-xl ring-2 ring-pink-400')
    : '';

  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject
        width={nodeWidth}
        height={nodeHeight}
        x={-nodeWidth / 2}
        y={-nodeHeight / 2}
        className={`${style}-node`}
      >
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            if (!canEdit) {
              e.preventDefault();
              return;
            }
            if (e.button === 0) {
              onNodeMouseDown(e, node.id, x, y);
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!draggedNodeId || draggedNodeId !== node.id) {
              onNodeClick(node);
            }
          }}
          className={`${baseClasses} ${styleClasses[style]} ${selectedClasses} ${draggingClasses}`}
          style={{
            width: nodeWidth,
            height: nodeHeight,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderColor: defaultBorderColor,
            cursor: canEdit 
              ? (draggedNodeId === node.id ? 'grabbing' : 'grab')
              : 'default',
            boxShadow: style === 'treecharts' && isSelected 
              ? '0 10px 25px rgba(245, 158, 11, 0.3)' 
              : undefined,
          }}
        >
          <img
            src={getImage(node)}
            alt={node.name}
            className={`w-12 h-12 rounded-full object-cover flex-shrink-0 ${style === 'treecharts' ? 'border-2' : ''}`}
            style={style === 'treecharts' ? { borderColor: defaultBorderColor } : undefined}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = getDefaultImage(node.genre);
            }}
          />
          <div className="flex-1 min-w-0">
            <div 
              className={`font-semibold text-xs truncate ${style === 'treecharts' ? 'font-bold' : ''}`}
              title={node.name}
              style={style === 'treecharts' ? { color: defaultBorderColor } : undefined}
            >
              {node.name}
            </div>
            <div className="text-xs text-gray-500">
              {node.dateNaissance && new Date(node.dateNaissance).getFullYear()}
              {node.dateDeces && ` - ${new Date(node.dateDeces).getFullYear()}`}
            </div>
            {node.description && (
              <div className="text-xs text-gray-600 truncate" title={node.description}>
                {node.description}
              </div>
            )}
          </div>
        </div>
      </foreignObject>
    </g>
  );
}

