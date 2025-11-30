/**
 * Offscreen document for OCR processing
 * Runs in an isolated context not affected by page CSP
 */

import { createWorker } from 'tesseract.js';

chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
  if (message?.type !== 'perform-ocr-offscreen') return;
  
  (async () => {
    try {
      const imageBase64: string = message.imageData || '';
      if (!imageBase64) {
        sendResponse({ success: false, error: 'No image data' });
        return;
      }
      
      console.log('[ClipNote Offscreen] Starting OCR...');
      const worker = await createWorker('eng');
      const result = await worker.recognize(imageBase64);
      await worker.terminate();
      
      const text = (result as any)?.data?.text || (result as any)?.text || '';
      console.log('[ClipNote Offscreen] OCR completed, text length:', text.length);
      sendResponse({ success: true, text });
    } catch (err: any) {
      console.error('[ClipNote Offscreen] OCR error', err);
      let errorMsg = 'Unknown error';
      if (err) {
        if (typeof err === 'string') {
          errorMsg = err;
        } else if (err.message) {
          errorMsg = err.message;
        } else if (err.toString) {
          errorMsg = err.toString();
        } else {
          errorMsg = JSON.stringify(err);
        }
      }
      sendResponse({ success: false, error: errorMsg });
    }
  })();
  
  return true; // keep message channel open for async response
});

console.log('[ClipNote Offscreen] OCR worker ready');
