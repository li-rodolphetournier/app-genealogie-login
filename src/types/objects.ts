/**
 * Type pour une photo d'objet
 */
export type ObjectPhoto = {
  id?: string;
  url: string;
  description: string[];
  display_order?: number;
};

/**
 * Type principal pour un objet
 */
export type ObjectData = {
  id: string;
  nom: string;
  type: string;
  description?: string;
  longDescription?: string;
  status: "publie" | "brouillon";
  utilisateur: string;
  utilisateur_id?: string; // Pour Supabase
  photos?: ObjectPhoto[];
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Type pour créer un objet
 */
export type ObjectCreateInput = Omit<ObjectData, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Type pour mettre à jour un objet
 */
export type ObjectUpdateInput = Partial<Omit<ObjectData, 'id' | 'createdAt'>>;
