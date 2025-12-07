import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Message, MessageCreateInput, MessageUpdateInput } from '@/types/message';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

const messagesFile = path.join(process.cwd(), 'src/data/messages.json');

// Fonction utilitaire pour lire les messages
async function readMessages(): Promise<Message[]> {
  try {
    const data = await fs.readFile(messagesFile, 'utf-8');
    return JSON.parse(data) as Message[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(messagesFile, '[]', 'utf-8');
      return [];
    }
    console.error('Erreur lors de la lecture des messages:', error);
    return [];
  }
}

// Fonction utilitaire pour écrire les messages
async function writeMessages(messages: Message[]): Promise<void> {
  try {
    await fs.writeFile(messagesFile, JSON.stringify(messages, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erreur lors de l\'écriture des messages:', error);
    throw error;
  }
}

// GET - Récupérer tous les messages
export async function GET() {
  try {
    const messages = await readMessages();
    return NextResponse.json<Message[]>(messages, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la lecture des messages:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur lors de la lecture des messages' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau message
export async function POST(request: Request) {
  try {
    const body: MessageCreateInput = await request.json();
    const { title, content, images, userId, userName } = body;

    // Validation
    if (!title || !content || !userId || !userName) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Champs obligatoires (title, content, userId, userName) manquants' },
        { status: 400 }
      );
    }

    const messages = await readMessages();
    
    // Créer le nouveau message
    const newMessage: Message = {
      id: Date.now().toString(),
      title,
      content,
      images: images || [],
      userId,
      userName,
      date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    messages.push(newMessage);
    await writeMessages(messages);
    
    return NextResponse.json<SuccessResponse<Message>>(
      { message: 'Message enregistré avec succès', data: newMessage },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création du message:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur lors de la création du message' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un message
export async function PUT(request: Request) {
  try {
    const body: MessageUpdateInput & { id: string } = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json<ErrorResponse>(
        { error: 'ID du message manquant' },
        { status: 400 }
      );
    }

    const messages = await readMessages();
    const messageIndex = messages.findIndex(msg => msg.id === id);
    
    if (messageIndex === -1) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Message non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le message
    const updatedMessage: Message = {
      ...messages[messageIndex],
      ...updateData,
      updated_at: new Date().toISOString(),
    };
    
    messages[messageIndex] = updatedMessage;
    await writeMessages(messages);
    
    return NextResponse.json<SuccessResponse<Message>>(
      { message: 'Message modifié avec succès', data: updatedMessage },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la modification du message:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur lors de la modification du message' },
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
      return NextResponse.json<ErrorResponse>(
        { error: 'ID du message manquant' },
        { status: 400 }
      );
    }

    const messages = await readMessages();
    const filteredMessages = messages.filter(msg => msg.id !== id);

    if (messages.length === filteredMessages.length) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Message non trouvé' },
        { status: 404 }
      );
    }

    await writeMessages(filteredMessages);

    return NextResponse.json<SuccessResponse>(
      { message: 'Message supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur lors de la suppression du message' },
      { status: 500 }
    );
  }
} 