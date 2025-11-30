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
  
  // V1 screenshot/OCR fields
  imageData?: string; // Base64 screenshot
  text?: string; // OCR extracted text
  raw?: any; // Raw data if needed
}

export interface NoteDocument extends Note {
  // RxDB document methods will be added here
}
