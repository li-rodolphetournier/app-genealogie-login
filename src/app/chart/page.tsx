'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import Layout from '../../components/Layout';
import Link from 'next/link';

ChartJS.register(ArcElement, Tooltip, Legend);

type Object = {
  id: string;
  utilisateur: string;
  nom: string;
};

const COLORS = [
  'rgba(255, 99, 132, 0.8)',
  'rgba(54, 162, 235, 0.8)',
  'rgba(255, 206, 86, 0.8)',
  'rgba(75, 192, 192, 0.8)',
  'rgba(153, 102, 255, 0.8)',
  'rgba(255, 159, 64, 0.8)',
];

const BORDER_COLORS = [
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)',
];

type ChartDataType = {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
} | null;

export default function Chart() {
  const [chartData, setChartData] = useState<ChartDataType>(null);
  const [totalObjects, setTotalObjects] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/objects');
        if (response.ok) {
          const objects: Object[] = await response.json();
          setTotalObjects(objects.length);
          
          // Compter le nombre d&apos;objets par utilisateur
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
                borderColor: BORDER_COLORS.slice(0, labels.length),
                borderWidth: 1,
              },
            ],
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      }
    };

    fetchData();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Distribution des objets par utilisateur',
      },
    },
  };

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Statistiques des objets par utilisateur</h1>
        <p className="mb-4">Nombre total d&apos;objets : {totalObjects}</p>
        
        {chartData ? (
          <div className="aspect-square w-full max-w-xl mx-auto">
            <Doughnut data={chartData} options={options} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p>Chargement des données...</p>
          </div>
        )}

        {chartData && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {chartData.labels.map((label: string, index: number) => (
              <div 
                key={label} 
                className="p-4 border rounded-lg flex items-center space-x-2"
              >
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: COLORS[index] }}
                />
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-gray-600">
                    {chartData.datasets[0].data[index]} objet{chartData.datasets[0].data[index] > 1 ? 's' : ''} 
                    ({((chartData.datasets[0].data[index] / totalObjects) * 100).toFixed(1)}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Link href="/accueil" className="text-blue-500 hover:underline">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </Layout>
  );
}
