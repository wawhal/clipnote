/**
 * Content Script - Text Capture
 * 
 * Runs on all web pages and handles:
 * - Getting selected text when hotkey is pressed
 * - Sending captured text to background script
 */

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'get-selection') {
    const selectedText = window.getSelection()?.toString().trim() || '';
    
    if (selectedText) {
      // Send captured text to background script
      chrome.runtime.sendMessage({
        type: 'capture-text',
        text: selectedText,
        url: window.location.href
      });
    } else {
      // No text selected, show notification
      chrome.runtime.sendMessage({
        type: 'show-notification',
        message: 'No text selected'
      });
    }
    
    sendResponse({ success: true });
  }
  
  return true;
});
