/**
 * Content script OCR runner
 * Listens for 'perform-ocr' messages and runs Tesseract.js in page context
 * where Web Worker is available.
 */

import { createWorker } from 'tesseract.js';

chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
  if (message?.type !== 'perform-ocr') return;
  (async () => {
    try {
      const imageBase64: string = message.imageData || '';
      if (!imageBase64) {
        sendResponse({ success: false, error: 'No image data' });
        return;
      }
      const worker = await createWorker('eng');
      const result = await worker.recognize(imageBase64);
      await worker.terminate();
      console.log('[ClipNote] OCR content result', result);
      const text = (result as any)?.data?.text || (result as any)?.text || '';
      sendResponse({ success: true, text });
    } catch (err: any) {
      console.error('[ClipNote] OCR content error', err);
      sendResponse({ success: false, error: err?.message || String(err) });
    }
  })();
  return true; // keep the message channel open for async sendResponse
});
