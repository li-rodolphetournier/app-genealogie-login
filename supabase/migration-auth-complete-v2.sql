-- ============================================
-- SCRIPT COMPLET DE MIGRATION VERS SUPABASE AUTH (VERSION CORRIGÉE)
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================
-- 
-- CORRECTION : Supprime d'abord toutes les politiques RLS
-- avant de modifier la structure de la table
-- ============================================

-- ============================================
-- ÉTAPE 0 : NETTOYER LES POLITIQUES RLS EN PREMIER
-- ============================================

DO $$ 
BEGIN
    -- Vérifier si la table existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        
        -- DÉSACTIVER RLS EN PREMIER
        ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
        
        -- SUPPRIMER TOUTES LES POLITIQUES EXISTANTES
        DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
        DROP POLICY IF EXISTS "Users can be created by authenticated users" ON public.users;
        DROP POLICY IF EXISTS "Users can be updated by themselves or admins" ON public.users;
        DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
        DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
        DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
        DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
        DROP POLICY IF EXISTS "Public read access" ON public.users;
        DROP POLICY IF EXISTS "Public write access" ON public.users;
        
    END IF;
END $$;

-- ============================================
-- ÉTAPE 1 : Modifier la structure de la table
-- ============================================

-- Supprimer le champ password_hash (Supabase Auth gère les mots de passe)
ALTER TABLE IF EXISTS public.users DROP COLUMN IF EXISTS password_hash;

-- Supprimer les contraintes de foreign key existantes
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
    END IF;
END $$;

-- Créer la table users si elle n'existe pas (sans password_hash)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    login TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('administrateur', 'utilisateur', 'redacteur')),
    profile_image TEXT,
    description TEXT,
    detail TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter la référence à auth.users si la colonne id est UUID
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'id'
        AND data_type = 'uuid'
    ) THEN
        -- Ajouter la contrainte de foreign key si elle n'existe pas
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'users_id_fkey' 
            AND table_name = 'users'
            AND table_schema = 'public'
        ) THEN
            BEGIN
                ALTER TABLE public.users 
                    ADD CONSTRAINT users_id_fkey 
                    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
            EXCEPTION WHEN OTHERS THEN
                -- Ignorer l'erreur si la contrainte existe déjà
                NULL;
            END;
        END IF;
    END IF;
END $$;

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_users_login ON public.users(login);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- ============================================
-- ÉTAPE 2 : Fonctions et triggers
-- ============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profil après inscription
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

-- Trigger pour créer automatiquement un profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ÉTAPE 3 : Réactiver RLS et créer les politiques
-- ============================================

-- Activer RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques (au cas où)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Public read access" ON public.users;
DROP POLICY IF EXISTS "Public write access" ON public.users;

-- Politique : Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Politique : Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Politique : Les administrateurs peuvent voir tous les profils
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
CREATE POLICY "Admins can update all profiles" ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND status = 'administrateur'
        )
    );

-- Politique : Permettre la création de profils (via service role key)
-- Cette politique permet la création via le script de migration
CREATE POLICY "Service role can insert users" ON public.users
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE public.users IS 'Profils utilisateurs liés à auth.users via l''ID. Les mots de passe sont gérés par Supabase Auth.';
COMMENT ON COLUMN public.users.id IS 'ID correspondant à auth.users.id (clé primaire et foreign key)';
COMMENT ON COLUMN public.users.login IS 'Identifiant unique de connexion';
COMMENT ON COLUMN public.users.status IS 'Rôle de l''utilisateur (administrateur, utilisateur, redacteur)';

-- ============================================
-- FIN DU SCRIPT
-- ============================================

-- Vérification : Afficher la structure de la table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

