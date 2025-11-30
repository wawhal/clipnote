/**
 * Stub OCR worker
 * Intentionally minimal: logs start and completion only.
 * Actual OCR implementation intentionally removed per user request.
 */
import type { QueueItem } from './processingQueue';
import { getDatabase } from '../db';

/**
 * Ensure offscreen document exists for OCR processing
 */
async function ensureOffscreenDocument() {
  // @ts-ignore - offscreen API may not be in all Chrome types
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });
  
  if (existingContexts.length > 0) {
    return; // Already exists
  }
  
  // Create offscreen document
  // @ts-ignore - offscreen API
  await chrome.offscreen.createDocument({
    url: 'src/offscreen/ocr.html',
    reasons: ['WORKERS' as any],
    justification: 'Run OCR processing with Tesseract.js Web Workers'
  });
}

/**
 * Run OCR using offscreen document (not affected by page CSP)
 */
const tesseractOCR = async (imageBase64: string): Promise<string> => {
  await ensureOffscreenDocument();
  
  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('OCR offscreen document did not respond in time'));
      }
    }, 30000); // Longer timeout for OCR processing

    chrome.runtime.sendMessage(
      { type: 'perform-ocr-offscreen', imageData: imageBase64 },
      (response) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);

        if (chrome.runtime.lastError) {
          reject(new Error(`Offscreen message error: ${chrome.runtime.lastError.message}`));
          return;
        }
        if (!response) {
          reject(new Error('No response from OCR offscreen document'));
          return;
        }
        if (!response.success) {
          reject(new Error(response.error || 'OCR failed in offscreen document'));
          return;
        }
        resolve(response.text || '');
      }
    );
  });
};

export async function runOCR(item: QueueItem) {
  try {
    console.log('[ClipNote] OCR Started', { id: item.id });

    // get image data from note id
    const db = await getDatabase();
    const doc = await db.notes.findOne(item.id).exec();
    if (!doc) {
      console.warn('[ClipNote] OCR: note not found', { id: item.id });
      return;
    }
    const note = doc.toJSON();
    const imageBase64 = note.imageData || '';
    if (!imageBase64) {
      console.warn('[ClipNote] OCR: no imageData on note', { id: item.id });
      return;
    }
    console.log('[ClipNote] OCR: image size', imageBase64.length);

    // implement OCR
  const recognizedText = await tesseractOCR(imageBase64);
  console.log('[ClipNote] OCR: recognized text length', recognizedText?.length ?? 0);

    // Persist recognized text back to the note using update plugin
    if (typeof (doc as any).update === 'function') {
      await (doc as any).update({ $set: { text: recognizedText } });
    } else if (typeof (doc as any).atomicPatch === 'function') {
      await (doc as any).atomicPatch({ text: recognizedText });
    } else {
      console.warn('[ClipNote] OCR: document update methods not available');
    }

    console.log('[ClipNote] OCR Completed', { id: item.id });
  } catch (err: any) {
    console.error('[ClipNote] OCR Error (stub)', err, err?.stack);
  }
}
