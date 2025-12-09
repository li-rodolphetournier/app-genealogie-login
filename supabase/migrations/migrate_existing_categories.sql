-- Migration pour migrer les catégories existantes depuis la table objects
-- vers la nouvelle table object_categories

-- Insérer toutes les catégories distinctes depuis la table objects
INSERT INTO public.object_categories (name, description)
SELECT DISTINCT 
    type AS name,
    NULL AS description
FROM public.objects
WHERE type IS NOT NULL
    AND type != ''
    AND NOT EXISTS (
        SELECT 1 FROM public.object_categories 
        WHERE object_categories.name = objects.type
    )
ON CONFLICT (name) DO NOTHING;

-- Optionnel : Ajouter un commentaire pour indiquer le nombre de catégories migrées
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count
    FROM public.object_categories;
    
    RAISE NOTICE 'Migration terminée : % catégories dans la table object_categories', migrated_count;
END $$;

