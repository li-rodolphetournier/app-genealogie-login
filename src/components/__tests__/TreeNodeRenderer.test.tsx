import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TreeNodeRenderer } from '../genealogy/TreeNodeRenderer';
import type { TreeNode } from '@/hooks/use-genealogy-tree';

const node: TreeNode = {
  id: 'n1',
  name: 'Test Node',
  genre: 'homme',
  description: 'desc',
  dateNaissance: '2000-01-01',
  dateDeces: null,
  image: null,
};

describe('TreeNodeRenderer', () => {
  const defaultProps = {
    node,
    x: 0,
    y: 0,
    nodeWidth: 200,
    nodeHeight: 80,
    isDead: false,
    isSelected: false,
    isDragging: false,
    canEdit: true,
    draggedNodeId: null as string | null,
    onNodeMouseDown: vi.fn(),
    onNodeClick: vi.fn(),
    getImage: () => '/test.png',
  };

  it('doit appeler onNodeClick au clic quand non draggué', () => {
    const onNodeClick = vi.fn();
    const { container } = render(
      <svg>
        <TreeNodeRenderer {...defaultProps} onNodeClick={onNodeClick} />
      </svg>,
    );

    const div = container.querySelector('foreignObject div') as HTMLElement;
    fireEvent.click(div);

    expect(onNodeClick).toHaveBeenCalledWith(node);
  });

  it('ne doit pas déclencher le drag si canEdit est false', () => {
    const onNodeMouseDown = vi.fn();
    const { container } = render(
      <svg>
        <TreeNodeRenderer {...defaultProps} canEdit={false} onNodeMouseDown={onNodeMouseDown} />
      </svg>,
    );

    const div = container.querySelector('foreignObject div') as HTMLElement;
    fireEvent.mouseDown(div, { button: 0 });

    expect(onNodeMouseDown).not.toHaveBeenCalled();
  });
});


