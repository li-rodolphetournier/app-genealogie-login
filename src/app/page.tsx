'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Login from '../components/Login';
import Layout from '../components/Layout';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      router.push('/accueil');
    }
  }, [router]);

  return (
    <Layout>
      <Login />
    </Layout>
  );
}
