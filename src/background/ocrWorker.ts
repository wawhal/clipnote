/**
 * Stub OCR worker
 * Intentionally minimal: logs start and completion only.
 * Actual OCR implementation intentionally removed per user request.
 */
import type { QueueItem } from './processingQueue';
import { getDatabase } from '../db';

/**
 * Run OCR on a base64 image using Tesseract.js
 * Returns recognized text.
 */
/**
 * Delegate OCR to content script where Web Worker is available.
 */
const tesseractOCR = async (imageBase64: string): Promise<string> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab to run OCR');
  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('OCR content script did not respond in time'));
      }
    }, 15000);

    chrome.tabs.sendMessage(tab.id!, { type: 'perform-ocr', imageData: imageBase64 }, (response) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      if (chrome.runtime.lastError) {
        reject(new Error(`tabs.sendMessage error: ${chrome.runtime.lastError.message}`));
        return;
      }
      if (!response) {
        reject(new Error('No response from OCR content script'));
        return;
      }
      if (!response.success) {
        reject(new Error(response.error || 'OCR failed in content script'));
        return;
      }
      resolve(response.text || '');
    });
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
