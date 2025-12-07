/**
 * Export centralisé de tous les types
 */

// Types utilisateur
export type {
  User,
  UserCreateInput,
  UserUpdateInput,
  UserResponse,
} from './user';

// Types objets
export type {
  ObjectData,
  ObjectPhoto,
  ObjectCreateInput,
  ObjectUpdateInput,
} from './objects';

// Types messages
export type {
  Message,
  MessageCreateInput,
  MessageUpdateInput,
} from './message';

// Types généalogie
export type { Person } from './genealogy'; 