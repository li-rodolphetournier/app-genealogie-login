import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const messagesFile = path.join(process.cwd(), 'src/data/messages.json');

// Fonction utilitaire pour lire les messages
function readMessages() {
  try {
    if (!fs.existsSync(messagesFile)) {
      fs.writeFileSync(messagesFile, '[]', 'utf-8');
      return [];
    }
    const data = fs.readFileSync(messagesFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors de la lecture des messages:', error);
    return [];
  }
}

// Fonction utilitaire pour écrire les messages
function writeMessages(messages: any[]) {
  try {
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erreur lors de l\'écriture des messages:', error);
    throw error;
  }
}

// GET - Récupérer tous les messages
export async function GET() {
  try {
    const messages = readMessages();
    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la lecture des messages' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau message
export async function POST(request: Request) {
  try {
    const newMessage = await request.json();
    const messages = readMessages();
    
    // Ajouter le nouveau message
    messages.push(newMessage);
    
    // Sauvegarder dans le fichier
    writeMessages(messages);
    
    return NextResponse.json(
      { message: 'Message enregistré avec succès', data: newMessage },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création du message:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du message' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un message
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID du message manquant' },
        { status: 400 }
      );
    }

    const messages = readMessages();
    const filteredMessages = messages.filter((message: any) => message.id !== id);

    writeMessages(filteredMessages);

    return NextResponse.json(
      { message: 'Message supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du message' },
      { status: 500 }
    );
  }
} 