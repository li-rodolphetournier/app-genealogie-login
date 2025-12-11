import type { Person } from '@/types/genealogy';

export type Position = { x: number; y: number };

export function getDefaultImage(genre?: 'homme' | 'femme'): string {
  return genre === 'femme'
    ? '/uploads/genealogie-photo/profile/female-avatar.png'
    : '/uploads/genealogie-photo/profile/male-avatar.png';
}

export function canEdit(status: string): boolean {
  return status === 'administrateur' || status === 'redacteur';
}

export function identifyCouples(persons: Person[]): Map<string, { pereId: string; mereId: string }> {
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
  
  return couplesMap;
}

export function createPartnerMap(couplesMap: Map<string, { pereId: string; mereId: string }>): Map<string, string> {
  const partnerMap = new Map<string, string>();
  
  couplesMap.forEach((couple) => {
    partnerMap.set(couple.pereId, couple.mereId);
    partnerMap.set(couple.mereId, couple.pereId);
  });
  
  return partnerMap;
}

export function groupChildrenByParents(persons: Person[]): {
  childrenByCouple: Map<string, Person[]>;
  singleParentChildren: Map<string, Person[]>;
} {
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
  
  return { childrenByCouple, singleParentChildren };
}

export function resolveCollisions(
  nodePositions: Array<{ id: string; x: number; y: number; depth: number }>,
  nodeWidth: number = 200,
  minSpacing: number = 30,
  coupleSpacing: number = 50,
  partnerMap?: Map<string, string>
): void {
  const maxDepth = Math.max(...nodePositions.map(n => n.depth));
  
  for (let depth = 0; depth <= maxDepth; depth++) {
    const nodesAtDepth = nodePositions.filter(n => n.depth === depth);
    if (nodesAtDepth.length === 0) continue;
    
    nodesAtDepth.sort((a, b) => a.x - b.x);
    
    for (let i = 1; i < nodesAtDepth.length; i++) {
      const currentNode = nodesAtDepth[i];
      const previousNode = nodesAtDepth[i - 1];
      const minX = previousNode.x + nodeWidth / 2 + minSpacing + nodeWidth / 2;
      
      if (currentNode.x < minX) {
        currentNode.x = minX;
        
        if (partnerMap) {
          const partnerId = partnerMap.get(currentNode.id);
          if (partnerId) {
            const partnerNode = nodesAtDepth.find(n => n.id === partnerId);
            if (partnerNode && partnerNode.x < currentNode.x + nodeWidth / 2 + coupleSpacing + nodeWidth / 2) {
              partnerNode.x = currentNode.x + nodeWidth / 2 + coupleSpacing + nodeWidth / 2;
            }
          }
        }
      }
    }
  }
}

