/**
 * Page Server Component pour l'administration des messages
 * Récupère les messages initiaux côté serveur et les passe au composant client
 */

import { MessageService } from '@/lib/services';
import { MessagesClient } from './messages-client';

import type { Message } from '@/types/message';

export default async function MessagesAdministration() {
  // Récupération des messages initiaux côté serveur (triés par date décroissante)
  let messages: Message[] = [];
  try {
    const allMessages = await MessageService.findAll();
    // Trier les messages par date (plus récent en premier)
    messages = allMessages.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    // Continue avec un tableau vide en cas d'erreur
  }

  // Passer les données au composant client pour l'authentification admin et l'interactivité
  return <MessagesClient initialMessages={messages} />;
}
