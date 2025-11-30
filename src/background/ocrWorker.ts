/**
 * OCR Worker - delegates to offscreen document
 */
import type { QueueItem } from './processingQueue';
import { getDatabase } from '../db';

/**
 * Ensure offscreen document exists
 */
async function ensureOffscreenDocument() {
  try {
    // @ts-ignore
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });
    
    if (existingContexts.length > 0) {
      return;
    }
    
    console.log('[ClipNote] Creating offscreen document...');
    // @ts-ignore
    await chrome.offscreen.createDocument({
      url: 'src/offscreen/ocr.html',
      reasons: ['WORKERS' as any],
      justification: 'Run OCR processing with Tesseract.js'
    });
    
    console.log('[ClipNote] Offscreen document created, waiting for initialization...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify it's still there
    // @ts-ignore
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });
    console.log('[ClipNote] Offscreen contexts after creation:', contexts.length);
    
    console.log('[ClipNote] Attempting to communicate with offscreen document');
  } catch (err) {
    console.error('[ClipNote] Failed to create offscreen document:', err);
    throw err;
  }
}

/**
 * Delegate OCR to offscreen document
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
    }, 30000);

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

    const recognizedText = await tesseractOCR(imageBase64);
    console.log('[ClipNote] OCR: recognized text length', recognizedText?.length ?? 0);

    if (typeof (doc as any).update === 'function') {
      await (doc as any).update({ $set: { text: recognizedText } });
    } else if (typeof (doc as any).atomicPatch === 'function') {
      await (doc as any).atomicPatch({ text: recognizedText });
    }

    console.log('[ClipNote] OCR Completed', { id: item.id });
  } catch (err: any) {
    const errorMsg = err?.message || err?.toString() || 'Unknown error';
    const errorStack = err?.stack || '';
    console.error('[ClipNote] OCR Error:', errorMsg);
    console.error('[ClipNote] OCR Error stack:', errorStack);
    console.error('[ClipNote] OCR Error full:', err);
  }
}
