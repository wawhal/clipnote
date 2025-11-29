/**
 * Popup UI Script
 * 
 * Handles:
 * - Displaying notes
 * - Adding quick notes
 * - Editing and deleting notes
 * - Exporting notes
 */

import { Note } from '../db/types';
import { Message, MessageResponse } from '../background/messages';

// DOM Elements
const quickNoteInput = document.getElementById('quickNoteInput') as HTMLTextAreaElement;
const saveQuickNoteBtn = document.getElementById('saveQuickNote') as HTMLButtonElement;
const notesList = document.getElementById('notesList') as HTMLDivElement;
const emptyState = document.getElementById('emptyState') as HTMLDivElement;
const exportBtn = document.getElementById('exportNotes') as HTMLButtonElement;

// Load notes on popup open
document.addEventListener('DOMContentLoaded', () => {
  loadNotes();
  
  // Event listeners
  saveQuickNoteBtn.addEventListener('click', handleSaveQuickNote);
  exportBtn.addEventListener('click', handleExport);
  
  // Allow Enter+Ctrl to save
  quickNoteInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleSaveQuickNote();
    }
  });
});

/**
 * Load and display all notes
 */
async function loadNotes() {
  const response = await sendMessage<Note[]>({ type: 'get-notes' });
  
  if (response.success && response.data) {
    renderNotes(response.data);
  }
}

/**
 * Render notes list
 */
function renderNotes(notes: Note[]) {
  if (notes.length === 0) {
    notesList.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  
  notesList.style.display = 'block';
  emptyState.style.display = 'none';
  
  notesList.innerHTML = notes.map(note => `
    <div class="note-item" data-id="${note.id}">
      <div class="note-header">
        <span class="note-date">${formatDate(note.createdAt)}</span>
        ${note.source.url ? `<a href="${note.source.url}" target="_blank" class="note-source">🔗 Source</a>` : ''}
      </div>
      <div class="note-content" contenteditable="true" data-id="${note.id}">
        ${escapeHtml(note.content)}
      </div>
      <div class="note-actions">
        <button class="btn-icon btn-delete" data-id="${note.id}" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('');
  
  // Add event listeners
  attachNoteEventListeners();
}

/**
 * Attach event listeners to note items
 */
function attachNoteEventListeners() {
  // Delete buttons
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', handleDeleteNote);
  });
  
  // Editable content
  document.querySelectorAll('.note-content[contenteditable]').forEach(el => {
    el.addEventListener('blur', handleUpdateNote);
  });
}

/**
 * Handle saving a quick note
 */
async function handleSaveQuickNote() {
  const content = quickNoteInput.value.trim();
  
  if (!content) return;
  
  const response = await sendMessage({
    type: 'save-note',
    note: {
      type: 'text',
      content,
      source: {}
    }
  });
  
  if (response.success) {
    quickNoteInput.value = '';
    loadNotes();
  }
}

/**
 * Handle deleting a note
 */
async function handleDeleteNote(e: Event) {
  const btn = e.target as HTMLButtonElement;
  const noteId = btn.dataset.id;
  
  if (!noteId) return;
  
  if (confirm('Delete this note?')) {
    const response = await sendMessage({
      type: 'delete-note',
      id: noteId
    });
    
    if (response.success) {
      loadNotes();
    }
  }
}

/**
 * Handle updating a note
 */
async function handleUpdateNote(e: Event) {
  const el = e.target as HTMLDivElement;
  const noteId = el.dataset.id;
  const newContent = el.innerText.trim();
  
  if (!noteId || !newContent) return;
  
  await sendMessage({
    type: 'update-note',
    id: noteId,
    content: newContent
  });
}

/**
 * Handle exporting notes
 */
async function handleExport() {
  const response = await sendMessage<string>({ type: 'export-notes' });
  
  if (response.success && response.data) {
    // Create download
    const blob = new Blob([response.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clipnote-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Send message to background script
 */
function sendMessage<T = any>(message: Message): Promise<MessageResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: MessageResponse<T>) => {
      resolve(response);
    });
  });
}

/**
 * Format timestamp to readable date
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
