'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SecurityAlert, SecurityMetrics } from '@/lib/monitoring/types';

export function SecurityMonitoringPanel() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Rafraîchir toutes les 30 secondes
    return () => clearInterval(interval);
  }, [filter]);

  const loadData = async () => {
    try {
      const [alertsRes, metricsRes] = await Promise.all([
        fetch(`/api/monitoring/alerts?resolved=${filter === 'unresolved' ? 'false' : 'all'}&limit=50`),
        fetch('/api/monitoring/metrics'),
      ]);

      if (alertsRes.ok) {
        const { alerts: alertsData } = await alertsRes.json();
        setAlerts(alertsData);
      }

      if (metricsRes.ok) {
        const { metrics: metricsData } = await metricsRes.json();
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch('/api/monitoring/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });
      loadData();
    } catch (error) {
      console.error('Erreur lors de la résolution de l\'alerte:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Alertes de Sécurité</h2>

      {/* Métriques */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded">
            <div className="text-sm text-gray-600">Critiques</div>
            <div className="text-2xl font-bold text-red-600">{metrics.criticalAlerts}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded">
            <div className="text-sm text-gray-600">Élevées</div>
            <div className="text-2xl font-bold text-orange-600">{metrics.highAlerts}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded">
            <div className="text-sm text-gray-600">Moyennes</div>
            <div className="text-2xl font-bold text-yellow-600">{metrics.mediumAlerts}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-sm text-gray-600">Faibles</div>
            <div className="text-2xl font-bold text-blue-600">{metrics.lowAlerts}</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter('unresolved')}
          className={`px-4 py-2 rounded ${filter === 'unresolved' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Non résolues
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Toutes
        </button>
      </div>

      {/* Liste des alertes */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <p className="text-gray-500">Aucune alerte</p>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded border-l-4 ${getLevelColor(alert.level)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold">{alert.message}</div>
                  <div className="text-sm opacity-90 mt-1">
                    {format(new Date(alert.timestamp), 'PPpp', { locale: fr })}
                  </div>
                  {alert.ip && (
                    <div className="text-sm opacity-75 mt-1">IP: {alert.ip}</div>
                  )}
                </div>
                {!alert.resolved && (
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="ml-4 px-3 py-1 bg-white text-gray-800 rounded text-sm hover:bg-gray-100"
                  >
                    Résoudre
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

