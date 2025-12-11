import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ToastProvider';

type Position = { x: number; y: number };

export function useGenealogyPositions(storageKey: string, canEdit: boolean) {
  const { showToast } = useToast();
  const [customPositions, setCustomPositions] = useState<Map<string, Position>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  const saveToLocalStorage = useCallback((positions: Map<string, Position>) => {
    if (typeof window !== 'undefined') {
      const positionsObject = Object.fromEntries(positions);
      localStorage.setItem(storageKey, JSON.stringify(positionsObject));
    }
  }, [storageKey]);

  const loadPositions = useCallback(async () => {
    try {
      const response = await fetch('/api/genealogie/positions');
      if (response.ok) {
        const positions = await response.json();
        const positionsMap = new Map(
          Object.entries(positions).map(([key, value]) => [
            key,
            value as Position
          ])
        );
        setCustomPositions(positionsMap);
        saveToLocalStorage(positionsMap);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des positions depuis Supabase:', error);
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const positionsMap = new Map(
              Object.entries(parsed).map(([key, value]) => [
                key,
                value as Position
              ])
            );
            setCustomPositions(positionsMap);
          } catch (e) {
            console.error('Erreur lors du chargement depuis localStorage:', e);
          }
        }
      }
    }
  }, [storageKey, saveToLocalStorage]);

  const savePositionsToSupabase = useCallback(async (positions: Map<string, Position>) => {
    if (!canEdit) {
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
  }, [canEdit, showToast, saveToLocalStorage]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  return {
    customPositions,
    setCustomPositions,
    isSaving,
    saveToLocalStorage,
    savePositionsToSupabase,
    loadPositions
  };
}

