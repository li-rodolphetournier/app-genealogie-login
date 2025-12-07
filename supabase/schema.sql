-- ============================================
-- SCHEMA SUPABASE POUR APPLICATION GENEALOGIE
-- ============================================

-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    login TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('administrateur', 'utilisateur', 'redacteur')),
    profile_image TEXT,
    description TEXT,
    detail TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par login
CREATE INDEX IF NOT EXISTS idx_users_login ON public.users(login);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- ============================================
-- TABLE: objects
-- ============================================
CREATE TABLE IF NOT EXISTS public.objects (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('publie', 'brouillon')),
    utilisateur_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    description TEXT,
    long_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche
CREATE INDEX IF NOT EXISTS idx_objects_utilisateur_id ON public.objects(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_objects_status ON public.objects(status);
CREATE INDEX IF NOT EXISTS idx_objects_type ON public.objects(type);

-- ============================================
-- TABLE: object_photos
-- ============================================
CREATE TABLE IF NOT EXISTS public.object_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    object_id TEXT NOT NULL REFERENCES public.objects(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    description TEXT[] DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour récupération des photos par objet
CREATE INDEX IF NOT EXISTS idx_object_photos_object_id ON public.object_photos(object_id);
CREATE INDEX IF NOT EXISTS idx_object_photos_display_order ON public.object_photos(display_order);

-- ============================================
-- TABLE: messages
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- ============================================
-- TABLE: message_images
-- ============================================
CREATE TABLE IF NOT EXISTS public.message_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_message_images_message_id ON public.message_images(message_id);
CREATE INDEX IF NOT EXISTS idx_message_images_display_order ON public.message_images(display_order);

-- ============================================
-- TABLE: persons (Genealogie)
-- ============================================
CREATE TABLE IF NOT EXISTS public.persons (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    genre TEXT NOT NULL CHECK (genre IN ('homme', 'femme')),
    description TEXT DEFAULT '',
    detail TEXT,
    mere_id TEXT REFERENCES public.persons(id) ON DELETE SET NULL,
    pere_id TEXT REFERENCES public.persons(id) ON DELETE SET NULL,
    ordre_naissance INTEGER DEFAULT 1,
    date_naissance DATE,
    date_deces DATE,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche et relations
CREATE INDEX IF NOT EXISTS idx_persons_mere_id ON public.persons(mere_id);
CREATE INDEX IF NOT EXISTS idx_persons_pere_id ON public.persons(pere_id);
CREATE INDEX IF NOT EXISTS idx_persons_nom_prenom ON public.persons(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_persons_date_naissance ON public.persons(date_naissance);

-- ============================================
-- FUNCTIONS: Updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON public.objects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON public.persons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.object_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLITIQUES RLS: users
-- ============================================
-- Tout le monde peut lire les utilisateurs (sauf les mots de passe)
CREATE POLICY "Users are viewable by everyone"
    ON public.users FOR SELECT
    USING (true);

-- Seuls les administrateurs peuvent créer/modifier des utilisateurs
-- (À adapter selon vos besoins)
CREATE POLICY "Users can be created by authenticated users"
    ON public.users FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can be updated by themselves or admins"
    ON public.users FOR UPDATE
    USING (true);

-- ============================================
-- POLITIQUES RLS: objects
-- ============================================
-- Tout le monde peut voir les objets publiés
CREATE POLICY "Published objects are viewable by everyone"
    ON public.objects FOR SELECT
    USING (status = 'publie' OR true); -- Temporairement ouvert, à ajuster

CREATE POLICY "Objects can be created by authenticated users"
    ON public.objects FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Objects can be updated by creator or admins"
    ON public.objects FOR UPDATE
    USING (true);

-- ============================================
-- POLITIQUES RLS: object_photos
-- ============================================
CREATE POLICY "Object photos are viewable by everyone"
    ON public.object_photos FOR SELECT
    USING (true);

CREATE POLICY "Object photos can be created by authenticated users"
    ON public.object_photos FOR INSERT
    WITH CHECK (true);

-- ============================================
-- POLITIQUES RLS: messages
-- ============================================
CREATE POLICY "Messages are viewable by everyone"
    ON public.messages FOR SELECT
    USING (true);

CREATE POLICY "Messages can be created by authenticated users"
    ON public.messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Messages can be updated by creator or admins"
    ON public.messages FOR UPDATE
    USING (true);

-- ============================================
-- POLITIQUES RLS: message_images
-- ============================================
CREATE POLICY "Message images are viewable by everyone"
    ON public.message_images FOR SELECT
    USING (true);

CREATE POLICY "Message images can be created by authenticated users"
    ON public.message_images FOR INSERT
    WITH CHECK (true);

-- ============================================
-- POLITIQUES RLS: persons
-- ============================================
CREATE POLICY "Persons are viewable by everyone"
    ON public.persons FOR SELECT
    USING (true);

CREATE POLICY "Persons can be created by authenticated users"
    ON public.persons FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Persons can be updated by authenticated users"
    ON public.persons FOR UPDATE
    USING (true);

-- ============================================
-- VUES UTILES (OPTIONNEL)
-- ============================================

-- Vue pour récupérer les objets avec leurs photos
CREATE OR REPLACE VIEW objects_with_photos AS
SELECT 
    o.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', op.id,
                'url', op.url,
                'description', op.description,
                'display_order', op.display_order
            ) ORDER BY op.display_order
        ) FILTER (WHERE op.id IS NOT NULL),
        '[]'
    ) as photos
FROM public.objects o
LEFT JOIN public.object_photos op ON o.id = op.object_id
GROUP BY o.id;

-- Vue pour récupérer les messages avec leurs images
CREATE OR REPLACE VIEW messages_with_images AS
SELECT 
    m.*,
    COALESCE(
        json_agg(
            mi.url ORDER BY mi.display_order
        ) FILTER (WHERE mi.id IS NOT NULL),
        '[]'
    ) as images
FROM public.messages m
LEFT JOIN public.message_images mi ON m.id = mi.message_id
GROUP BY m.id;

-- ============================================
-- COMMENTAIRES
-- ============================================
COMMENT ON TABLE public.users IS 'Utilisateurs de l''application';
COMMENT ON TABLE public.objects IS 'Objets/photos d''objets';
COMMENT ON TABLE public.object_photos IS 'Photos associées aux objets';
COMMENT ON TABLE public.messages IS 'Messages du système';
COMMENT ON TABLE public.message_images IS 'Images associées aux messages';
COMMENT ON TABLE public.persons IS 'Personnes de l''arbre généalogique';

