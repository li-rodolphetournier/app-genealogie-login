import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { messageCreateSchema, messageUpdateSchema } from '@/lib/validations';
import { validateWithSchema, createValidationErrorResponse } from '@/lib/validations/utils';
import { getErrorMessage } from '@/lib/errors/messages';
import type { Message } from '@/types/message';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

// GET - Récupérer tous les messages
export async function GET() {
  try {
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
      console.error('Erreur Supabase lors de la récupération des messages:', error);
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('SERVER_ERROR') },
        { status: 500 }
      );
    }

    // Mapper les données Supabase vers Message
    const mappedMessages: Message[] = (messages || []).map((msg: any) => {
      const images = (msg.message_images || [])
        .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
        .map((img: any) => img.url);

      return {
        id: msg.id,
        title: msg.title,
        content: msg.content,
        images: images.length > 0 ? images : [],
        userId: msg.user_id || '',
        userName: '', // À récupérer depuis users si nécessaire
        display_on_home: msg.display_on_home ?? false, // Si la colonne n'existe pas, sera undefined, donc false
        date: msg.created_at,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
      };
    });

    return NextResponse.json<Message[]>(mappedMessages, { status: 200 });
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
    
    const { title, content, images, userId, userName, display_on_home } = validation.data;
    const supabase = await createServiceRoleClient();

    // Récupérer l'ID utilisateur depuis le login si nécessaire
    let userIdUuid: string | null = null;
    if (userId) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('login', userId)
        .single();
      userIdUuid = user?.id || null;
    }

    // Créer le message
    const insertData: any = {
      title,
      content,
      user_id: userIdUuid,
    };
    
    // Ajouter display_on_home si disponible (peut ne pas exister si la migration n'a pas été exécutée)
    insertData.display_on_home = display_on_home ?? false;
    
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert(insertData)
      .select()
      .single();

    if (messageError || !newMessage) {
      console.error('Erreur création message:', messageError);
      
      // Vérifier si l'erreur est due à une colonne manquante
      if (messageError?.message?.includes('display_on_home')) {
        return NextResponse.json<ErrorResponse>(
          { error: 'La colonne display_on_home n\'existe pas. Veuillez exécuter la migration SQL: supabase/migration-add-display-on-home.sql' },
          { status: 500 }
        );
      }
      
      return NextResponse.json<ErrorResponse>(
        { error: `Erreur lors de la création du message: ${messageError?.message || 'Erreur inconnue'}` },
        { status: 500 }
      );
    }

    // Créer les images si présentes
    if (images && images.length > 0) {
      const imagesToInsert = images.map((url: string, index: number) => ({
        message_id: newMessage.id,
        url,
        display_order: index,
      }));

      const { error: imagesError } = await supabase
        .from('message_images')
        .insert(imagesToInsert);

      if (imagesError) {
        console.error('Erreur création images:', imagesError);
        // Supprimer le message si les images échouent
        await supabase.from('messages').delete().eq('id', newMessage.id);
        return NextResponse.json<ErrorResponse>(
          { error: 'Erreur lors de la création des images' },
          { status: 500 }
        );
      }
    }

    // Récupérer le message complet avec images
    const { data: completeMessage } = await supabase
      .from('messages')
      .select(`
        *,
        message_images (
          id,
          url,
          display_order
        )
      `)
      .eq('id', newMessage.id)
      .single();

    const messageImages = (completeMessage!.message_images || [])
      .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
      .map((img: any) => img.url);

    const messageData: Message = {
      id: completeMessage!.id,
      title: completeMessage!.title,
      content: completeMessage!.content,
      images: messageImages,
      userId: userId || '',
      userName: userName || '',
      display_on_home: (completeMessage as any).display_on_home ?? false, // Si la colonne n'existe pas, sera undefined, donc false
      date: completeMessage!.created_at,
      created_at: completeMessage!.created_at,
      updated_at: completeMessage!.updated_at,
    };

    // Revalider le cache
    revalidatePath('/messages', 'page');
    revalidatePath('/accueil', 'page');
    
    return NextResponse.json<SuccessResponse<Message>>(
      { message: 'Message enregistré avec succès', data: messageData },
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

    const supabase = await createServiceRoleClient();

    // Vérifier que le message existe
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingMessage) {
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('MESSAGE_NOT_FOUND') },
        { status: 404 }
      );
    }

    // Préparer les données de mise à jour
    const updateFields: Record<string, any> = {};
    
    if (validation.data.title !== undefined) updateFields.title = validation.data.title;
    if (validation.data.content !== undefined) updateFields.content = validation.data.content;
    if (validation.data.display_on_home !== undefined) updateFields.display_on_home = validation.data.display_on_home;

    // Mettre à jour le message
    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedMessage) {
      console.error('Erreur mise à jour message:', updateError);
      
      // Vérifier si l'erreur est due à une colonne manquante
      if (updateError?.message?.includes('display_on_home')) {
        return NextResponse.json<ErrorResponse>(
          { error: 'La colonne display_on_home n\'existe pas. Veuillez exécuter la migration SQL: supabase/migration-add-display-on-home.sql' },
          { status: 500 }
        );
      }
      
      return NextResponse.json<ErrorResponse>(
        { error: `Erreur lors de la mise à jour: ${updateError?.message || getErrorMessage('MESSAGE_UPDATE_FAILED')}` },
        { status: 500 }
      );
    }

    // Mettre à jour les images si présentes
    if (validation.data.images !== undefined) {
      // Supprimer les anciennes images
      await supabase
        .from('message_images')
        .delete()
        .eq('message_id', id);

      // Insérer les nouvelles images
      if (validation.data.images.length > 0) {
        const imagesToInsert = validation.data.images.map((url: string, index: number) => ({
          message_id: id,
          url,
          display_order: index,
        }));

        const { error: imagesError } = await supabase
          .from('message_images')
          .insert(imagesToInsert);

        if (imagesError) {
          console.error('Erreur mise à jour images:', imagesError);
        }
      }
    }

    // Récupérer le message complet avec images
    const { data: completeMessage } = await supabase
      .from('messages')
      .select(`
        *,
        message_images (
          id,
          url,
          display_order
        )
      `)
      .eq('id', id)
      .single();

    const messageImages = (completeMessage!.message_images || [])
      .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
      .map((img: any) => img.url);

    const messageData: Message = {
      id: completeMessage!.id,
      title: completeMessage!.title,
      content: completeMessage!.content,
      images: messageImages,
      userId: completeMessage!.user_id || '',
      userName: validation.data.userName || '',
      display_on_home: completeMessage!.display_on_home ?? false,
      date: completeMessage!.created_at,
      created_at: completeMessage!.created_at,
      updated_at: completeMessage!.updated_at,
    };

    // Revalider le cache
    revalidatePath('/messages', 'page');
    revalidatePath('/accueil', 'page');
    
    return NextResponse.json<SuccessResponse<Message>>(
      { message: 'Message modifié avec succès', data: messageData },
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

    const supabase = await createServiceRoleClient();

    // Vérifier que le message existe
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingMessage) {
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('MESSAGE_NOT_FOUND') },
        { status: 404 }
      );
    }

    // Supprimer le message (les images seront supprimées automatiquement grâce à CASCADE)
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Erreur suppression message:', deleteError);
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('MESSAGE_DELETE_FAILED') },
        { status: 500 }
      );
    }

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
