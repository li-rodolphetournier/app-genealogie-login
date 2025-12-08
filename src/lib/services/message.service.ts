/**
 * Service pour la gestion des messages
 * Couche d'accès aux données (DAL) - Utilise Supabase
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Message, MessageCreateInput, MessageUpdateInput } from '@/types/message';

export class MessageService {
  /**
   * Récupérer tous les messages
   */
  static async findAll(): Promise<Message[]> {
    const supabase = await createServiceRoleClient();
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        message_images (
          id,
          url,
          display_order
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des messages: ${error.message}`);
    }

    return (messages || []).map((msg: any) => {
      const images = (msg.message_images || [])
        .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
        .map((img: any) => img.url);

      return {
        id: msg.id,
        title: msg.title,
        content: msg.content,
        images: images.length > 0 ? images : [],
        userId: msg.user_id || '',
        userName: '',
        date: msg.created_at,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
      };
    });
  }

  /**
   * Récupérer le dernier message (le plus récent par date)
   */
  static async findLast(): Promise<Message | null> {
    const messages = await this.findAll();
    return messages.length > 0 ? messages[0] : null;
  }

  /**
   * Créer un message
   */
  static async create(input: MessageCreateInput): Promise<Message> {
    const supabase = await createServiceRoleClient();

    let userIdUuid: string | null = null;
    if (input.userId) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('login', input.userId)
        .single();
      userIdUuid = user?.id || null;
    }

    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        title: input.title,
        content: input.content,
        user_id: userIdUuid,
      })
      .select()
      .single();

    if (messageError || !newMessage) {
      throw new Error(`Erreur lors de la création du message: ${messageError?.message || 'Erreur inconnue'}`);
    }

    if (input.images && input.images.length > 0) {
      const imagesToInsert = input.images.map((url: string, index: number) => ({
        message_id: newMessage.id,
        url,
        display_order: index,
      }));

      const { error: imagesError } = await supabase
        .from('message_images')
        .insert(imagesToInsert);

      if (imagesError) {
        await supabase.from('messages').delete().eq('id', newMessage.id);
        throw new Error(`Erreur lors de la création des images: ${imagesError.message}`);
      }
    }

    const messages = await this.findAll();
    const created = messages.find(m => m.id === newMessage.id);
    if (!created) {
      throw new Error('Erreur lors de la récupération du message créé');
    }

    return created;
  }

  /**
   * Mettre à jour un message
   */
  static async update(id: string, input: MessageUpdateInput): Promise<Message> {
    const supabase = await createServiceRoleClient();

    const updateFields: Record<string, any> = {};
    if (input.title !== undefined) updateFields.title = input.title;
    if (input.content !== undefined) updateFields.content = input.content;

    const { error: updateError } = await supabase
      .from('messages')
      .update(updateFields)
      .eq('id', id);

    if (updateError) {
      throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
    }

    if (input.images !== undefined) {
      await supabase.from('message_images').delete().eq('message_id', id);
      if (input.images.length > 0) {
        const imagesToInsert = input.images.map((url: string, index: number) => ({
          message_id: id,
          url,
          display_order: index,
        }));
        await supabase.from('message_images').insert(imagesToInsert);
      }
    }

    const messages = await this.findAll();
    const updated = messages.find(m => m.id === id);
    if (!updated) {
      throw new Error('Erreur lors de la récupération du message mis à jour');
    }

    return updated;
  }

  /**
   * Supprimer un message
   */
  static async delete(id: string): Promise<void> {
    const supabase = await createServiceRoleClient();
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }
  }
}
