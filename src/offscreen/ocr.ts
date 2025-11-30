/**
 * Offscreen document for OCR processing
 * Runs Tesseract.js which needs DOM APIs
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'run-ocr') {
    runOCR(message.imageData, message.noteId)
      .then(text => sendResponse({ success: true, text }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // async response
  }
});

async function runOCR(imageData: string, noteId: string) {
  console.log('Offscreen OCR started for note:', noteId);
  
  // Dynamic import to avoid bundling issues
  const Tesseract = await import('tesseract.js');
  
  const worker = await Tesseract.createWorker();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  
  const { data: { text } } = await worker.recognize(imageData);
  await worker.terminate();
  
  console.log('Offscreen OCR complete, text length:', text.length);
  return text;
}
