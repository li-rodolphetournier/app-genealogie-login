/**
 * EXEMPLES D'API ROUTES AVEC SUPABASE
 * 
 * Ces exemples montrent comment remplacer les opérations sur fichiers JSON
 * par des opérations Supabase dans vos API routes.
 */

// ============================================
// EXEMPLE 1: API Route pour GET users
// ============================================

// AVANT (avec fichiers JSON):
/*
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const usersPath = path.join(process.cwd(), 'src/data/users.json');
  const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
  return res.status(200).json(users);
}
*/

// APRÈS (avec Supabase):
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, login, email, status, profile_image, description, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(users);
}

// ============================================
// EXEMPLE 2: API Route pour GET user par login
// ============================================

export async function GET_USER(request: Request, { params }: { params: { login: string } }) {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('id, login, email, status, profile_image, description, detail')
    .eq('login', params.login)
    .single();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Utilisateur non trouvé' },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}

// ============================================
// EXEMPLE 3: API Route pour POST user (création)
// ============================================

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  
  const { login, email, password, status, profile_image, description } = body;

  // Hasher le mot de passe
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash(password, 10);

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      login,
      email,
      password_hash: passwordHash,
      status: status || 'utilisateur',
      profile_image: profile_image || null,
      description: description || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  // Ne pas retourner le hash du mot de passe
  const { password_hash, ...userWithoutPassword } = user;
  return NextResponse.json(userWithoutPassword, { status: 201 });
}

// ============================================
// EXEMPLE 4: API Route pour login
// ============================================

export async function POST_LOGIN(request: Request) {
  const supabase = await createClient();
  const { login, password } = await request.json();

  // Récupérer l'utilisateur
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('login', login)
    .single();

  if (userError || !user) {
    return NextResponse.json(
      { message: 'Identifiants incorrects' },
      { status: 401 }
    );
  }

  // Vérifier le mot de passe
  const bcrypt = require('bcrypt');
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    return NextResponse.json(
      { message: 'Identifiants incorrects' },
      { status: 401 }
    );
  }

  // Ne pas retourner le hash du mot de passe
  const { password_hash, ...userWithoutPassword } = user;
  return NextResponse.json({ user: userWithoutPassword });
}

// ============================================
// EXEMPLE 5: API Route pour GET objects
// ============================================

export async function GET_OBJECTS() {
  const supabase = await createClient();

  const { data: objects, error } = await supabase
    .from('objects')
    .select(`
      *,
      object_photos (
        id,
        url,
        description,
        display_order
      ),
      users:utilisateur_id (
        login,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Transformer les données au format attendu
  const transformedObjects = objects?.map(obj => ({
    id: obj.id,
    nom: obj.nom,
    type: obj.type,
    status: obj.status,
    utilisateur: obj.users?.login || obj.utilisateur_id,
    description: obj.description,
    longDescription: obj.long_description,
    photos: (obj.object_photos || []).map((photo: any) => ({
      url: photo.url,
      description: photo.description || [],
    })),
  }));

  return NextResponse.json(transformedObjects);
}

// ============================================
// EXEMPLE 6: API Route pour GET messages
// ============================================

export async function GET_MESSAGES() {
  const supabase = await createClient();

  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      message_images (
        url,
        display_order
      ),
      users:user_id (
        login
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Transformer les données au format attendu
  const transformedMessages = messages?.map(msg => ({
    id: msg.id,
    title: msg.title,
    content: msg.content,
    images: (msg.message_images || []).map((img: any) => img.url),
    date: msg.created_at,
    userName: msg.users?.login || null,
  }));

  return NextResponse.json(transformedMessages);
}

// ============================================
// EXEMPLE 7: API Route pour GET persons (généalogie)
// ============================================

export async function GET_PERSONS() {
  const supabase = await createClient();

  const { data: persons, error } = await supabase
    .from('persons')
    .select('*')
    .order('date_naissance', { ascending: true, nullsFirst: true });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Transformer les données au format attendu
  const transformedPersons = persons?.map(person => ({
    id: person.id,
    nom: person.nom,
    prenom: person.prenom,
    genre: person.genre,
    description: person.description,
    detail: person.detail || null,
    mere: person.mere_id || null,
    pere: person.pere_id || null,
    ordreNaissance: person.ordre_naissance,
    dateNaissance: person.date_naissance,
    dateDeces: person.date_deces || null,
    image: person.image || null,
  }));

  return NextResponse.json(transformedPersons);
}

// ============================================
// EXEMPLE 8: API Route pour POST object (création)
// ============================================

export async function POST_OBJECT(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const {
    id,
    nom,
    type,
    status,
    utilisateur,
    description,
    longDescription,
    photos,
  } = body;

  // Récupérer l'ID de l'utilisateur depuis le login
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('login', utilisateur)
    .single();

  // Insérer l'objet
  const { data: object, error: objectError } = await supabase
    .from('objects')
    .insert({
      id: id || Date.now().toString(),
      nom,
      type,
      status: status || 'brouillon',
      utilisateur_id: user?.id || null,
      description: description || null,
      long_description: longDescription || null,
    })
    .select()
    .single();

  if (objectError) {
    return NextResponse.json(
      { error: objectError.message },
      { status: 400 }
    );
  }

  // Insérer les photos si présentes
  if (photos && photos.length > 0) {
    const photosToInsert = photos.map((photo: any, index: number) => ({
      object_id: object.id,
      url: photo.url,
      description: photo.description || [],
      display_order: index,
    }));

    await supabase.from('object_photos').insert(photosToInsert);
  }

  return NextResponse.json(object, { status: 201 });
}

// ============================================
// EXEMPLE 9: Gestion des erreurs avec try/catch
// ============================================

export async function GET_SAFE() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erreur API:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

