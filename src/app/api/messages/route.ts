import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import { messageCreateSchema, messageUpdateSchema } from '@/lib/validations';
import { validateWithSchema, createValidationErrorResponse } from '@/lib/validations/utils';
import { getErrorMessage } from '@/lib/errors/messages';
import type { Message } from '@/types/message';
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
      { error: getErrorMessage('SERVER_ERROR') },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau message
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validation Zod
    const validation = validateWithSchema(messageCreateSchema, body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }
    
    const { title, content, images, userId, userName } = validation.data;

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
    
    // Revalider le cache (messages et page d'accueil qui affiche le dernier message)
    revalidatePath('/messages', 'page');
    revalidatePath('/accueil', 'page');
    
    return NextResponse.json<SuccessResponse<Message>>(
      { message: 'Message enregistré avec succès', data: newMessage },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création du message:', error);
    return NextResponse.json<ErrorResponse>(
      { error: getErrorMessage('MESSAGE_CREATE_FAILED') },
      { status: 500 }
    );
  }
}

// PUT - Modifier un message
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('VALIDATION_ERROR') },
        { status: 400 }
      );
    }

    // Validation Zod pour les données de mise à jour
    const validation = validateWithSchema(messageUpdateSchema, updateData);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const messages = await readMessages();
    const messageIndex = messages.findIndex(msg => msg.id === id);
    
    if (messageIndex === -1) {
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('MESSAGE_NOT_FOUND') },
        { status: 404 }
      );
    }

    // Mettre à jour le message
    const updatedMessage: Message = {
      ...messages[messageIndex],
      ...validation.data,
      updated_at: new Date().toISOString(),
    };
    
    messages[messageIndex] = updatedMessage;
    await writeMessages(messages);
    
    // Revalider le cache
    revalidatePath('/messages', 'page');
    revalidatePath('/accueil', 'page');
    
    return NextResponse.json<SuccessResponse<Message>>(
      { message: 'Message modifié avec succès', data: updatedMessage },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la modification du message:', error);
    return NextResponse.json<ErrorResponse>(
      { error: getErrorMessage('MESSAGE_UPDATE_FAILED') },
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
        { error: getErrorMessage('VALIDATION_ERROR') },
        { status: 400 }
      );
    }

    const messages = await readMessages();
    const filteredMessages = messages.filter(msg => msg.id !== id);

    if (messages.length === filteredMessages.length) {
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('MESSAGE_NOT_FOUND') },
        { status: 404 }
      );
    }

    await writeMessages(filteredMessages);

    // Revalider le cache
    revalidatePath('/messages', 'page');
    revalidatePath('/accueil', 'page');

    return NextResponse.json<SuccessResponse>(
      { message: 'Message supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error);
    return NextResponse.json<ErrorResponse>(
      { error: getErrorMessage('MESSAGE_DELETE_FAILED') },
      { status: 500 }
    );
  }
} 