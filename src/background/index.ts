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

// Listen for hotkey commands
chrome.commands.onCommand.addListener(async (command: string) => {
  if (command === 'capture-selection') {
    // Send message to content script to get selected text
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'get-selection' });
    }
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
      showNotification('Note saved!');
      
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
      
      return { success: true, data: note };
    }
    
    case 'get-notes': {
      // Sort newest first using MangoQuery direction keywords
      const noteDocs = await db.notes
        .find()
        .sort({ createdAt: 'desc' })
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
