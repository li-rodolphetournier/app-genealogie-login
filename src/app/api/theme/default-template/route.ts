import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/middleware';
import type { ErrorResponse } from '@/types/api/responses';

const SETTINGS_TABLE = 'app_settings';
const DEFAULT_TEMPLATE_KEY = 'default_theme_template';
const FALLBACK_TEMPLATE = 'default';

type DefaultTemplateResponse = {
  template: string;
};

// GET - récupérer le template par défaut global
export async function GET() {
  try {
    const supabase = await createServiceRoleClient();

    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select('value')
      .eq('key', DEFAULT_TEMPLATE_KEY)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[Theme Default Template][GET] Erreur lecture app_settings:', error);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la lecture du thème par défaut' },
        { status: 500 },
      );
    }

    const template = (data?.value as string | null) || FALLBACK_TEMPLATE;
    return NextResponse.json<DefaultTemplateResponse>({ template }, { status: 200 });
  } catch (error) {
    console.error('[Theme Default Template][GET] Erreur:', error);
    return NextResponse.json<DefaultTemplateResponse>(
      { template: FALLBACK_TEMPLATE },
      { status: 200 },
    );
  }
}

// PUT - définir le template par défaut global (admin uniquement)
export async function PUT(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const template = String(body.template || '').trim();

    if (!template) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Template invalide' },
        { status: 400 },
      );
    }

    const supabase = await createServiceRoleClient();

    const { error } = await supabase
      .from(SETTINGS_TABLE)
      .upsert(
        {
          key: DEFAULT_TEMPLATE_KEY,
          value: template,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      );

    if (error) {
      console.error('[Theme Default Template][PUT] Erreur écriture app_settings:', error);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la mise à jour du thème par défaut' },
        { status: 500 },
      );
    }

    return NextResponse.json<DefaultTemplateResponse>({ template }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erreur inconnue lors de la mise à jour';
    console.error('[Theme Default Template][PUT] Erreur:', error);

    const status =
      message.includes('Accès refusé') || message.includes('Non authentifié') ? 403 : 500;

    return NextResponse.json<ErrorResponse>(
      { error: message },
      { status },
    );
  }
}


