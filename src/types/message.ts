/**
 * Type principal pour un message
 */
export type Message = {
  id: string;
  title: string;
  content: string;
  images: string[];
  date: string;
  userId: string;
  userName: string;
  display_on_home?: boolean;
  created_at?: string;
  updated_at?: string;
};

/**
 * Type pour créer un message
 */
export type MessageCreateInput = Omit<Message, 'id' | 'date' | 'created_at' | 'updated_at'>;

/**
 * Type pour mettre à jour un message
 */
export type MessageUpdateInput = Partial<Omit<Message, 'id' | 'created_at'>>;

