/**
 * Types pour les requêtes API
 */

import type { UserCreateInput, UserUpdateInput } from '../user';
import type { ObjectCreateInput, ObjectUpdateInput } from '../objects';
import type { MessageCreateInput, MessageUpdateInput } from '../message';

/**
 * Requête de login
 */
export type LoginRequest = {
  login: string;
  password: string;
};

/**
 * Requête pour créer un utilisateur
 */
export type CreateUserRequest = UserCreateInput;

/**
 * Requête pour mettre à jour un utilisateur
 */
export type UpdateUserRequest = UserUpdateInput;

/**
 * Requête pour créer un objet
 */
export type CreateObjectRequest = ObjectCreateInput;

/**
 * Requête pour mettre à jour un objet
 */
export type UpdateObjectRequest = ObjectUpdateInput;

/**
 * Requête pour créer un message
 */
export type CreateMessageRequest = MessageCreateInput;

/**
 * Requête pour mettre à jour un message
 */
export type UpdateMessageRequest = MessageUpdateInput;

