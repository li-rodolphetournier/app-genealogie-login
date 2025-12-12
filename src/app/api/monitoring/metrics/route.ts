/**
 * API Route pour les métriques de sécurité
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSecurityMetrics } from '@/lib/monitoring/metrics';

export async function GET(request: Request) {
  try {
    // Vérifier l'authentification et les droits admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('status')
      .eq('id', user.id)
      .single();

    if (profile?.status !== 'administrateur') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const metrics = await getSecurityMetrics();
    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('[Monitoring API] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

