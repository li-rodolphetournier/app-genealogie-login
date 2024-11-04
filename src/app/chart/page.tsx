'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Interface pour les données d'objet
interface ObjectData {
  type: string;
  status: string;
}

// Interface pour les données du graphique
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/objects');
      const objects: ObjectData[] = await response.json();

      // Compter les objets par type
      const typeCount = objects.reduce((acc, obj) => {
        acc[obj.type] = (acc[obj.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Préparer les données pour le graphique
      const data: ChartDataType = {
        labels: Object.keys(typeCount),
        datasets: [
          {
            data: Object.values(typeCount),
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };

      setChartData(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    }
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        callbacks: {
          label: function(tooltipItem) {
            return `${tooltipItem.label}: ${tooltipItem.formattedValue}`;
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">Statistiques des objets</h1>
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Répartition par type</h2>
            <div className="h-[400px] relative">
              {chartData && (
                <Doughnut data={chartData} options={options} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
