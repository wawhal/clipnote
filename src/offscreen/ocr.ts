/**
 * Offscreen document for OCR processing
 * Uses tesseract-wasm - WebAssembly-based OCR that works with CSP
 */

console.log('[ClipNote Offscreen] Script loading...');

chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
  console.log('[ClipNote Offscreen] Message received:', message?.type);
  
  if (message?.type !== 'perform-ocr-offscreen') {
    return false;
  }
  
  (async () => {
    try {
      console.log('[ClipNote Offscreen] Step 1: Validating image data...');
      const imageBase64: string = message.imageData || '';
      if (!imageBase64) {
        console.error('[ClipNote Offscreen] ERROR: No image data received');
        sendResponse({ success: false, error: 'No image data' });
        return;
      }
      console.log('[ClipNote Offscreen] ✓ Image data received, length:', imageBase64.length);
      
      console.log('[ClipNote Offscreen] Step 2: Importing tesseract-wasm...');
      // @ts-ignore
      const { createOCREngine } = await import('tesseract-wasm');
      console.log('[ClipNote Offscreen] ✓ tesseract-wasm imported successfully');
      
      console.log('[ClipNote Offscreen] Step 3: Creating OCR engine (will auto-load WASM)...');
      const engine = await createOCREngine();
      console.log('[ClipNote Offscreen] ✓ OCR engine created successfully');
      
      console.log('[ClipNote Offscreen] Step 4: Loading English model from local bundle...');
      const modelUrl = chrome.runtime.getURL('lib/tesseract/eng.traineddata');
      console.log('[ClipNote Offscreen] Loading from:', modelUrl);
      const modelResponse = await fetch(modelUrl);
      console.log('[ClipNote Offscreen] Model response status:', modelResponse.status, modelResponse.statusText);
      
      if (!modelResponse.ok) {
        throw new Error(`Failed to load local model: ${modelResponse.status} ${modelResponse.statusText}`);
      }
      
      const modelData = await modelResponse.arrayBuffer();
      console.log('[ClipNote Offscreen] ✓ Model downloaded, size:', modelData.byteLength, 'bytes');
      
      console.log('[ClipNote Offscreen] Step 5: Loading model into engine...');
      engine.loadModel(new Uint8Array(modelData));
      console.log('[ClipNote Offscreen] ✓ Model loaded into engine successfully');
      
      console.log('[ClipNote Offscreen] Step 6: Converting base64 to image...');
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = () => {
          console.log('[ClipNote Offscreen] ✓ Image loaded, dimensions:', img.width, 'x', img.height);
          resolve(null);
        };
        img.onerror = (e) => {
          console.error('[ClipNote Offscreen] ERROR: Image failed to load:', e);
          reject(new Error('Failed to load image'));
        };
        img.src = imageBase64;
      });
      
      console.log('[ClipNote Offscreen] Step 7: Drawing image to canvas...');
      const canvas = new OffscreenCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('[ClipNote Offscreen] ERROR: Failed to get canvas 2d context');
        throw new Error('Failed to get canvas context');
      }
      
      ctx.drawImage(img, 0, 0);
      console.log('[ClipNote Offscreen] ✓ Image drawn to canvas');
      
      console.log('[ClipNote Offscreen] Step 8: Getting image data from canvas...');
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      console.log('[ClipNote Offscreen] ✓ ImageData extracted, pixels:', imageData.data.length);
      
      console.log('[ClipNote Offscreen] Step 9: Loading image into OCR engine...');
      engine.loadImage(imageData);
      console.log('[ClipNote Offscreen] ✓ Image loaded into OCR engine');
      
      console.log('[ClipNote Offscreen] Step 10: Running OCR text extraction...');
      const text = engine.getText();
      console.log('[ClipNote Offscreen] ✓ OCR completed successfully!');
      console.log('[ClipNote Offscreen] Extracted text length:', text?.length ?? 0);
      console.log('[ClipNote Offscreen] Text preview:', text?.substring(0, 100));
      
      sendResponse({ success: true, text: text || '' });
    } catch (err: any) {
      const errorMsg = err?.message || err?.toString() || 'Unknown error';
      const errorStack = err?.stack || '';
      console.error('[ClipNote Offscreen] ❌ OCR FAILED at some step');
      console.error('[ClipNote Offscreen] Error message:', errorMsg);
      console.error('[ClipNote Offscreen] Error stack:', errorStack);
      console.error('[ClipNote Offscreen] Full error object:', err);
      sendResponse({ success: false, error: errorMsg });
    }
  })();
  
  return true; // Keep message channel open for async response
});

console.log('[ClipNote Offscreen] OCR ready, message listener registered');
