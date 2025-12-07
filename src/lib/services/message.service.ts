/**
 * Service pour la gestion des messages
 * Couche d'accès aux données (DAL)
 */

import fs from 'fs/promises';
import path from 'path';
import type { Message, MessageCreateInput, MessageUpdateInput } from '@/types/message';

const messagesPath = path.join(process.cwd(), 'src/data/messages.json');

async function readMessages(): Promise<Message[]> {
  try {
    const data = await fs.readFile(messagesPath, 'utf-8');
    return JSON.parse(data) as Message[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(messagesPath, '[]', 'utf-8');
      return [];
    }
    throw error;
  }
}

async function writeMessages(messages: Message[]): Promise<void> {
  await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2), 'utf-8');
}

export class MessageService {
  /**
   * Récupérer tous les messages
   */
  static async findAll(): Promise<Message[]> {
    return await readMessages();
  }

  /**
   * Récupérer le dernier message (le plus récent par date)
   */
  static async findLast(): Promise<Message | null> {
    const messages = await readMessages();
    if (messages.length === 0) return null;
    
    // Trier par date (plus récent en premier) et retourner le premier
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return sortedMessages[0];
  }

  /**
   * Créer un message
   */
  static async create(input: MessageCreateInput): Promise<Message> {
    const messages = await readMessages();

    const newMessage: Message = {
      id: Date.now().toString(),
      title: input.title,
      content: input.content,
      images: input.images || [],
      userId: input.userId,
      userName: input.userName,
      date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    messages.push(newMessage);
    await writeMessages(messages);

    return newMessage;
  }

  /**
   * Mettre à jour un message
   */
  static async update(id: string, input: MessageUpdateInput): Promise<Message> {
    const messages = await readMessages();
    const messageIndex = messages.findIndex(msg => msg.id === id);

    if (messageIndex === -1) {
      throw new Error('Message non trouvé');
    }

    const updatedMessage: Message = {
      ...messages[messageIndex],
      ...input,
      updated_at: new Date().toISOString(),
    };

    messages[messageIndex] = updatedMessage;
    await writeMessages(messages);

    return updatedMessage;
  }

  /**
   * Supprimer un message
   */
  static async delete(id: string): Promise<void> {
    const messages = await readMessages();
    const filteredMessages = messages.filter(msg => msg.id !== id);

    if (messages.length === filteredMessages.length) {
      throw new Error('Message non trouvé');
    }

    await writeMessages(filteredMessages);
  }
}

