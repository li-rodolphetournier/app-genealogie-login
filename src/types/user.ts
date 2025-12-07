/**
 * Type principal pour un utilisateur
 */
export type User = {
  id: string;
  login: string;
  email: string;
  status: "administrateur" | "utilisateur" | "redacteur";
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  profileImage?: string;
  description?: string;
  detail?: string;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Type pour créer un utilisateur (avec mot de passe)
 */
export type UserCreateInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'> & {
  password: string;
};

/**
 * Type pour mettre à jour un utilisateur
 */
export type UserUpdateInput = Partial<Omit<User, 'id' | 'createdAt'>> & {
  password?: string;
};

/**
 * Type pour la réponse API (sans mot de passe)
 */
export type UserResponse = Omit<User, 'password'>;
