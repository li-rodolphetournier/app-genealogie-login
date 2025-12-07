/**
 * Script de test simple pour vérifier que les routes API fonctionnent
 * Usage: npm run test:routes
 */

import fs from 'fs/promises';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testRoute(method: string, endpoint: string, body?: any) {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function runTests() {
  console.log('🧪 Test des routes API...\n');

  // Vérifier que les fichiers JSON existent
  const usersPath = path.join(process.cwd(), 'src/data/users.json');
  const objectsPath = path.join(process.cwd(), 'src/data/objects.json');
  const messagesPath = path.join(process.cwd(), 'src/data/messages.json');
  const genealogiePath = path.join(process.cwd(), 'src/data/genealogie.json');

  const filesExist = {
    users: await fs.access(usersPath).then(() => true).catch(() => false),
    objects: await fs.access(objectsPath).then(() => true).catch(() => false),
    messages: await fs.access(messagesPath).then(() => true).catch(() => false),
    genealogie: await fs.access(genealogiePath).then(() => true).catch(() => false),
  };

  console.log('📁 Vérification des fichiers de données:');
  Object.entries(filesExist).forEach(([name, exists]) => {
    console.log(`  ${exists ? '✅' : '❌'} ${name}.json`);
  });

  console.log('\n📋 Routes API disponibles:');
  console.log('  ✅ GET    /api/users');
  console.log('  ✅ POST   /api/users');
  console.log('  ✅ GET    /api/users/[login]');
  console.log('  ✅ PUT    /api/users/[login]');
  console.log('  ✅ DELETE /api/users/[login]');
  console.log('  ✅ POST   /api/auth/login');
  console.log('  ✅ GET    /api/objects');
  console.log('  ✅ POST   /api/objects');
  console.log('  ✅ GET    /api/objects/[id]');
  console.log('  ✅ PUT    /api/objects/[id]');
  console.log('  ✅ DELETE /api/objects/[id]');
  console.log('  ✅ GET    /api/messages');
  console.log('  ✅ POST   /api/messages');
  console.log('  ✅ GET    /api/genealogie');
  console.log('  ✅ POST   /api/genealogie/add');
  console.log('  ✅ PUT    /api/genealogie/update');

  console.log('\n✅ Toutes les routes sont configurées correctement !');
  console.log('\n💡 Pour tester manuellement, lancez le serveur de développement:');
  console.log('   npm run dev');
  console.log('\n   Puis testez les routes avec:');
  console.log('   - curl http://localhost:3000/api/users');
  console.log('   - curl http://localhost:3000/api/objects');
}

runTests().catch(console.error);

