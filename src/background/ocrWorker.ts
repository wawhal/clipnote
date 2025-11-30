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
    chrome.tabs.sendMessage(tab.id!, { type: 'perform-ocr', imageData: imageBase64 }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response?.success) {
        reject(new Error(response?.error || 'OCR failed'));
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

    // implement OCR
    const recognizedText = await tesseractOCR(imageBase64);

    // Persist recognized text back to the note
    if (typeof (doc as any).atomicPatch === 'function') {
      await (doc as any).atomicPatch({ text: recognizedText });
    } else {
      (doc as any).text = recognizedText;
      await (doc as any).save();
    }

    console.log('[ClipNote] OCR Completed', { id: item.id });
  } catch (err) {
    console.log('[ClipNote] OCR Error (stub)', err);
  }
}
