/**
 * Background Service Worker - Main Entry Point
 * 
 * Handles:
 * - Hotkey commands
 * - Message routing
 * - Note storage operations
 */

import { getDatabase, generateId } from '../db';
import { Note } from '../db/types';
import { Message, MessageResponse } from './messages';
import { enqueueProcessing } from './processingQueue';

// Listen for hotkey commands
chrome.commands.onCommand.addListener(async (command: string) => {
  if (command !== 'capture-selection') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id || !tab.url) return;
  // Skip chrome://, edge://, about: pages which disallow injection
  if (/^(chrome|edge|about):\/\//.test(tab.url)) {
    showNotification('Cannot capture on this page');
    return;
  }
  
  const tabId = tab.id; // Store tabId for later use
  
  try {
    // Check for selection first
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return window.getSelection()?.toString().trim() || '';
      }
    });
    
    const selectedText = results[0]?.result || '';
    
    if (selectedText) {
      // Capture text
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (text: string, url: string) => {
          chrome.runtime.sendMessage({
            type: 'capture-text',
            text: text,
            url: url
          });
        },
        args: [selectedText, tab.url]
      });
    } else {
      // Trigger screenshot overlay in the content script
      chrome.tabs.sendMessage(tabId, { type: 'start-screenshot' }).catch(() => {
        showNotification('Screenshot overlay failed to load');
      });
    }
  } catch (err) {
    console.error('Injection failed', err);
    showNotification('Capture failed');
  }
});

// Message router
chrome.runtime.onMessage.addListener((
  message: Message,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: MessageResponse) => void
) => {
  handleMessage(message, sender)
    .then(response => sendResponse(response))
    .catch(error => {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    });
  
  // Return true to indicate async response
  return true;
});

/**
 * Main message handler
 */
async function handleMessage(message: Message, sender: chrome.runtime.MessageSender): Promise<MessageResponse> {
  const db = await getDatabase();
  
  switch (message.type) {
    case 'start-screenshot-content': {
      // Content script hotkey triggered screenshot mode
      // Route to the sender tab
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, { type: 'start-screenshot' }).catch(() => {
          showNotification('Screenshot overlay failed');
        });
      }
      return { success: true };
    }
    
    case 'capture-text': {
      const note: Note = {
        id: generateId(),
        type: 'text',
        content: message.text,
        createdAt: Date.now(),
        source: {
          url: message.url,
          selection: message.text
        }
      };
      
      await db.notes.insert(note);
      
      // Show notification
      showNotification('ClipNote saved');
      
      // Send toast to the active tab
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'toast', text: 'ClipNote saved' }).catch(() => {
            // Silently ignore - tab may have closed or navigated
          });
        }
      } catch (err) {
        // Tab query failed, ignore
      }
      
      return { success: true, data: note };
    }
    case 'screenshot-rect': {
      // Capture visible tab and crop to selection
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return { success: false, error: 'No active tab' };
      const dataUrl = await chrome.tabs.captureVisibleTab();
      // Create offscreen canvas to crop
      const imageBitmap = await createImageBitmap(await (await fetch(dataUrl)).blob());
      const dpr = message.devicePixelRatio || 1;
      const sx = Math.round((message.x + message.scrollX) * dpr);
      const sy = Math.round((message.y + message.scrollY) * dpr);
      const sw = Math.round(message.width * dpr);
      const sh = Math.round(message.height * dpr);

      const off = new OffscreenCanvas(sw, sh);
      const ctx = off.getContext('2d');
      if (!ctx) return { success: false, error: 'Canvas context failed' };
      ctx.drawImage(imageBitmap, sx, sy, sw, sh, 0, 0, sw, sh);
      const croppedBlob = await off.convertToBlob({ type: 'image/png' });
      const croppedDataUrl = await blobToDataURL(croppedBlob);

      // Save screenshot note with empty text
      const db = await getDatabase();
      const note: Note = {
        id: generateId(),
        type: 'screenshot',
        content: '',
        text: '',
        imageData: croppedDataUrl,
        createdAt: Date.now(),
        source: { url: message.url }
      };
      await db.notes.insert(note);

      // Enqueue OCR processing
      enqueueProcessing({ id: note.id, step: 'OCR', retries: 3 });

      // Toast
      try {
        const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (active?.id) {
          chrome.tabs.sendMessage(active.id, { type: 'toast', text: 'ClipNote screenshot saved' }).catch(() => {
            // Silently ignore - tab may have closed or navigated
          });
        }
      } catch (err) {
        // Tab query failed, ignore
      }

      return { success: true, data: note };
    }
    
    case 'save-note': {
      const note: Note = {
        id: generateId(),
        type: 'text',
        content: message.note.content,
        createdAt: Date.now(),
        source: message.note.source || {}
      };
      
      await db.notes.insert(note);
      // Emit toast when note added via popup - wrap in try/catch to avoid errors
      try {
        chrome.runtime.sendMessage({ type: 'toast', text: 'ClipNote saved' }).catch(() => {
          // No listeners, ignore
        });
      } catch (err) {
        // Runtime not available, ignore
      }
      
      return { success: true, data: note };
    }
    
    case 'get-notes': {
      // Sort newest first using MangoQuery direction keywords
      const limit = message.limit || 20;
      const skip = message.skip || 0;
      
      const noteDocs = await db.notes
        .find()
        .sort({ createdAt: 'desc' })
        .skip(skip)
        .limit(limit)
        .exec();
      return {
        success: true,
        data: noteDocs.map(d => d.toJSON())
      };
    }
    
    case 'delete-note': {
      const doc = await db.notes.findOne(message.id).exec();
      
      if (doc) {
        await doc.remove();
        return { success: true };
      }
      
      return { success: false, error: 'Note not found' };
    }
    
    case 'update-note': {
      const doc = await db.notes.findOne(message.id).exec();
      if (doc) {
  // atomicPatch ensures safe concurrent updates (fallback to manual save if unavailable)
        if (typeof (doc as any).atomicPatch === 'function') {
          await (doc as any).atomicPatch({ content: message.content });
        } else {
          // Fallback if atomicPatch not available
          (doc as any).content = message.content;
          await (doc as any).save();
        }
        return { success: true, data: doc.toJSON() };
      }
      return { success: false, error: 'Note not found' };
    }
    
    case 'export-notes': {
      const notes = await db.notes.find().exec();
      const exportData = notes.map(doc => doc.toJSON());
      
      return { 
        success: true, 
        data: JSON.stringify(exportData, null, 2) 
      };
    }
    case 'show-notification': {
      if ((message as any).message) {
        showNotification((message as any).message);
      }
      return { success: true };
    }
    
    default:
      return { success: false, error: 'Unknown message type' };
  }
}

/**
 * Show a browser notification
 */
function showNotification(message: string) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
    title: 'ClipNote',
    message: message,
    priority: 0
  });
}

async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
