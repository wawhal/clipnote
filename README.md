# ClipNote

ClipNote is an offline-first, lightning-fast second brain that removes all friction between having a thought → capturing it → using it later.

This repo defines the v0 architecture: text-only capture, instant hotkeys, and an AI-ready local-first data model that scales to screenshots/OCR later.

---

## 0. Philosophy

### Principle 0 — A second brain must increase real mental bandwidth
Capture must feel effortless.  
If capture is easy, usage becomes natural. If capture has friction, people stop using the tool.

### Principle 1 — Offline first
The fastest possible runtime is local.  
ClipNote works *completely offline*.  
Sync will come later only as a backup mechanism.

### Principle 2 — Data first, Intelligence later
Our v0 must excel at storing raw information with zero friction.  
AI can come later once the data layer is solid and used frequently.

### Principle 3 — AI-ready storage
All notes must be stored with metadata that enables future agentic workflows:
- embeddings
- summarization
- linking
- OCR (future)
- screenshot context (future)
- tasks extraction

### Principle 4 — Simple Engineering
The extension must be designed so AI agents (Copilot, Cursor, etc.) can operate on it easily:
- simple folder structure  
- small modules  
- predictable data flow  
- explicit message passing  
- written internal docs  

---

## 1. User Journeys (v0 — Text Only)

### J1 — Capture selected text instantly
1. User selects text on any webpage  
2. User hits the hotkey  
3. ClipNote captures the text + source URL  
4. Saves it as a note in local storage  
5. A tiny toast appears: “Saved”

### J2 — Manual quick note (popup)
1. User opens the extension popup  
2. Can type a quick note  
3. Hit save

### J3 — View & edit notes
1. Open popup  
2. Scroll through notes  
3. Edit inline  
4. Delete any note  

### J4 — Export (optional v0)
Export all notes as JSON.

---

## 2. Hotkey Design

### Default Hotkey for v0
- Windows/Linux: `Ctrl+Shift+K`  
- macOS: `Command+Shift+K`  

Reasons:
- Not commonly used  
- Easy to remember (“K = keep note”)  
- Works across apps  
- Simple for users  

A future Settings page will let users customize hotkeys.

---

## 3. Primitives (v0)

We keep **only one active primitive**, but the schema is future-proof.

### Primitive: `note`
A single basic concept that can evolve over time.

```

type Note = {
id: string;
type: "text" | "voice" | "screenshot";  // only "text" used in v0

// --- V0 fields ---
content: string;        // main text
createdAt: number;      // timestamp
source: {
url?: string;         // optional source URL
selection?: string;   // original selected text
};

// --- Future fields (allowed but unused in v0) ---
imageData?: string;     // for screenshot notes
text?: string;          // OCR text
raw?: any;              // audio blob / extra info
};

```

### Why keep screenshot fields now?
- No migrations later  
- AI agents will naturally understand schema  
- v0 code only writes what it needs  
- The DB stays flexible but simple  

---

## 4. RxDB Data Model (v0 — Text Only)

### Database
`clipnote_db`

### Collections

#### Collection: `notes`

Schema:

```

{
"title": "ClipNote Notes Collection",
"version": 0,
"primaryKey": "id",
"type": "object",
"properties": {
"id": {
"type": "string",
"maxLength": 200
},

```
"type": {
  "type": "string",
  "enum": ["text", "voice", "screenshot"]
},

"content": { "type": "string" },
"createdAt": { "type": "number" },

"source": {
  "type": "object",
  "properties": {
    "url": { "type": "string" },
    "selection": { "type": "string" }
  }
},

// V1 screenshot/OCR fields (left nullable)
"imageData": { "type": "string" },
"text": { "type": "string" },
"raw": { "type": "object" }
```

},

"required": ["id", "type", "createdAt"]
}

```

This schema supports text now and screenshots later.

---

## 5. Extension Architecture

Minimal, modular, agent-friendly:

```

/src
/background
hotkeys.ts
messageRouter.ts

/content
textCapture.ts

/db
index.ts
notesCollection.ts

/ui
popup.html
popup.ts
styles.css

manifest.json
README.md

```

### Principles:
- Tiny modules  
- Clear message passing  
- Zero ambiguous side effects  
- Background handles capture  
- Content script handles DOM text selection  
- UI handles viewing/editing  

---

## 6. Message Passing Contract

Explicit messages for simplicity:

```

type Message =
| { type: "capture-text"; text: string; url: string }
| { type: "save-note"; note: Note }
| { type: "get-notes" }
| { type: "notes-response"; notes: Note[] };

```

Only these are needed for v0.

---

## 7. v0 Tasks

- [ ] Implement RxDB notes collection  
- [ ] Add default hotkey  
- [ ] Add content script to read selected text  
- [ ] Implement background handler for “capture-text”  
- [ ] Add toast notification  
- [ ] Build popup UI with:
  - [ ] List of notes  
  - [ ] Edit  
  - [ ] Delete  
  - [ ] Optional quick-add field  
- [ ] Export as JSON (optional)  
- [ ] Write `/docs/architecture.md`  

---

## 8. What’s intentionally NOT in v0

These are future items — *schema-ready but not implemented*:

- Screenshot capture  
- OCR  
- Audio notes  
- AI summarization  
- Embedding generation  
- Sync  
- Semantic search  
- Auto task extraction  

---

## 9. License

MIT
