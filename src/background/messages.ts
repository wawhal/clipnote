/**
 * Message Types for ClipNote
 * 
 * Explicit message passing contract between:
 * - Content scripts
 * - Background service worker
 * - Popup UI
 */

import { Note } from '../db/types';

export type Message =
  | { type: 'capture-text'; text: string; url: string }
  | { type: 'save-note'; note: Omit<Note, 'id' | 'createdAt'> }
  | { type: 'get-notes' }
  | { type: 'notes-response'; notes: Note[] }
  | { type: 'delete-note'; id: string }
  | { type: 'update-note'; id: string; content: string }
  | { type: 'export-notes' }
  | { type: 'show-notification'; message: string }
  | { type: 'toast'; text: string };

export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
