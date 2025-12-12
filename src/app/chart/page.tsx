'use client';

import { 
  ArcElement, 
  BarElement,
  CategoryScale,
  Chart as ChartJS, 
  ChartOptions, 
  Legend, 
  LinearScale,
  Tooltip, 
  TooltipItem 
} from 'chart.js';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

import Link from 'next/link';
import LoadingIndicator from '../../components/LoadingIndicator';
import { BackToHomeButton } from '@/components/navigation';
import { PageTransition } from '@/components/animations';
import { ObjectData } from '../../types/objects';

// Lazy loading des composants Chart (lourds ~80KB)
const Doughnut = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Doughnut),
  {
    ssr: false,
    loading: () => <LoadingIndicator />,
  }
);

const Bar = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Bar),
  {
    ssr: false,
    loading: () => <LoadingIndicator />,
  }
);

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface ChartDataType {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

interface PersonStatsData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }[];
}

type TimeFilter = '1day' | '15days' | '1month' | '1year' | 'all';

interface PersonStatsResponse {
  stats: Array<{
    date: string;
    count: number;
    persons: Array<{
      id: string;
      nom: string;
      prenom: string;
      created_at: string;
      created_by: string | null;
      creator: {
        login: string;
        email: string;
      } | null;
    }>;
  }>;
  total: number;
  period: string;
}

export default function ChartPage() {
  const [chartData, setChartData] = useState<ChartDataType | null>(null);
  const [personStatsData, setPersonStatsData] = useState<PersonStatsData | null>(null);
  const [personStatsDetails, setPersonStatsDetails] = useState<PersonStatsResponse['stats']>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [personStatsPeriod, setPersonStatsPeriod] = useState<string>('');
  const [personStatsTotal, setPersonStatsTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPersons, setIsLoadingPersons] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [personError, setPersonError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const objectsRes = await fetch('/api/objects');

        if (!objectsRes.ok) {
          throw new Error('Erreur lors de la récupération des objets');
        }

        const objectsData: ObjectData[] = await objectsRes.json();

        const typeCount = objectsData.reduce((acc, obj) => {
          acc[obj.type] = (acc[obj.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const backgroundColors = [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(14, 165, 233, 0.7)',
        ];
        const borderColors = backgroundColors.map(color => color.replace('0.7', '1'));

        const builtChartData: ChartDataType = {
          labels: Object.keys(typeCount),
          datasets: [
            {
              data: Object.values(typeCount),
              backgroundColor: backgroundColors.slice(0, Object.keys(typeCount).length),
              borderColor: borderColors.slice(0, Object.keys(typeCount).length),
              borderWidth: 1,
            },
          ],
        };
        setChartData(builtChartData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setChartData(null);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, []);

  useEffect(() => {
    const fetchPersonStats = async () => {
      setIsLoadingPersons(true);
      setPersonError(null);
      try {
        const statsRes = await fetch(`/api/persons/stats?filter=${timeFilter}`);

        if (!statsRes.ok) {
          const errorData = await statsRes.json().catch(() => ({ error: 'Erreur inconnue' }));
          throw new Error(errorData.error || 'Erreur lors de la récupération des statistiques des personnes');
        }

        const statsData: PersonStatsResponse = await statsRes.json();

        // Formater les dates pour l'affichage
        const labels = statsData.stats.map(stat => {
          const date = new Date(stat.date);
          return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        });

        const counts = statsData.stats.map(stat => stat.count);

        const builtPersonStatsData: PersonStatsData = {
          labels,
          datasets: [
            {
              label: 'Personnes créées',
              data: counts,
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
            },
          ],
        };

        setPersonStatsData(builtPersonStatsData);
        setPersonStatsDetails(statsData.stats);
        setPersonStatsPeriod(statsData.period);
        setPersonStatsTotal(statsData.total);

      } catch (err) {
        setPersonError(err instanceof Error ? err.message : 'Erreur inconnue');
        setPersonStatsData(null);
      } finally {
        setIsLoadingPersons(false);
      }
    };

    void fetchPersonStats();
  }, [timeFilter]);

  const chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<'doughnut'>) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed + ' objet(s)';
            }
            return label;
          }
        }
      }
    }
  };

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<'bar'>) {
            return `${context.parsed.y} personne(s) créée(s)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  if (isLoading && isLoadingPersons) {
    return <LoadingIndicator text="Chargement des statistiques..." />;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Statistiques
          </h1>
          <BackToHomeButton variant="button" />
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6" role="alert">
            <p className="text-red-700">Erreur de chargement: {error}</p>
          </div>
        )}

        {!error && chartData && (
          <div className="bg-white rounded-lg shadow px-6 py-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4" id="chart-title">
              Répartition des Objets par Type
            </h2>
            <div className="h-[400px] relative" aria-labelledby="chart-title">
              <Doughnut
                data={chartData}
                options={chartOptions}
                aria-label="Graphique Donut des types d'objets"
              />
            </div>
          </div>
        )}

        {/* Graphique des personnes créées */}
        <div className="bg-white rounded-lg shadow px-6 py-8 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900" id="person-chart-title">
              Nouvelles Personnes Créées
            </h2>
            <div className="flex items-center gap-4">
              <label htmlFor="time-filter" className="text-sm font-medium text-gray-700">
                Depuis :
              </label>
              <select
                id="time-filter"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="1day">1 jour</option>
                <option value="15days">15 jours</option>
                <option value="1month">1 mois</option>
                <option value="1year">1 an</option>
                <option value="all">Le début</option>
              </select>
            </div>
          </div>

          {personError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
              <p className="text-red-700">Erreur de chargement: {personError}</p>
            </div>
          )}

          {isLoadingPersons ? (
            <div className="h-[400px] flex items-center justify-center">
              <LoadingIndicator text="Chargement des statistiques des personnes..." />
            </div>
          ) : personStatsData ? (
            <>
              <div className="mb-4 text-sm text-gray-600">
                <p>
                  <span className="font-semibold">Total :</span> {personStatsTotal} personne(s) - {personStatsPeriod}
                </p>
              </div>
              <div className="h-[400px] relative" aria-labelledby="person-chart-title">
                <Bar
                  data={personStatsData}
                  options={barChartOptions}
                  aria-label="Graphique en barres des personnes créées"
                />
              </div>
              
              {/* Tableau détaillé des personnes créées */}
              {personStatsDetails.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Détails des Personnes Créées
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nom
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Prénom
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Créé par
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {personStatsDetails.flatMap(stat => 
                          stat.persons.map((person, idx) => (
                            <tr key={`${person.id}-${idx}`} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {new Date(person.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {person.nom}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {person.prenom}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {person.creator ? (
                                  <span title={person.creator.email}>
                                    {person.creator.login}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">Non renseigné</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-10">
              Aucune donnée statistique à afficher.
            </div>
          )}
        </div>

        {!isLoading && !error && !chartData && (
          <div className="text-center text-gray-500 py-10">
            Aucune donnée statistique à afficher.
          </div>
        )}
      </div>
      </div>
    </PageTransition>
  );
}
