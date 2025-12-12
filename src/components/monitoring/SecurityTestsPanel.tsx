'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SecurityTestResult } from '@/lib/monitoring/types';

export function SecurityTestsPanel() {
  const [results, setResults] = useState<SecurityTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  useEffect(() => {
    loadResults();
    const interval = setInterval(loadResults, 60000); // Rafraîchir toutes les minutes
    return () => clearInterval(interval);
  }, []);

  const loadResults = async () => {
    try {
      const response = await fetch('/api/monitoring/tests');
      if (response.ok) {
        const { results: resultsData } = await response.json();
        setResults(resultsData || []);
        if (resultsData && resultsData.length > 0) {
          setLastRun(new Date(resultsData[0].timestamp));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des résultats:', error);
    }
  };

  const runTests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/monitoring/tests', { method: 'POST' });
      if (response.ok) {
        const { results: newResults } = await response.json();
        setResults(newResults || []);
        if (newResults && newResults.length > 0) {
          setLastRun(new Date(newResults[0].timestamp));
        }
      }
      await loadResults();
    } catch (error) {
      console.error('Erreur lors de l\'exécution des tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800 border-green-500';
      case 'failed': return 'bg-red-100 text-red-800 border-red-500';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-500';
      default: return 'bg-gray-100 text-gray-800 border-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Tests de Sécurité</h2>
        <div className="flex gap-2 items-center">
          {lastRun && (
            <span className="text-sm text-gray-600">
              Dernière exécution: {format(lastRun, 'PPpp', { locale: fr })}
            </span>
          )}
          <button
            onClick={runTests}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Exécution...
              </>
            ) : (
              <>
                <span>▶️</span>
                Lancer les tests
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {results.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Aucun résultat de test. Cliquez sur "Lancer les tests" pour exécuter les tests de sécurité.
          </p>
        ) : (
          results.map(result => (
            <div
              key={result.id}
              className={`p-4 rounded border-l-4 ${getStatusColor(result.status)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    <span>{getStatusIcon(result.status)}</span>
                    {result.testName}
                  </div>
                  <div className="text-sm mt-1 opacity-75">
                    {format(new Date(result.timestamp), 'PPpp', { locale: fr })}
                  </div>
                  {result.details && (
                    <div className="text-sm mt-2 p-2 bg-white bg-opacity-50 rounded">
                      {result.details}
                    </div>
                  )}
                  {result.error && (
                    <div className="text-sm text-red-600 mt-2 p-2 bg-white bg-opacity-50 rounded">
                      <strong>Erreur:</strong> {result.error}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Durée: {result.duration}ms
                  </div>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(result.status)}`}>
                  {result.status === 'passed' ? 'Réussi' : result.status === 'failed' ? 'Échoué' : 'Avertissement'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

