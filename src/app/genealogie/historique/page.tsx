import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HistoriqueClient } from './historique-client';

// Forcer le rendu dynamique car on utilise cookies() pour l'authentification
export const dynamic = 'force-dynamic';

async function getPersons() {
  const supabase = await createClient();
  const { data: persons, error } = await supabase
    .from('persons')
    .select('id, nom, prenom')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des personnes:', error);
    return [];
  }

  return persons || [];
}

export default async function HistoriquePage() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Erreur d\'authentification:', authError);
      redirect('/');
    }

    // Vérifier que l'utilisateur est administrateur
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('status')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Erreur lors de la récupération du profil:', profileError);
      redirect('/accueil');
    }

    if (profile?.status !== 'administrateur') {
      console.log('Utilisateur non admin:', user.id, 'Status:', profile?.status);
      redirect('/accueil');
    }

    const persons = await getPersons();

    return <HistoriqueClient initialPersons={persons} />;
  } catch (error: any) {
    console.error('Erreur dans HistoriquePage:', error);
    redirect('/accueil');
  }
}

