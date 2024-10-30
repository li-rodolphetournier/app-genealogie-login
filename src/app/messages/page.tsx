'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

type User = {
  id: string;
  login: string;
  status: string;
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
  const [newMessage, setNewMessage] = useState({
    title: '',
    content: '',
    images: [] as string[]
  });

  useEffect(() => {
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
        setMessages(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  const resizeImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const maxWidth = 800;
      const maxHeight = 800;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg',
            0.7
          );
        };
        img.onerror = () => {
          reject(new Error('Image loading failed'));
        };
      };
      reader.onerror = () => {
        reject(new Error('FileReader failed'));
      };
    });
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
      const resizedBlob = await resizeImage(file);
      const resizedFile = new File([resizedBlob], file.name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      const formData = new FormData();
      formData.append('file', resizedFile);
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
      alert('Erreur lors du traitement de l\'image');
    }

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
        id: uuidv4(),
        ...newMessage,
        date: new Date().toISOString(),
        userId: user.id,
        userName: user.login
      };

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        setNewMessage({ title: '', content: '', images: [] });
        await fetchMessages();
      }
    } catch (error) {
      console.error('Erreur lors de la création du message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Administration des Messages</h1>
        <button
          onClick={() => router.push('/accueil')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Retour au tableau de bord
        </button>
      </div>

      {/* Formulaire de création */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Créer un nouveau message</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre
            </label>
            <input
              type="text"
              value={newMessage.title}
              onChange={(e) => setNewMessage(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Images
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
            />
            
            {/* Affichage des images */}
            {newMessage.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {newMessage.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative aspect-square">
                      <Image
                        src={image}
                        alt={`Image ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover rounded"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenu
            </label>
            <textarea
              value={newMessage.content}
              onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 min-h-[200px]"
              required
              placeholder="Écrivez votre message ici..."
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 disabled:bg-orange-300"
          >
            {isLoading ? 'Publication...' : 'Publier le message'}
          </button>
        </form>
      </div>

      {/* Liste des messages */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Messages publiés</h2>
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="border-b pb-4 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium">{message.title}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(message.date).toLocaleDateString('fr-FR')}
                </span>
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
  );
} 