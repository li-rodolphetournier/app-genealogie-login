'use client';

import { ArcElement, Chart as ChartJS, ChartOptions, Legend, Tooltip, TooltipItem } from 'chart.js';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

import Link from 'next/link';
import LoadingIndicator from '../../components/LoadingIndicator';
import { ObjectData } from '../../types/objects';

// Lazy loading du composant Doughnut (lourd ~80KB)
const Doughnut = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Doughnut),
  {
    ssr: false,
    loading: () => <LoadingIndicator />,
  }
);

ChartJS.register(ArcElement, Tooltip, Legend);

interface ChartDataType {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

export default function ChartPage() {
  const [chartData, setChartData] = useState<ChartDataType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (isLoading) {
    return <LoadingIndicator text="Chargement des statistiques..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Statistiques des Objets
          </h1>
          <Link
            href="/accueil"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à l&apos;accueil
          </Link>
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

        {!isLoading && !error && !chartData && (
          <div className="text-center text-gray-500 py-10">
            Aucune donnée statistique à afficher.
          </div>
        )}
      </div>
    </div>
  );
}
