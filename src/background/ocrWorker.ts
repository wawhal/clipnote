/**
 * OCR Worker using Tesseract.js (WASM)
 * Processes screenshot notes and updates their text.
 */
import { getDatabase } from '../db';
import type { QueueItem } from './processingQueue';

// Lazy load Tesseract only when needed
let Tesseract: any;

async function ensureTesseract() {
  if (!Tesseract) {
    // Dynamic import to keep background bundle smaller
    Tesseract = await import('tesseract.js');
  }
}

export async function runOCR(item: QueueItem) {
  await ensureTesseract();
  const db = await getDatabase();
  const doc = await db.notes.findOne(item.id).exec();
  if (!doc) return;
  const data = doc.toJSON();
  if (!data.imageData) return;

  try {
    const result = await Tesseract.recognize(data.imageData, 'eng');
    const text = result?.data?.text || '';
    if (typeof (doc as any).atomicPatch === 'function') {
      await (doc as any).atomicPatch({ text, processedAt: Date.now() });
    } else {
      (doc as any).text = text;
      (doc as any).processedAt = Date.now();
      await (doc as any).save();
    }
    console.info('OCR complete for note', item.id);
  } catch (err) {
    console.error('OCR failed', err);
    throw err;
  }
}
