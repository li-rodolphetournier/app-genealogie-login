-- ============================================
-- DÉSACTIVER LE TRIGGER POUR LA MIGRATION
-- ============================================
-- 
-- Le trigger handle_new_user cause des erreurs lors de la création
-- Désactivons-le temporairement pour la migration
--

-- Désactiver le trigger
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Vérifier que le trigger est désactivé
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Note : Après la migration réussie, réactiver avec :
-- ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

