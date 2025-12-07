/**
 * Messages d'erreur standardisés
 */

export const ERROR_MESSAGES = {
  // Génériques
  GENERIC: 'Une erreur est survenue. Veuillez réessayer.',
  NETWORK: 'Erreur de connexion. Vérifiez votre connexion internet.',
  UNAUTHORIZED: 'Vous devez être connecté pour effectuer cette action.',
  FORBIDDEN: "Vous n'avez pas les permissions nécessaires.",
  NOT_FOUND: 'La ressource demandée est introuvable.',
  SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard.',

  // Authentification
  AUTH_INVALID_CREDENTIALS: 'Identifiants incorrects.',
  AUTH_SESSION_EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter.',
  AUTH_REQUIRED: 'Vous devez être connecté pour accéder à cette page.',

  // Utilisateurs
  USER_NOT_FOUND: "L'utilisateur demandé n'existe pas.",
  USER_ALREADY_EXISTS: 'Cet utilisateur existe déjà.',
  USER_CREATE_FAILED: "Impossible de créer l'utilisateur.",
  USER_UPDATE_FAILED: "Impossible de mettre à jour l'utilisateur.",
  USER_DELETE_FAILED: "Impossible de supprimer l'utilisateur.",

  // Objets
  OBJECT_NOT_FOUND: "L'objet demandé n'existe pas.",
  OBJECT_CREATE_FAILED: "Impossible de créer l'objet.",
  OBJECT_UPDATE_FAILED: "Impossible de mettre à jour l'objet.",
  OBJECT_DELETE_FAILED: "Impossible de supprimer l'objet.",

  // Messages
  MESSAGE_NOT_FOUND: 'Le message demandé est introuvable.',
  MESSAGE_CREATE_FAILED: 'Impossible de créer le message.',
  MESSAGE_UPDATE_FAILED: 'Impossible de mettre à jour le message.',
  MESSAGE_DELETE_FAILED: 'Impossible de supprimer le message.',

  // Fichiers
  FILE_UPLOAD_FAILED: "Impossible d'uploader le fichier.",
  FILE_TOO_LARGE: 'Le fichier est trop volumineux. La taille maximale est de 10MB.',
  FILE_INVALID_TYPE: 'Type de fichier non autorisé.',

  // Généalogie
  GENEALOGY_PERSON_ADD_FAILED: "Impossible d'ajouter la personne.",
  GENEALOGY_PERSON_UPDATE_FAILED: "Impossible de mettre à jour la personne.",
  GENEALOGY_PERSON_DELETE_FAILED: "Impossible de supprimer la personne.",

  // Validation
  VALIDATION_ERROR: 'Les données fournies sont invalides.',
  REQUIRED_FIELD: 'Ce champ est obligatoire.',
  INVALID_EMAIL: "L'adresse email n'est pas valide.",
  INVALID_PASSWORD: 'Le mot de passe doit contenir au moins 6 caractères.',
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;

/**
 * Récupère un message d'erreur standardisé
 */
export function getErrorMessage(key: ErrorMessageKey): string {
  return ERROR_MESSAGES[key] || ERROR_MESSAGES.GENERIC;
}

/**
 * Formate un message d'erreur avec des variables
 */
export function formatErrorMessage(
  key: ErrorMessageKey,
  variables?: Record<string, string | number>
): string {
  let message = getErrorMessage(key);

  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, String(value));
    });
  }

  return message;
}

