/**
 * API Route pour les alertes de sécurité
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSecurityAlerts, resolveSecurityAlert } from '@/lib/monitoring/alert-manager';

export async function GET(request: Request) {
  try {
    // Vérifier l'authentification et les droits admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier les droits admin
    const { data: profile } = await supabase
      .from('users')
      .select('status')
      .eq('id', user.id)
      .single();

    if (profile?.status !== 'administrateur') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer les paramètres de filtrage
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const type = searchParams.get('type');
    const resolved = searchParams.get('resolved');
    const limit = searchParams.get('limit');

    const alerts = await getSecurityAlerts({
      level: level as any,
      type: type as any,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('[Monitoring API] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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

    const { alertId } = await request.json();
    await resolveSecurityAlert(alertId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Monitoring API] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

