# ClipNote v0 Architecture

## Overview

ClipNote is a Chrome extension built for offline-first, instant note capture. This document explains the technical architecture of v0.

## Core Principles

1. **Offline First**: All data stored locally using RxDB
2. **Minimal Complexity**: Small, focused modules
3. **AI-Agent Friendly**: Clear structure for LLM code generation
4. **Future-Proof Schema**: Database ready for screenshots, OCR, embeddings

## Directory Structure

```
/src
  /background
    index.ts          # Service worker entry point
    messages.ts       # Message type definitions
  
  /content
    textCapture.ts    # DOM text selection capture
  
  /db
    index.ts          # RxDB initialization
    notesCollection.ts # Notes schema definition
    types.ts          # TypeScript types
  
  /ui
    popup.html        # Extension popup interface
    popup.ts          # Popup logic
    styles.css        # Styling

/docs
  architecture.md     # This file

manifest.json         # Chrome extension manifest
package.json          # Dependencies
tsconfig.json         # TypeScript config
webpack.config.js     # Build configuration
```

## Data Flow

### 1. Hotkey Capture Flow

```
User presses Ctrl+Shift+K
  ↓
Background service worker receives command
  ↓
Sends message to active tab's content script
  ↓
Content script reads window.getSelection()
  ↓
Sends { type: 'capture-text', text, url } to background
  ↓
Background creates Note object with metadata
  ↓
Inserts into RxDB notes collection
  ↓
Shows notification toast
```

### 2. Manual Quick Note Flow

```
User types in popup textarea
  ↓
Clicks "Save Note" button
  ↓
popup.ts sends { type: 'save-note' } message
  ↓
Background creates Note and saves to RxDB
  ↓
Popup refreshes note list
```

### 3. View/Edit/Delete Flow

```
User opens popup
  ↓
popup.ts sends { type: 'get-notes' }
  ↓
Background queries RxDB, returns notes array
  ↓
popup.ts renders notes as HTML
  ↓
User edits inline (contenteditable)
  ↓
On blur: sends { type: 'update-note' }
  ↓
Background patches document in RxDB
```

## Message Passing Contract

All communication uses explicit message types:

```typescript
type Message =
  | { type: 'capture-text'; text: string; url: string }
  | { type: 'save-note'; note: Omit<Note, 'id' | 'createdAt'> }
  | { type: 'get-notes' }
  | { type: 'notes-response'; notes: Note[] }
  | { type: 'delete-note'; id: string }
  | { type: 'update-note'; id: string; content: string }
  | { type: 'export-notes' }
```

No implicit side effects. Each message has one responsibility.

## Database Schema

### Note Document

```typescript
interface Note {
  id: string;                    // Unique ID
  type: "text" | "voice" | "screenshot";
  content: string;               // Main text content
  createdAt: number;             // Timestamp
  source: {
    url?: string;                // Source URL
    selection?: string;          // Original selection
  };
  
  // Future fields (unused in v0)
  imageData?: string;            // Screenshot base64
  text?: string;                 // OCR text
  raw?: any;                     // Metadata
}
```

RxDB handles:
- Local IndexedDB storage
- Query performance
- Observable collections
- Future sync capabilities

## Tech Stack

- **TypeScript**: Type safety
- **RxDB**: Offline-first database
- **Dexie**: IndexedDB wrapper for RxDB
- **Webpack**: Bundling
- **Chrome Extension Manifest V3**: Latest APIs

## Build Process

```bash
npm install      # Install dependencies
npm run dev      # Development with watch mode
npm run build    # Production build
```

Output goes to `/dist` directory:
- `dist/background/index.js`
- `dist/content/textCapture.js`
- `dist/ui/popup.js`
- `dist/manifest.json`
- `dist/icons/`

## Loading in Chrome

1. Build the extension: `npm run build`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist/` folder

## Testing

### Manual Testing Checklist

- [ ] Hotkey captures selected text
- [ ] Quick note saves from popup
- [ ] Notes display in popup
- [ ] Inline editing works
- [ ] Delete removes notes
- [ ] Export downloads JSON
- [ ] Works completely offline
- [ ] Source URLs are clickable

## Future Enhancements (Not in v0)

- Screenshot capture
- OCR text extraction
- Voice note recording
- AI summarization
- Embedding generation
- Semantic search
- Cloud sync
- Mobile companion app

## Design Decisions

### Why RxDB?

- Built for offline-first
- Observable queries for reactive UI
- Easy to add sync later
- Supports complex queries
- Works with IndexedDB

### Why Manifest V3?

- Required for new Chrome extensions
- Better security model
- Service workers instead of background pages
- Future-proof

### Why TypeScript?

- Type safety prevents bugs
- Better IDE support
- Easier for AI agents to generate correct code
- Self-documenting

### Why Inline Editing?

- Zero friction to edit
- No modal dialogs
- Natural user flow
- Blur auto-saves

## Debugging

### Check Service Worker Console

1. Go to `chrome://extensions`
2. Find ClipNote
3. Click "service worker" link
4. View console logs

### Check Content Script

1. Open DevTools on any page
2. Look for ClipNote logs in console
3. Messages will show capture events

### Check Storage

1. Open DevTools → Application → IndexedDB
2. Find `clipnote_db`
3. Inspect `notes` collection

## License

MIT
