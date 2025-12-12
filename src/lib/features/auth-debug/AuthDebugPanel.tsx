'use client';

import { useState, useEffect, useRef } from 'react';
import { authLogger, type AuthLogEntry } from './auth-logger';

export function AuthDebugPanel() {
  const [logs, setLogs] = useState<AuthLogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Charger les logs existants
    setLogs(authLogger.getLogs());

    // S'abonner aux nouveaux logs
    const unsubscribe = authLogger.subscribe((entry) => {
      setLogs(prev => [...prev, entry]);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.category !== filter) return false;
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    return true;
  });

  const getLevelColor = (level: AuthLogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'debug': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const exportLogs = () => {
    const json = authLogger.exportLogs();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        title="Ouvrir le panneau de debug d'authentification"
      >
        🔍 Auth Debug ({logs.length})
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] bg-white border-2 border-gray-300 rounded-lg shadow-2xl flex flex-col">
      <div className="bg-gray-800 text-white p-3 flex justify-between items-center rounded-t-lg">
        <h3 className="font-bold text-sm">🔍 Auth Debug Panel</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`text-xs px-2 py-1 rounded ${autoScroll ? 'bg-green-600' : 'bg-gray-600'}`}
            title={autoScroll ? 'Auto-scroll activé' : 'Auto-scroll désactivé'}
          >
            {autoScroll ? '📜' : '⏸️'}
          </button>
          <button
            onClick={exportLogs}
            className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700"
            title="Exporter les logs"
          >
            💾
          </button>
          <button
            onClick={() => {
              authLogger.clearLogs();
              setLogs([]);
            }}
            className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700"
            title="Vider les logs"
          >
            🗑️
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-xs px-2 py-1 rounded bg-gray-600 hover:bg-gray-700"
            title="Fermer"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-2 bg-gray-100 border-b flex gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-xs px-2 py-1 border rounded flex-1"
        >
          <option value="all">Toutes les catégories</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
          <option value="SESSION">Session</option>
          <option value="REDIRECT">Redirect</option>
          <option value="MIDDLEWARE">Middleware</option>
          <option value="HOOK">Hook</option>
        </select>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="text-xs px-2 py-1 border rounded flex-1"
        >
          <option value="all">Tous les niveaux</option>
          <option value="error">Erreurs</option>
          <option value="warn">Avertissements</option>
          <option value="info">Infos</option>
          <option value="debug">Debug</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-2 text-xs font-mono space-y-1">
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-4">Aucun log</div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={index}
              className={`p-2 rounded border-l-4 ${getLevelColor(log.level)}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold">{log.category}</span>
                <span className="text-gray-500 text-[10px]">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-gray-800">{log.message}</div>
              {log.data && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-gray-600 text-[10px]">
                    Données ({Object.keys(log.data).length} clés)
                  </summary>
                  <pre className="mt-1 p-1 bg-gray-100 rounded text-[10px] overflow-x-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </details>
              )}
              {log.stack && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-red-600 text-[10px]">
                    Stack trace
                  </summary>
                  <pre className="mt-1 p-1 bg-red-50 rounded text-[10px] overflow-x-auto">
                    {log.stack}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      <div className="bg-gray-100 p-2 text-xs text-gray-600 border-t">
        {filteredLogs.length} log(s) affiché(s) sur {logs.length} total
      </div>
    </div>
  );
}

