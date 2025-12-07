-- ============================================
-- CORRECTION : Permettre au trigger d'insérer dans users
-- ============================================

-- Le trigger handle_new_user doit pouvoir insérer même avec RLS activé
-- La fonction est SECURITY DEFINER, mais RLS s'applique toujours

-- Solution : Ajouter une politique pour permettre les insertions du trigger
CREATE POLICY "Allow trigger insert" ON public.users
    FOR INSERT
    WITH CHECK (true);

-- Alternative : Modifier la fonction pour qu'elle soit exempte de RLS
-- (en utilisant SECURITY DEFINER avec SET LOCAL)

-- Si la politique existe déjà, on la supprime d'abord
DROP POLICY IF EXISTS "Allow trigger insert" ON public.users;

-- Créer la politique pour permettre l'insertion par le trigger
CREATE POLICY "Allow trigger insert" ON public.users
    FOR INSERT
    WITH CHECK (true);

-- Vérifier que la fonction peut insérer
-- La fonction handle_new_user utilise SECURITY DEFINER mais RLS bloque quand même
-- On doit donc avoir une politique qui permet l'insertion

