/**
 * Script pour migrer les catégories existantes depuis la table objects
 * vers la nouvelle table object_categories
 */

import { createServiceRoleClient } from '../src/lib/supabase/server';
import { resolve } from 'path';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function migrateCategories() {
  console.log('🔄 Début de la migration des catégories...\n');

  try {
    const supabase = await createServiceRoleClient();

    // Récupérer toutes les catégories distinctes depuis la table objects
    console.log('📋 Récupération des catégories depuis la table objects...');
    const { data: objects, error: objectsError } = await supabase
      .from('objects')
      .select('type')
      .not('type', 'is', null)
      .neq('type', '');

    if (objectsError) {
      throw new Error(`Erreur lors de la récupération des objets: ${objectsError.message}`);
    }

    const uniqueCategories = [...new Set((objects || []).map((obj: any) => obj.type).filter(Boolean))];
    console.log(`✅ ${uniqueCategories.length} catégorie(s) unique(s) trouvée(s)\n`);

    if (uniqueCategories.length === 0) {
      console.log('⚠️  Aucune catégorie à migrer.');
      return;
    }

    // Vérifier si la table object_categories existe
    console.log('🔍 Vérification de la table object_categories...');
    const { data: existingCategories, error: tableError } = await supabase
      .from('object_categories')
      .select('name');

    if (tableError) {
      if (tableError.message.includes('does not exist') || tableError.code === 'PGRST204') {
        console.error('❌ La table object_categories n\'existe pas encore.');
        console.error('   Veuillez d\'abord exécuter la migration SQL:');
        console.error('   supabase/migrations/create_object_categories.sql\n');
        return;
      }
      throw tableError;
    }

    const existingNames = new Set((existingCategories || []).map((cat: any) => cat.name));
    const categoriesToInsert = uniqueCategories.filter((cat) => !existingNames.has(cat));

    if (categoriesToInsert.length === 0) {
      console.log('✅ Toutes les catégories existent déjà dans la table object_categories.\n');
      return;
    }

    console.log(`📝 ${categoriesToInsert.length} nouvelle(s) catégorie(s) à insérer:\n`);

    // Insérer les nouvelles catégories
    let inserted = 0;
    let errors = 0;

    for (const categoryName of categoriesToInsert) {
      const { error: insertError } = await supabase
        .from('object_categories')
        .insert({
          name: categoryName,
          description: null,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          // Déjà existante (conflit de clé unique)
          console.log(`   ⚠️  "${categoryName}" existe déjà (ignoré)`);
        } else {
          console.error(`   ❌ Erreur pour "${categoryName}": ${insertError.message}`);
          errors++;
        }
      } else {
        console.log(`   ✅ "${categoryName}" ajoutée`);
        inserted++;
      }
    }

    console.log(`\n✨ Migration terminée:`);
    console.log(`   ✅ ${inserted} catégorie(s) insérée(s)`);
    if (errors > 0) {
      console.log(`   ❌ ${errors} erreur(s)`);
    }

    // Afficher le total final
    const { data: finalCategories } = await supabase
      .from('object_categories')
      .select('name');

    console.log(`\n📊 Total: ${finalCategories?.length || 0} catégorie(s) dans la table object_categories\n`);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

migrateCategories();

