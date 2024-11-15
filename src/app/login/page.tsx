import React from 'react';
import Image from 'next/image';

const LoginPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Connexion</h1>
      <Image
        src="/uploads/login/armoirie.png" // Chemin de l'image
        alt="Armoirie"
        width={500} // Largeur de l'image
        height={300} // Hauteur de l'image
        layout="responsive" // Utiliser le layout responsive
      />
      <form className="mt-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nom d'utilisateur</label>
          <input type="text" id="username" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
        </div>
        <div className="mt-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
          <input type="password" id="password" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
        </div>
        <button type="submit" className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">Se connecter</button>
      </form>
    </div>
  );
};

export default LoginPage; 