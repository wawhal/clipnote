/**
 * RxDB Database Setup
 * 
 * Provides offline-first local storage for ClipNote.
 * All data is stored locally in the browser.
 */

import type { RxDatabase, RxCollection } from 'rxdb';
import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { notesSchema } from './notesCollection';
import { NoteDocument } from './types';

// Enable dev mode in development
// Guard access to process so the code works in the browser service worker context
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
  addRxPlugin(RxDBDevModePlugin);
}

// RxDB requires the query-builder plugin to enable sort/where chaining in queries
addRxPlugin(RxDBQueryBuilderPlugin);

export type NotesCollection = RxCollection<NoteDocument>;

// Collections map used by RxDatabase generic
interface ClipNoteCollections {
  notes: NotesCollection;
}

export type ClipNoteDatabase = RxDatabase<ClipNoteCollections> & {
  notes: NotesCollection; // convenience property with proper typing
};

let dbPromise: Promise<ClipNoteDatabase> | null = null;

/**
 * Initialize the database (singleton pattern)
 */
export async function getDatabase(): Promise<ClipNoteDatabase> {
  if (!dbPromise) {
    dbPromise = createRxDatabase<ClipNoteCollections>({
      name: 'clipnote_db',
      storage: getRxStorageDexie(),
      multiInstance: false,
      ignoreDuplicate: true
    }).then(async (db) => {
      await db.addCollections({
        notes: { schema: notesSchema }
      });
      // Cast to ClipNoteDatabase with notes collection attached
      return db as ClipNoteDatabase;
    });
  }
  return dbPromise;
}

/**
 * Helper function to generate unique IDs
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
