/**
 * Offscreen document for OCR processing
 * Runs in an isolated context not affected by page CSP
 * 
 * TODO: Fix Tesseract.js worker loading in Chrome extension context
 * For now, returns placeholder text
 */

chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
  if (message?.type !== 'perform-ocr-offscreen') return;
  
  (async () => {
    try {
      const imageBase64: string = message.imageData || '';
      if (!imageBase64) {
        sendResponse({ success: false, error: 'No image data' });
        return;
      }
      
      console.log('[ClipNote Offscreen] OCR requested but disabled - returning placeholder');
      
      // TODO: Implement OCR once worker loading is fixed
      // For now, return empty text so screenshots still save
      sendResponse({ success: true, text: '[OCR processing disabled - screenshot saved]' });
    } catch (err: any) {
      console.error('[ClipNote Offscreen] OCR error', err);
      sendResponse({ success: false, error: err.message || 'Unknown error' });
    }
  })();
  
  return true;
});

console.log('[ClipNote Offscreen] OCR worker ready (OCR disabled)');
