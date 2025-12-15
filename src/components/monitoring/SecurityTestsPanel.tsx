'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SecurityTestResult } from '@/lib/monitoring/types';

export function SecurityTestsPanel() {
  const [results, setResults] = useState<SecurityTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [loadingLighthouse, setLoadingLighthouse] = useState(false);
  const [lighthouseReport, setLighthouseReport] = useState<{
    timestamp: string;
    scores: {
      performance: number | null;
      accessibility: number | null;
      bestPractices: number | null;
      seo: number | null;
    };
    metrics: {
      fcp: { value: number; displayValue: string; score: number | null } | null;
      lcp: { value: number; displayValue: string; score: number | null } | null;
      tbt: { value: number; displayValue: string; score: number | null } | null;
      speedIndex: { value: number; displayValue: string; score: number | null } | null;
      cls: { value: number; displayValue: string; score: number | null } | null;
    };
  } | null>(null);

  useEffect(() => {
    loadResults();
    loadLighthouseReport();
    const interval = setInterval(() => {
      loadResults();
      loadLighthouseReport();
    }, 60000); // Rafraîchir toutes les minutes
    return () => clearInterval(interval);
  }, []);

  const loadLighthouseReport = async () => {
    try {
      const response = await fetch('/api/monitoring/lighthouse');
      if (response.ok) {
        const { report } = await response.json();
        if (report) {
          setLighthouseReport(report);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du rapport Lighthouse:', error);
    }
  };

  const loadResults = async () => {
    try {
      const response = await fetch('/api/monitoring/tests');
      if (response.ok) {
        const { results: resultsData } = await response.json();
        // Mettre à jour les résultats seulement si on en a reçu
        if (resultsData && resultsData.length > 0) {
          setResults(resultsData);
          setLastRun(new Date(resultsData[0].timestamp));
        }
        // Si pas de résultats, ne rien faire (garder les résultats actuels)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des résultats:', error);
      // En cas d'erreur, ne pas effacer les résultats existants
    }
  };

  const runLighthouse = async () => {
    setLoadingLighthouse(true);
    try {
      // Rafraîchir le rapport après un délai pour laisser le temps au script de s'exécuter
      await loadLighthouseReport();
      
      // Afficher aussi la commande pour référence
      console.log('Pour lancer un nouveau test Lighthouse, exécute : tsx scripts/lighthouse-test.ts http://localhost:3000');
    } finally {
      setLoadingLighthouse(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500';
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number | null) => {
    if (score === null) return 'bg-gray-100';
    if (score >= 90) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const runTests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/monitoring/tests', { method: 'POST' });
      if (response.ok) {
        const { results: newResults } = await response.json();
        // Afficher immédiatement les résultats retournés par l'API
        // L'API POST retourne déjà les résultats, pas besoin de recharger
        if (newResults && newResults.length > 0) {
          setResults(newResults);
          setLastRun(new Date(newResults[0].timestamp));
        } else {
          // Si pas de résultats, essayer de recharger depuis la base de données
          await new Promise(resolve => setTimeout(resolve, 1000));
          await loadResults();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur lors de l\'exécution des tests:', errorData.error || 'Erreur inconnue');
        // En cas d'erreur, essayer de recharger les résultats existants
        await loadResults();
      }
    } catch (error) {
      console.error('Erreur lors de l\'exécution des tests:', error);
      // En cas d'erreur, essayer de recharger les résultats existants
      await loadResults();
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
                Tests sécurité
              </>
            )}
          </button>
          <button
            onClick={runLighthouse}
            disabled={loadingLighthouse}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingLighthouse ? (
              <>
                <span className="animate-spin">⏳</span>
                Lighthouse...
              </>
            ) : (
              <>
                <span>⚡</span>
                Perf Lighthouse
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

      {/* Rapport Lighthouse */}
      <div className="mt-6 p-4 rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">Rapport Lighthouse</h3>
          <button
            onClick={loadLighthouseReport}
            className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            🔄 Actualiser
          </button>
        </div>

        {lighthouseReport ? (
          <div className="space-y-4">
            {/* Scores globaux */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`p-3 rounded-lg ${getScoreBgColor(lighthouseReport.scores.performance)}`}>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Performance</div>
                <div className={`text-2xl font-bold ${getScoreColor(lighthouseReport.scores.performance)}`}>
                  {lighthouseReport.scores.performance ?? 'N/A'}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${getScoreBgColor(lighthouseReport.scores.accessibility)}`}>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Accessibilité</div>
                <div className={`text-2xl font-bold ${getScoreColor(lighthouseReport.scores.accessibility)}`}>
                  {lighthouseReport.scores.accessibility ?? 'N/A'}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${getScoreBgColor(lighthouseReport.scores.bestPractices)}`}>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Best Practices</div>
                <div className={`text-2xl font-bold ${getScoreColor(lighthouseReport.scores.bestPractices)}`}>
                  {lighthouseReport.scores.bestPractices ?? 'N/A'}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${getScoreBgColor(lighthouseReport.scores.seo)}`}>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">SEO</div>
                <div className={`text-2xl font-bold ${getScoreColor(lighthouseReport.scores.seo)}`}>
                  {lighthouseReport.scores.seo ?? 'N/A'}
                </div>
              </div>
            </div>

            {/* Métriques détaillées */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">Métriques de Performance</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {lighthouseReport.metrics.fcp && (
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded">
                    <span className="text-gray-700 dark:text-gray-300">First Contentful Paint</span>
                    <span className={`font-semibold ${getScoreColor(lighthouseReport.metrics.fcp.score)}`}>
                      {lighthouseReport.metrics.fcp.displayValue}
                    </span>
                  </div>
                )}
                {lighthouseReport.metrics.lcp && (
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded">
                    <span className="text-gray-700 dark:text-gray-300">Largest Contentful Paint</span>
                    <span className={`font-semibold ${getScoreColor(lighthouseReport.metrics.lcp.score)}`}>
                      {lighthouseReport.metrics.lcp.displayValue}
                    </span>
                  </div>
                )}
                {lighthouseReport.metrics.tbt && (
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded">
                    <span className="text-gray-700 dark:text-gray-300">Total Blocking Time</span>
                    <span className={`font-semibold ${getScoreColor(lighthouseReport.metrics.tbt.score)}`}>
                      {lighthouseReport.metrics.tbt.displayValue}
                    </span>
                  </div>
                )}
                {lighthouseReport.metrics.speedIndex && (
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded">
                    <span className="text-gray-700 dark:text-gray-300">Speed Index</span>
                    <span className={`font-semibold ${getScoreColor(lighthouseReport.metrics.speedIndex.score)}`}>
                      {lighthouseReport.metrics.speedIndex.displayValue}
                    </span>
                  </div>
                )}
                {lighthouseReport.metrics.cls && (
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded">
                    <span className="text-gray-700 dark:text-gray-300">Cumulative Layout Shift</span>
                    <span className={`font-semibold ${getScoreColor(lighthouseReport.metrics.cls.score)}`}>
                      {lighthouseReport.metrics.cls.displayValue}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-purple-200 dark:border-purple-700">
              💡 Pour générer un nouveau rapport, exécute dans le terminal :{' '}
              <code className="bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                tsx scripts/lighthouse-test.ts http://localhost:3000
              </code>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-600 dark:text-gray-400">
            <p className="mb-2">Aucun rapport Lighthouse disponible.</p>
            <p className="text-sm">
              Pour générer un rapport, exécute dans le terminal :{' '}
              <code className="bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                tsx scripts/lighthouse-test.ts http://localhost:3000
              </code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

