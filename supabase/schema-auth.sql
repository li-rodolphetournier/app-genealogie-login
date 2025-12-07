-- ============================================
-- SCHEMA SUPABASE POUR AUTHENTIFICATION
-- Migration vers Supabase Auth
-- ============================================

-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ADAPTATION DE LA TABLE: users
-- Pour utiliser Supabase Auth (auth.users)
-- ============================================

-- Supprimer le champ password_hash si il existe
-- (Supabase Auth gère les mots de passe dans auth.users)
ALTER TABLE IF EXISTS public.users DROP COLUMN IF EXISTS password_hash;

-- Si la table users n'existe pas, la créer
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    login TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('administrateur', 'utilisateur', 'redacteur')),
    profile_image TEXT,
    description TEXT,
    detail TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_users_login ON public.users(login);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- ============================================
-- FONCTION: Updated_at trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur la table users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leur propre profil
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Politique : Les utilisateurs peuvent mettre à jour leur propre profil
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Politique : Les administrateurs peuvent voir tous les profils
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
CREATE POLICY "Admins can view all profiles" ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND status = 'administrateur'
        )
    );

-- Politique : Les administrateurs peuvent modifier tous les profils
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
CREATE POLICY "Admins can update all profiles" ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND status = 'administrateur'
        )
    );

-- Politique : Permettre la création de profils (via le script de migration)
-- Note : Cette politique permet la création via service role key
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users" ON public.users
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- FONCTION: Créer automatiquement un profil user après inscription
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, login, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'login', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'status', 'utilisateur')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil après inscription dans auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE public.users IS 'Profils utilisateurs liés à auth.users via l''ID';
COMMENT ON COLUMN public.users.id IS 'ID correspondant à auth.users.id';
COMMENT ON COLUMN public.users.login IS 'Identifiant unique de connexion';
COMMENT ON COLUMN public.users.status IS 'Rôle de l''utilisateur (administrateur, utilisateur, redacteur)';

