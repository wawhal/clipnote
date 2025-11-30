/**
 * RxDB Notes Collection Schema
 * 
 * This schema is designed to be future-proof:
 * - V0: Only uses text notes
 * - V1+: Can add screenshots, OCR, voice notes
 */

import { RxJsonSchema } from 'rxdb';
import { NoteDocument } from './types';

export const notesSchema: RxJsonSchema<NoteDocument> = {
  title: 'ClipNote Notes Collection',
  version: 1, // Bumped from 0 to 1 (removed rawText field)
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 200
    },
    type: {
      type: 'string',
      enum: ['text', 'voice', 'screenshot']
    },
    content: {
      type: 'string'
    },
    createdAt: {
      type: 'number'
    },
    source: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        selection: { type: 'string' }
      }
    },
    // V1 screenshot/OCR fields (left nullable)
    imageData: {
      type: 'string'
    },
    text: {
      type: 'string'
    },
    raw: {
      type: 'object'
    }
  },
  required: ['id', 'type', 'createdAt']
};
