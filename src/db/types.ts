/**
 * Core data types for ClipNote
 */

export type NoteType = "text" | "voice" | "screenshot";

export interface Note {
  id: string;
  type: NoteType;
  
  // V0 fields
  content: string;
  createdAt: number;
  source: {
    url?: string;
    selection?: string;
  };
  
  // Future fields (allowed but unused in v0)
  imageData?: string;
  text?: string;
  raw?: any;
}

export interface NoteDocument extends Note {
  // RxDB document methods will be added here
}
