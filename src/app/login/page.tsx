import React from 'react';
import Image from 'next/image';

const LoginPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Connexion</h1>
      <Image
        src="/uploads/login/armoirie.png" // Chemin de l'image
        alt="Armoirie"
        width={500} // Largeur de l'image
        height={300} // Hauteur de l'image
        layout="responsive" // Utiliser le layout responsive
      />
      <form className="mt-4 w-full max-w-md bg-gray-50 dark:bg-gray-800 shadow-lg rounded-lg px-6 py-6 border border-gray-200 dark:border-gray-700">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            Nom d'utilisateur
          </label>
          <input
            type="text"
            id="username"
            className="mt-1 block w-full border-2 border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-800 focus:ring-blue-800"
          />
        </div>
        <div className="mt-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            Mot de passe
          </label>
          <input
            type="password"
            id="password"
            className="mt-1 block w-full border-2 border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-800 focus:ring-blue-800"
          />
        </div>
        <button
          type="submit"
          className="mt-6 w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2.5 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900"
        >
          Se connecter
        </button>
      </form>
    </div>
  );
};

export default LoginPage; 