'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const LoginPage = () => {

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-3xl font-bold mb-6 text-gray-900 dark:text-white"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Connexion
      </motion.h1>

      <motion.div
        className="w-full max-w-md mb-4"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <motion.div
          className="rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-red-700 via-red-600 to-red-500 p-3"
          initial={{ y: 0, scale: 1 }}
          animate={{ y: [0, -8, 0], scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', repeatType: 'mirror' }}
        >
          <div className="bg-white rounded-lg overflow-hidden">
            <Image
              src="/uploads/login/armoirie.png"
              alt="Armoirie"
              width={500}
              height={300}
              className="w-full h-auto"
            />
          </div>
        </motion.div>
      </motion.div>

      <motion.form
        className="mt-2 w-full max-w-md bg-gray-50 dark:bg-gray-800 shadow-lg rounded-lg px-6 py-6 border border-gray-200 dark:border-gray-700"
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
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
      </motion.form>
    </motion.div>
  );
};

export default LoginPage;