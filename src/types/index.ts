export interface User {
  id: string;
  login: string;
  status: 'administrateur' | 'utilisateur';
}

export interface Message {
  id: string;
  title: string;
  content: string;
  images: string[];
  date: string;
  userId: string;
  userName: string;
}

export interface ObjectData {
  id: string;
  nom: string;
  type: string;
  description?: string;
  status: 'publie' | 'brouillon';
  utilisateur: string;
  images?: string[];
  photos?: Array<{ url: string; description: string[] }>;
} 