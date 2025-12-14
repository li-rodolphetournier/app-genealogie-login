-- ============================================
-- MIGRATION: Création de la table password_reset_logs
-- ============================================

-- Table pour journaliser les actions de réinitialisation de mot de passe
CREATE TABLE IF NOT EXISTS public.password_reset_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('forgot_password', 'reset_password', 'change_password', 'admin_reset')),
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    admin_login TEXT,
    reason TEXT,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_password_reset_logs_user_id ON public.password_reset_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_logs_user_email ON public.password_reset_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_password_reset_logs_action_type ON public.password_reset_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_password_reset_logs_created_at ON public.password_reset_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_logs_admin_id ON public.password_reset_logs(admin_id);

-- Activer RLS
ALTER TABLE public.password_reset_logs ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Seuls les administrateurs peuvent lire les logs
CREATE POLICY "Password reset logs are viewable by admins only"
    ON public.password_reset_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.status = 'administrateur'
        )
    );

-- Politique RLS : Le service role peut insérer des logs (pour l'API)
-- Note: Les insertions via service role bypass RLS par défaut, mais on peut être explicite
CREATE POLICY "Password reset logs can be inserted by service"
    ON public.password_reset_logs FOR INSERT
    WITH CHECK (true);

-- Commentaire
COMMENT ON TABLE public.password_reset_logs IS 'Journal des actions de réinitialisation de mot de passe';

