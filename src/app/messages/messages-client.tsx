'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ToastProvider';
import { getErrorMessage } from '@/lib/errors/messages';
import { BackToHomeButton } from '@/components/navigation';
import { PageTransition } from '@/components/animations';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import type { Message } from '@/types/message';

type MessagesClientProps = {
  initialMessages: Message[];
};

export function MessagesClient({ initialMessages }: MessagesClientProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth({
    redirectIfUnauthenticated: true,
    redirectTo: '/',
  });
  const { showToast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState({
    title: '',
    content: '',
    images: [] as string[],
    display_on_home: false
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  // Vérifier que l'utilisateur est administrateur
  if (!isLoading && user && user.status !== 'administrateur') {
    router.push('/accueil');
    return null;
  }

  if (isLoading || !user) {
    return <div>Chargement...</div>;
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        // L'API peut retourner directement un tableau ou un objet avec data
        const messagesData = Array.isArray(data) ? data : (data.data || []);
        // Trier les messages par date (plus récent en premier)
        const sortedMessages = messagesData.sort((a: Message, b: Message) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast(getErrorMessage('FILE_TOO_LARGE'), 'error');
      event.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'messages');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setNewMessage(prev => ({
          ...prev,
          images: [...prev.images, data.imageUrl || data.filePath]
        }));
      } else {
        showToast(getErrorMessage('FILE_UPLOAD_FAILED'), 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast(getErrorMessage('FILE_UPLOAD_FAILED'), 'error');
    }

    // Réinitialiser l'input file
    event.target.value = '';
  };

  const removeImage = (indexToRemove: number) => {
    setNewMessage(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoadingMessages(true);

    try {
      let messageData;
      
      if (editingMessageId) {
        // Pour la mise à jour, on envoie seulement les champs modifiables
        messageData = {
          id: editingMessageId,
          title: newMessage.title,
          content: newMessage.content,
          images: newMessage.images || [],
          display_on_home: newMessage.display_on_home ?? false,
          userId: user.login, // Envoyer le login, pas l'UUID
          userName: user.login
        };
      } else {
        // Pour la création, on envoie tous les champs
        messageData = {
          id: uuidv4(),
          ...newMessage,
          display_on_home: newMessage.display_on_home ?? false,
          date: new Date().toISOString(),
          userId: user.login, // Envoyer le login, pas l'UUID
          userName: user.login
        };
      }

      const response = await fetch('/api/messages', {
        method: editingMessageId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        setNewMessage({ title: '', content: '', images: [], display_on_home: false });
        setEditingMessageId(null);
        await fetchMessages();
      } else {
        const error = await response.json();
        throw new Error(error.error || error.message);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du message:', error);
      const errorKey = editingMessageId ? 'MESSAGE_UPDATE_FAILED' : 'MESSAGE_CREATE_FAILED';
      showToast(getErrorMessage(errorKey), 'error');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setNewMessage({
      title: message.title,
      content: message.content,
      images: message.images,
      display_on_home: message.display_on_home ?? false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (messageId: string) => {
    setMessageToDelete(messageId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!messageToDelete) return;

    try {
      const response = await fetch(`/api/messages?id=${messageToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Message supprimé avec succès', 'success');
        await fetchMessages();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        showToast(errorData.error || getErrorMessage('MESSAGE_DELETE_FAILED'), 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast(getErrorMessage('MESSAGE_DELETE_FAILED'), 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setMessageToDelete(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setNewMessage({ title: '', content: '', images: [], display_on_home: false });
  };

  if (!user) return null;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
      {/* Header avec bouton retour */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Administration des Messages
          </h1>
          <BackToHomeButton variant='button' className="px-6 py-3 text-base bg-blue-600 hover:bg-blue-700" />
      
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Formulaire de création/modification */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6" id="form-title">
              {editingMessageId ? 'Modifier le message' : 'Créer un nouveau message'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6" aria-labelledby="form-title">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Titre
                </label>
                <input
                  id="title"
                  type="text"
                  value={newMessage.title}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700">
                  Images
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  aria-describedby="image-help"
                />
                <p id="image-help" className="mt-1 text-sm text-gray-500">
                  Format accepté : JPG, PNG. Taille maximale : 10MB
                </p>
                
                {newMessage.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {newMessage.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="relative aspect-square">
                          <Image
                            src={image}
                            alt={`Image ${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover rounded-md"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                          aria-label={`Supprimer l'image ${index + 1}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Contenu
                </label>
                <textarea
                  id="content"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  required
                  aria-required="true"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="display_on_home"
                  type="checkbox"
                  checked={newMessage.display_on_home}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, display_on_home: e.target.checked }))}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="display_on_home" className="ml-2 block text-sm text-gray-700">
                  Afficher sur la page d'accueil
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-300"
                  aria-busy={isLoading}
                >
                  {isLoading ? 'Enregistrement...' : (editingMessageId ? 'Modifier' : 'Publier')}
                </button>

                {editingMessageId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Liste des messages */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Messages publiés</h2>
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="border-b pb-4 last:border-b-0 relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-medium">{message.title}</h3>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={message.display_on_home ?? false}
                            onChange={async (e) => {
                              try {
                                const response = await fetch('/api/messages', {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    id: message.id,
                                    display_on_home: e.target.checked,
                                    title: message.title,
                                    content: message.content,
                                    images: message.images || [],
                                    userId: message.userName || user.login, // Utiliser userName (login) ou user.login
                                    userName: message.userName || user.login,
                                  }),
                                });
                                if (response.ok) {
                                  await fetchMessages();
                                } else {
                                  showToast('Erreur lors de la mise à jour', 'error');
                                }
                              } catch (error) {
                                console.error('Erreur:', error);
                                showToast('Erreur lors de la mise à jour', 'error');
                              }
                            }}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                            title={message.display_on_home ? "Masquer de l'accueil" : "Afficher sur l'accueil"}
                          />
                          <span className="ml-2 text-xs text-gray-500">
                            {message.display_on_home ? '✓ Accueil' : 'Accueil'}
                          </span>
                        </label>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(message.date).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    
                    {/* Boutons d'action déplacés */}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(message)}
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
                        title="Modifier"
                      >
                        <svg 
                          className="w-5 h-5" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(message.id)}
                        className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <svg 
                          className="w-5 h-5" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M6 18L18 6M6 6l12 12" 
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {message.images && message.images.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
                      {message.images.map((image, index) => (
                        <div key={index} className="relative aspect-square">
                          <Image
                            src={image}
                            alt={`Image ${index + 1} du message`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover rounded"
                            loading={messages.indexOf(message) === 0 && index === 0 ? 'eager' : 'lazy'}
                            priority={messages.indexOf(message) === 0 && index === 0}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="prose max-w-none whitespace-pre-wrap">
                    {message.content}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Publié par {message.userName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setMessageToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible."
      />
    </PageTransition>
  );
}

