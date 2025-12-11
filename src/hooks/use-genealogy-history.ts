import { useState, useCallback } from 'react';
import { useToast } from '@/components/ToastProvider';

type HistoryItem = {
  id: string;
  personId: string;
  x: number;
  y: number;
  action: string;
  updatedAt: string;
  updatedBy: { id: string; login: string; email: string } | null;
};

export function useGenealogyHistory(isAdmin: boolean) {
  const { showToast } = useToast();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/genealogie/positions/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      } else {
        showToast('Erreur lors du chargement de l\'historique', 'error');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      showToast('Erreur lors du chargement de l\'historique', 'error');
    } finally {
      setLoadingHistory(false);
    }
  }, [isAdmin, showToast]);

  const toggleHistory = useCallback(() => {
    if (!historyOpen) {
      loadHistory();
    }
    setHistoryOpen(prev => !prev);
  }, [historyOpen, loadHistory]);

  return {
    history,
    loadingHistory,
    historyOpen,
    setHistoryOpen,
    loadHistory,
    toggleHistory
  };
}

