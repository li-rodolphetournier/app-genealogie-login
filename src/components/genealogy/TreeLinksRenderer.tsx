'use client';

import { useEffect, useState } from 'react';
import type { Person } from '@/types/genealogy';
import type { Position } from '@/utils/genealogy-tree-utils';
import { LinkVertical } from '@visx/shape';

type TreeLinksRendererProps = {
  persons: Person[];
  positionMap: Map<string, Position>;
  nodeWidth: number;
  couplesMap: Map<string, { pereId: string; mereId: string }>;
  childrenByCouple: Map<string, Person[]>;
  singleParentChildren: Map<string, Person[]>;
  linkPath?: (sourceX: number, sourceY: number, targetX: number, targetY: number) => string;
  useVisx?: boolean;
  style?: 'default' | 'nivo' | 'treecharts';
};

export function TreeLinksRenderer({
  persons,
  positionMap,
  nodeWidth,
  couplesMap,
  childrenByCouple,
  singleParentChildren,
  linkPath,
  useVisx = false,
  style = 'default'
}: TreeLinksRendererProps) {
  const [isDark, setIsDark] = useState(false);
  
  // Détecter le thème pour les couleurs des liens
  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    updateTheme();
    
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Couleurs adaptées au thème
  const coupleLinkColor = isDark ? '#f87171' : '#e11d48'; // Rose/rouge pour les couples
  const pereLinkColor = isDark ? '#60a5fa' : '#2563eb'; // Bleu pour le père
  const mereLinkColor = isDark ? '#f472b6' : '#ec4899'; // Rose pour la mère
  const centerLinkColor = isDark ? '#9ca3af' : '#6b7280'; // Gris pour les liens centraux
  const centerPointColor = isDark ? '#9ca3af' : '#6b7280'; // Gris pour le point central
  
  const links: React.ReactElement[] = [];

  // Liens horizontaux entre les parents (couples)
  Array.from(couplesMap.values()).forEach((couple, i) => {
    const perePos = positionMap.get(couple.pereId);
    const merePos = positionMap.get(couple.mereId);
    
    if (!perePos || !merePos) return;

    links.push(
      <line
        key={`couple-link-${couple.pereId}-${couple.mereId}-${i}`}
        x1={perePos.x + nodeWidth / 2}
        y1={perePos.y}
        x2={merePos.x - nodeWidth / 2}
        y2={merePos.y}
        stroke={coupleLinkColor}
        strokeWidth="2"
        strokeDasharray="3,3"
        strokeOpacity={0.7}
      />
    );
  });

  // Traiter les enfants avec les deux parents
  childrenByCouple.forEach((children, coupleKey) => {
    const [pereId, mereId] = coupleKey.split('-');
    const perePos = positionMap.get(pereId);
    const merePos = positionMap.get(mereId);
    
    if (!perePos || !merePos) return;
    
    if (children.length === 1) {
      const child = children[0];
      const childPos = positionMap.get(child.id);
      if (!childPos) return;
      
      if (useVisx) {
        links.push(
          <LinkVertical
            key={`pere-link-${pereId}-${child.id}`}
            data={{
              source: { x: perePos.x, y: perePos.y },
              target: { x: childPos.x, y: childPos.y }
            }}
            stroke={pereLinkColor}
            strokeWidth="2"
            fill="none"
            strokeOpacity={0.7}
            strokeDasharray={child.dateDeces ? "5,5" : undefined}
          />
        );
        
        links.push(
          <LinkVertical
            key={`mere-link-${mereId}-${child.id}`}
            data={{
              source: { x: merePos.x, y: merePos.y },
              target: { x: childPos.x, y: childPos.y }
            }}
            stroke={mereLinkColor}
            strokeWidth="2"
            fill="none"
            strokeOpacity={0.7}
            strokeDasharray={child.dateDeces ? "5,5" : undefined}
          />
        );
      } else if (linkPath) {
        links.push(
          <path
            key={`pere-link-${pereId}-${child.id}`}
            d={linkPath(perePos.x, perePos.y, childPos.x, childPos.y)}
            fill="none"
            stroke={pereLinkColor}
            strokeWidth="2"
            strokeOpacity={0.7}
            strokeDasharray={child.dateDeces ? "5,5" : undefined}
            strokeLinecap={style === 'treecharts' ? "round" : undefined}
            strokeLinejoin={style === 'treecharts' ? "round" : undefined}
          />
        );
        
        links.push(
          <path
            key={`mere-link-${mereId}-${child.id}`}
            d={linkPath(merePos.x, merePos.y, childPos.x, childPos.y)}
            fill="none"
            stroke={mereLinkColor}
            strokeWidth="2"
            strokeOpacity={0.7}
            strokeDasharray={child.dateDeces ? "5,5" : undefined}
            strokeLinecap={style === 'treecharts' ? "round" : undefined}
            strokeLinejoin={style === 'treecharts' ? "round" : undefined}
          />
        );
      }
    } else {
      const centerX = (perePos.x + merePos.x) / 2;
      const centerY = perePos.y + 20;
      
      if (useVisx) {
        links.push(
          <LinkVertical
            key={`pere-to-center-${coupleKey}`}
            data={{
              source: { x: perePos.x, y: perePos.y },
              target: { x: centerX, y: centerY }
            }}
            stroke={pereLinkColor}
            strokeWidth="2"
            fill="none"
            strokeOpacity={0.7}
          />
        );
        
        links.push(
          <LinkVertical
            key={`mere-to-center-${coupleKey}`}
            data={{
              source: { x: merePos.x, y: merePos.y },
              target: { x: centerX, y: centerY }
            }}
            stroke={mereLinkColor}
            strokeWidth="2"
            fill="none"
            strokeOpacity={0.7}
          />
        );
        
        links.push(
          <circle
            key={`center-point-${coupleKey}`}
            cx={centerX}
            cy={centerY}
            r={3}
            fill={centerPointColor}
          />
        );
        
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
              stroke={centerLinkColor}
              strokeWidth="2"
              fill="none"
              strokeOpacity={0.7}
              strokeDasharray={child.dateDeces ? "5,5" : undefined}
            />
          );
        });
      } else if (linkPath) {
        links.push(
          <path
            key={`pere-to-center-${coupleKey}`}
            d={linkPath(perePos.x, perePos.y, centerX, centerY)}
            fill="none"
            stroke={pereLinkColor}
            strokeWidth="2"
            strokeOpacity={0.7}
            strokeLinecap={style === 'treecharts' ? "round" : undefined}
            strokeLinejoin={style === 'treecharts' ? "round" : undefined}
          />
        );
        
        links.push(
          <path
            key={`mere-to-center-${coupleKey}`}
            d={linkPath(merePos.x, merePos.y, centerX, centerY)}
            fill="none"
            stroke={mereLinkColor}
            strokeWidth="2"
            strokeOpacity={0.7}
            strokeLinecap={style === 'treecharts' ? "round" : undefined}
            strokeLinejoin={style === 'treecharts' ? "round" : undefined}
          />
        );
        
        links.push(
          <circle
            key={`center-point-${coupleKey}`}
            cx={centerX}
            cy={centerY}
            r={3}
            fill={centerPointColor}
          />
        );
        
        children.forEach(child => {
          const childPos = positionMap.get(child.id);
          if (!childPos) return;
          
          links.push(
            <path
              key={`center-to-child-${coupleKey}-${child.id}`}
              d={linkPath(centerX, centerY, childPos.x, childPos.y)}
              fill="none"
              stroke={centerLinkColor}
              strokeWidth="2"
              strokeOpacity={0.7}
              strokeDasharray={child.dateDeces ? "5,5" : undefined}
              strokeLinecap={style === 'treecharts' ? "round" : undefined}
              strokeLinejoin={style === 'treecharts' ? "round" : undefined}
            />
          );
        });
      }
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
          
          if (useVisx) {
            links.push(
              <LinkVertical
                key={`pere-link-${pereId}-${child.id}`}
                data={{
                  source: { x: perePos.x, y: perePos.y },
                  target: { x: childPos.x, y: childPos.y }
                }}
                stroke={pereLinkColor}
                strokeWidth="2"
                fill="none"
                strokeOpacity={0.7}
                strokeDasharray={child.dateDeces ? "5,5" : undefined}
              />
            );
          } else if (linkPath) {
            links.push(
              <path
                key={`pere-link-${pereId}-${child.id}`}
                d={linkPath(perePos.x, perePos.y, childPos.x, childPos.y)}
                fill="none"
                stroke={pereLinkColor}
                strokeWidth="2"
                strokeOpacity={0.7}
                strokeDasharray={child.dateDeces ? "5,5" : undefined}
                strokeLinecap={style === 'treecharts' ? "round" : undefined}
                strokeLinejoin={style === 'treecharts' ? "round" : undefined}
              />
            );
          }
        });
      }
    } else if (key.startsWith('mere-')) {
      const mereId = key.replace('mere-', '');
      const merePos = positionMap.get(mereId);
      
      if (merePos) {
        children.forEach(child => {
          const childPos = positionMap.get(child.id);
          if (!childPos) return;
          
          if (useVisx) {
            links.push(
              <LinkVertical
                key={`mere-link-${mereId}-${child.id}`}
                data={{
                  source: { x: merePos.x, y: merePos.y },
                  target: { x: childPos.x, y: childPos.y }
                }}
                stroke={mereLinkColor}
                strokeWidth="2"
                fill="none"
                strokeOpacity={0.7}
                strokeDasharray={child.dateDeces ? "5,5" : undefined}
              />
            );
          } else if (linkPath) {
            links.push(
              <path
                key={`mere-link-${mereId}-${child.id}`}
                d={linkPath(merePos.x, merePos.y, childPos.x, childPos.y)}
                fill="none"
                stroke={mereLinkColor}
                strokeWidth="2"
                strokeOpacity={0.7}
                strokeDasharray={child.dateDeces ? "5,5" : undefined}
                strokeLinecap={style === 'treecharts' ? "round" : undefined}
                strokeLinejoin={style === 'treecharts' ? "round" : undefined}
              />
            );
          }
        });
      }
    }
  });

  return <>{links}</>;
}

