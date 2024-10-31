'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

type User = {
  id: string;
  login: string;
  status: 'administrateur' | 'utilisateur';
};

type Message = {
  id: string;
  title: string;
  content: string;
  images: string[];
  date: string;
  userId: string;
  userName: string;
};

export default function MessagesAdministration() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState({
    title: '',
    content: '',
    images: [] as string[]
  });

  useEffect(() => {
    // Vérification de l'authentification
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      router.push('/');
      return;
    }
    const userData = JSON.parse(currentUser);
    if (userData.status !== 'administrateur') {
      router.push('/accueil');
      return;
    }
    setUser(userData);
    fetchMessages();
  }, [router]);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        // Trier les messages par date (plus récent en premier)
        const sortedMessages = data.sort((a: Message, b: Message) => 
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
      alert('Le fichier est trop volumineux. La taille maximale est de 10MB.');
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
          images: [...prev.images, data.filePath]
        }));
      } else {
        alert('Erreur lors de l\'upload de l\'image');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'upload de l\'image');
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
    
    setIsLoading(true);

    try {
      const messageData = {
        id: editingMessageId || uuidv4(),
        ...newMessage,
        date: editingMessageId 
          ? messages.find(m => m.id === editingMessageId)?.date 
          : new Date().toISOString(),
        userId: user.id,
        userName: user.login
      };

      const response = await fetch('/api/messages', {
        method: editingMessageId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        setNewMessage({ title: '', content: '', images: [] });
        setEditingMessageId(null);
        await fetchMessages();
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du message:', error);
      alert('Erreur lors de la sauvegarde du message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setNewMessage({
      title: message.title,
      content: message.content,
      images: message.images
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (messageId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/messages?id=${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMessages();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression du message');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setNewMessage({ title: '', content: '', images: [] });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec bouton retour */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Administration des Messages
          </h1>
          <button
            onClick={() => router.push('/accueil')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            aria-label="Retour à l'accueil"
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Retour
          </button>
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
                      <h3 className="text-lg font-medium mb-1">{message.title}</h3>
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
                        onClick={() => handleDelete(message.id)}
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
  );
} 