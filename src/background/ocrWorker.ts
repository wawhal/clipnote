/**
 * OCR Worker using Tesseract.js (WASM)
 * Processes screenshot notes and updates their text.
 */
import { getDatabase } from '../db';
import type { QueueItem } from './processingQueue';

export async function runOCR(item: QueueItem) {
  console.log('Starting OCR for note:', item.id);
  
  try {
    // Dynamic import
    const Tesseract = await import('tesseract.js');
    
    const db = await getDatabase();
    const doc = await db.notes.findOne(item.id).exec();
    if (!doc) {
      console.warn('Note not found for OCR:', item.id);
      return;
    }
    
    const data = doc.toJSON();
    if (!data.imageData) {
      console.warn('No imageData for OCR:', item.id);
      return;
    }

    console.log('Running Tesseract on image...');
    
    // Use createWorker for proper initialization
    const worker = await Tesseract.createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(data.imageData);
    await worker.terminate();
    
    console.log('OCR extracted text:', text.substring(0, 100));
    
    // Update the note with extracted text
    if (typeof (doc as any).atomicPatch === 'function') {
      await (doc as any).atomicPatch({ text, processedAt: Date.now() });
    } else {
      (doc as any).text = text;
      (doc as any).processedAt = Date.now();
      await (doc as any).save();
    }
    
    console.info('OCR complete for note', item.id);
  } catch (err) {
    console.error('OCR failed for note', item.id, err);
    throw err;
  }
}
