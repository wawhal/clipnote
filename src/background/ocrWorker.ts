/**
 * OCR Worker using offscreen document
 * Service workers can't use DOM APIs, so we delegate to offscreen document
 */
import { getDatabase } from '../db';
import type { QueueItem } from './processingQueue';

let offscreenCreated = false;

async function ensureOffscreenDocument() {
  if (offscreenCreated) return;
  
  // Check if offscreen document already exists
  const offscreenUrl = chrome.runtime.getURL('offscreen/ocr.html');
  const matchedClients = await (self as any).clients?.matchAll();
  
  const hasOffscreen = matchedClients?.some((client: any) => 
    client.url === offscreenUrl
  );
  
  if (hasOffscreen) {
    offscreenCreated = true;
    return;
  }
  
  await chrome.offscreen.createDocument({
    url: 'offscreen/ocr.html',
    reasons: ['BLOBS' as any],
    justification: 'OCR processing requires DOM APIs for Tesseract.js'
  });
  
  offscreenCreated = true;
}

export async function runOCR(item: QueueItem) {
  console.log('Starting OCR for note:', item.id);
  
  try {
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

    // Ensure offscreen document exists
    await ensureOffscreenDocument();
    
    console.log('Sending OCR request to offscreen document...');
    
    // Send to offscreen document and wait for response
    const response = await chrome.runtime.sendMessage({
      type: 'run-ocr',
      imageData: data.imageData,
      noteId: item.id
    });
    
    if (!response.success) {
      throw new Error(response.error);
    }
    
    const text = response.text || '';
    console.log('OCR extracted text length:', text.length);
    
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
