'use client';

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

type Object = {
  id: string;
  utilisateur: string;
  nom: string;
};

interface ChartDataset {
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
  borderWidth: number;
}

interface ChartDataType {
  labels: string[];
  datasets: ChartDataset[];
}

// Définition des couleurs
const COLORS = [
  'rgba(54, 162, 235, 0.8)',   // Bleu
  'rgba(75, 192, 192, 0.8)',   // Turquoise
  'rgba(153, 102, 255, 0.8)',  // Violet
  'rgba(255, 159, 64, 0.8)',   // Orange
  'rgba(255, 99, 132, 0.8)',   // Rose
  'rgba(255, 206, 86, 0.8)',   // Jaune
  'rgba(111, 205, 205, 0.8)',  // Vert d'eau
  'rgba(220, 20, 60, 0.8)',    // Cramoisi
  'rgba(148, 0, 211, 0.8)',    // Violet foncé
  'rgba(0, 128, 128, 0.8)',    // Sarcelle
];

export default function Chart() {
  const [chartData, setChartData] = useState<ChartDataType | null>(null);
  const [totalObjects, setTotalObjects] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/objects');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données');
        }

        const objects: Object[] = await response.json();
        setTotalObjects(objects.length);

        const userCounts = objects.reduce((acc: { [key: string]: number }, obj) => {
          acc[obj.utilisateur] = (acc[obj.utilisateur] || 0) + 1;
          return acc;
        }, {});

        const labels = Object.keys(userCounts);
        const data = Object.values(userCounts);

        setChartData({
          labels,
          datasets: [
            {
              data,
              backgroundColor: COLORS.slice(0, labels.length),
              borderColor: COLORS.map(color => color.replace('0.8', '1')),
              borderWidth: 1,
            },
          ],
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Une erreur est survenue');
        console.error('Erreur:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: { label: string; raw: number }) {
            const label = context.label || '';
            const value = context.raw;
            const percentage = ((value / totalObjects) * 100).toFixed(1);
            return `${label}: ${value} objet${value > 1 ? 's' : ''} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div role="alert" className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="sr-only">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="flex items-center justify-center h-screen text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête fixe */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Statistiques des objets
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Répartition des objets par utilisateur
              </p>
            </div>
            <Link
              href="/accueil"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-full mx-auto">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Statistiques et graphique */}
              <div>
                {/* Résumé des statistiques */}
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-blue-800">
                      Total des objets
                    </h2>
                    <p className="text-3xl font-bold text-blue-600">
                      {totalObjects}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-green-800">
                      Utilisateurs
                    </h2>
                    <p className="text-3xl font-bold text-green-600">
                      {chartData?.labels?.length || 0}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-purple-800">
                      Moyenne
                    </h2>
                    <p className="text-3xl font-bold text-purple-600">
                      {chartData?.labels?.length
                        ? (totalObjects / chartData.labels.length).toFixed(1)
                        : 0}
                    </p>
                  </div>
                </div>

                {/* Graphique */}
                <div className="h-[400px] relative">
                  {chartData && (
                    <Doughnut data={chartData} options={options} />
                  )}
                </div>
              </div>

              {/* Légende détaillée */}
              {chartData && (
                <div className="flex flex-col space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Détails par utilisateur
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {chartData.labels.map((label: string, index: number) => {
                      const value = chartData.datasets[0].data[index];
                      const percentage = ((value / totalObjects) * 100).toFixed(1);
                      return (
                        <div
                          key={label}
                          className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div
                            className="w-4 h-4 rounded-full mr-3"
                            style={{ backgroundColor: chartData.datasets[0].backgroundColor[index] }}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm text-gray-600">
                              {value} objet{value > 1 ? 's' : ''} ({percentage}%)
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
