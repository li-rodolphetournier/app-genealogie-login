'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { BackToHomeButton } from '@/components/navigation';
import { PageTransition } from '@/components/animations';
import LoadingIndicator from '@/components/LoadingIndicator';

type PasswordResetLog = {
  userId?: string;
  userEmail: string;
  actionType: 'forgot_password' | 'reset_password' | 'change_password' | 'admin_reset';
  adminId?: string;
  adminLogin?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  createdAt?: string;
};

export default function PasswordResetLogsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth({
    redirectIfUnauthenticated: true,
    redirectTo: '/',
  });

  const [logs, setLogs] = useState<PasswordResetLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    userEmail: '',
    actionType: 'all' as 'all' | PasswordResetLog['actionType'],
  });

  // Vérifier que l'utilisateur est admin
  useEffect(() => {
    if (!authLoading && user && user.status !== 'administrateur') {
      router.push('/accueil');
    }
  }, [user, authLoading, router]);

  // Charger les logs
  useEffect(() => {
    if (user?.status === 'administrateur') {
      loadLogs();
    }
  }, [user, filter]);

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filter.userEmail) {
        params.append('userEmail', filter.userEmail);
      }
      params.append('limit', '100');

      const response = await fetch(`/api/auth/admin/password-reset-logs?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des logs');
      }

      const data = await response.json();
      let logsData = data.data || [];

      // Filtrer par type d'action côté client
      if (filter.actionType !== 'all') {
        logsData = logsData.filter((log: PasswordResetLog) => log.actionType === filter.actionType);
      }

      setLogs(logsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionTypeLabel = (type: PasswordResetLog['actionType']) => {
    const labels = {
      forgot_password: 'Demande de réinitialisation',
      reset_password: 'Réinitialisation',
      change_password: 'Changement de mot de passe',
      admin_reset: 'Réinitialisation par admin',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  if (authLoading || isLoading) {
    return <LoadingIndicator text="Chargement des logs..." />;
  }

  if (!user || user.status !== 'administrateur') {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Logs de Réinitialisation de Mot de Passe
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Historique des actions de réinitialisation et changement de mot de passe
                </p>
              </div>
              <BackToHomeButton />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Filtres */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrer par email
                </label>
                <input
                  type="text"
                  id="userEmail"
                  value={filter.userEmail}
                  onChange={(e) => setFilter({ ...filter, userEmail: e.target.value })}
                  placeholder="user@example.com"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="actionType" className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrer par type d'action
                </label>
                <select
                  id="actionType"
                  value={filter.actionType}
                  onChange={(e) => setFilter({ ...filter, actionType: e.target.value as any })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">Tous les types</option>
                  <option value="forgot_password">Demande de réinitialisation</option>
                  <option value="reset_password">Réinitialisation</option>
                  <option value="change_password">Changement de mot de passe</option>
                  <option value="admin_reset">Réinitialisation par admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tableau des logs */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Raison
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Aucun log trouvé
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getActionTypeLabel(log.actionType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.userEmail}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.adminLogin ? (
                            <span>{log.adminLogin}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.success ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Succès
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Échec
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.reason || <span className="text-gray-400">-</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {logs.length > 0 && (
              <div className="bg-gray-50 px-6 py-3 text-sm text-gray-500">
                Total : {logs.length} log{logs.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </main>
      </div>
    </PageTransition>
  );
}

