import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const messagesFile = path.join(process.cwd(), 'src/data/messages.json');

interface Message {
  id: string;
  title: string;
  content: string;
  images: string[];
  date: string;
  userId: string;
  userName: string;
}

// Fonction utilitaire pour lire les messages
function readMessages(): Message[] {
  try {
    if (!fs.existsSync(messagesFile)) {
      fs.writeFileSync(messagesFile, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const data = fs.readFileSync(messagesFile, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Erreur lors de la lecture des messages:', err);
    return [];
  }
}

// Fonction utilitaire pour écrire les messages
function writeMessages(messages: Message[]): void {
  try {
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erreur lors de l\'écriture des messages:', err);
    throw err;
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const messages = readMessages();
    return NextResponse.json(messages);
  } catch (err) {
    console.error('Erreur lors de la lecture:', err);
    return NextResponse.json(
      { error: 'Erreur lors de la lecture des messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const newMessage = await request.json() as Message;
    const messages = readMessages();
    messages.push(newMessage);
    writeMessages(messages);
    
    return NextResponse.json(
      { message: 'Message enregistré avec succès', data: newMessage },
      { status: 201 }
    );
  } catch (err) {
    console.error('Erreur lors de la création:', err);
    return NextResponse.json(
      { error: 'Erreur lors de la création du message' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const updatedMessage = await request.json() as Message;
    const messages = readMessages();
    const index = messages.findIndex(msg => msg.id === updatedMessage.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Message non trouvé' },
        { status: 404 }
      );
    }

    messages[index] = updatedMessage;
    writeMessages(messages);
    
    return NextResponse.json(
      { message: 'Message modifié avec succès', data: updatedMessage },
      { status: 200 }
    );
  } catch (err) {
    console.error('Erreur lors de la modification:', err);
    return NextResponse.json(
      { error: 'Erreur lors de la modification du message' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
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
    const filteredMessages = messages.filter(message => message.id !== id);

    if (messages.length === filteredMessages.length) {
      return NextResponse.json(
        { error: 'Message non trouvé' },
        { status: 404 }
      );
    }

    writeMessages(filteredMessages);

    return NextResponse.json(
      { message: 'Message supprimé avec succès' },
      { status: 200 }
    );
  } catch (err) {
    console.error('Erreur lors de la suppression:', err);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du message' },
      { status: 500 }
    );
  }
} 