'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import Link from 'next/link';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ObjectData {
  type: string;
  status: string;
}

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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/objects');
      const objects: ObjectData[] = await response.json();

      const typeCount = objects.reduce((acc, obj) => {
        acc[obj.type] = (acc[obj.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const data: ChartDataType = {
        labels: Object.keys(typeCount),
        datasets: [
          {
            data: Object.values(typeCount),
            backgroundColor: [
              'rgba(59, 130, 246, 0.5)', // blue-500
              'rgba(16, 185, 129, 0.5)', // green-500
              'rgba(239, 68, 68, 0.5)',  // red-500
              'rgba(245, 158, 11, 0.5)', // yellow-500
              'rgba(139, 92, 246, 0.5)', // purple-500
            ],
            borderColor: [
              'rgb(59, 130, 246)',  // blue-500
              'rgb(16, 185, 129)',  // green-500
              'rgb(239, 68, 68)',   // red-500
              'rgb(245, 158, 11)',  // yellow-500
              'rgb(139, 92, 246)',  // purple-500
            ],
            borderWidth: 2,
          },
        ],
      };

      setChartData(data);
    } catch (error) {
      setError('Erreur lors de la récupération des données');
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          font: {
            size: 14,
          },
          padding: 20,
          color: '#374151', // text-gray-700
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 14,
        },
        callbacks: {
          label: function(tooltipItem) {
            return `${tooltipItem.label}: ${tooltipItem.formattedValue} objets`;
          }
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" role="status">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="sr-only">Chargement des statistiques...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête avec bouton retour */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Statistiques des objets
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

        {error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow px-6 py-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4" id="chart-title">
                Répartition des objets par type
              </h2>
              <div className="h-[400px] relative" aria-labelledby="chart-title">
                {chartData && (
                  <Doughnut 
                    data={chartData} 
                    options={options}
                    aria-label="Graphique en anneau montrant la répartition des objets par type"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
