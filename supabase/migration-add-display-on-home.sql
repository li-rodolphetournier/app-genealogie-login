-- Migration: Ajouter le champ display_on_home à la table messages
-- Date: 2025-01-XX
-- Description: Permet de contrôler quels messages s'affichent sur la page d'accueil

-- Ajouter la colonne display_on_home (booléen, par défaut false)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS display_on_home BOOLEAN DEFAULT false NOT NULL;

-- Créer un index pour améliorer les performances des requêtes filtrées
CREATE INDEX IF NOT EXISTS idx_messages_display_on_home 
ON public.messages(display_on_home) 
WHERE display_on_home = true;

-- Commentaire sur la colonne
COMMENT ON COLUMN public.messages.display_on_home IS 
'Indique si le message doit être affiché sur la page d''accueil. Si true, le message sera visible sur /accueil.';

