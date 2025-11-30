/**
 * Offscreen document for OCR processing
 * Runs Tesseract.js which needs DOM APIs
 * Tesseract is loaded via CDN script tag to avoid webpack bundling issues
 */

declare const Tesseract: any;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'run-ocr') {
    runOCR(message.imageData, message.noteId)
      .then(text => sendResponse({ success: true, text }))
      .catch(err => {
        console.error('OCR error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // async response
  }
});

async function runOCR(imageData: string, noteId: string): Promise<string> {
  console.log('Offscreen OCR started for note:', noteId);
  
  if (typeof Tesseract === 'undefined') {
    throw new Error('Tesseract not loaded');
  }
  
  const worker = await Tesseract.createWorker();
  
  try {
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const { data: { text } } = await worker.recognize(imageData);
    
    console.log('Offscreen OCR complete, text length:', text.length);
    return text;
  } finally {
    await worker.terminate();
  }
}
