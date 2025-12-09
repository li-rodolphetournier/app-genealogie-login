-- Migration pour créer la table object_categories
-- Permet de gérer les catégories d'objets de manière centralisée

CREATE TABLE IF NOT EXISTS public.object_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_object_categories_name ON public.object_categories(name);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_object_categories_updated_at BEFORE UPDATE ON public.object_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE public.object_categories ENABLE ROW LEVEL SECURITY;

-- Politique : tous les utilisateurs authentifiés peuvent lire les catégories
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les catégories"
    ON public.object_categories
    FOR SELECT
    TO authenticated
    USING (true);

-- Politique : seuls les administrateurs peuvent créer, modifier et supprimer
CREATE POLICY "Seuls les administrateurs peuvent créer des catégories"
    ON public.object_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.status = 'administrateur'
        )
    );

CREATE POLICY "Seuls les administrateurs peuvent modifier des catégories"
    ON public.object_categories
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.status = 'administrateur'
        )
    );

CREATE POLICY "Seuls les administrateurs peuvent supprimer des catégories"
    ON public.object_categories
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.status = 'administrateur'
        )
    );

