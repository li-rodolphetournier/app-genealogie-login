/**
 * Types pour les réponses API
 */

import type { User, UserResponse } from '../user';
import type { ObjectData } from '../objects';
import type { Message } from '../message';

/**
 * Réponse de login
 */
export type LoginResponse = {
  user: UserResponse;
  token?: string;
};

/**
 * Réponse d'erreur standard
 */
export type ErrorResponse = {
  error: string;
  message?: string;
  code?: string;
};

/**
 * Réponse de succès générique
 */
export type SuccessResponse<T = unknown> = {
  message?: string;
  data?: T;
};

/**
 * Réponse paginée
 */
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

