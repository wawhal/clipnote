# ClipNote Knowledge Base

A living reference for contributors and AI agents. Skim this to quickly understand how to implement, debug, and extend features.

## 🧭 Overview

- MV3 Chrome extension
- TypeScript + React (popup)
- RxDB + Dexie for offline storage
- Content scripts for page interaction (text capture, toast, screenshot overlay)
- Background service worker orchestrates capture, storage, notifications, and processing queue

## 🔌 Messaging

Message types are defined in `src/background/messages.ts`. Typical flows:

- Text capture: content → background → DB → toast
- Screenshot: background triggers overlay → content returns rect → background captures, crops, saves → queue OCR → toast
- Pagination: UI asks background `get-notes?skip&limit` → background queries RxDB and returns slice

**Hotkey handling**: Uses dual approach for reliability:
- `chrome.commands` API (manifest) - works most places but can be blocked by aggressive page JS
- Content script listener (`hotkeyListener.ts`) - captures at DOM level with `capture: true` phase, bypasses page handlers (works on Gmail, ChatGPT, etc.)

Keep messages explicit and version when changing shapes.

## 🗃️ Data model (RxDB)

`Note` supports multiple types:

- `type`: `text | voice | screenshot`
- `imageData?`: base64 screenshot
- `text?`: OCR result
- `createdAt`: timestamp
- `source`: `{ url?, selection? }`

Schema and types live in `src/db/notesCollection.ts` and `src/db/types.ts`. Query chaining uses `RxDBQueryBuilderPlugin`.

## 🖼️ Screenshot + OCR pipeline

- Background checks selection; if none, sends `start-screenshot` to active tab
- Content `screenshotOverlay.ts` draws selection rectangle, ESC cancels, ENTER confirms; posts rect + DPR + scroll offsets
- Background uses `chrome.tabs.captureVisibleTab`, crops via `OffscreenCanvas`, saves note with `imageData`
- Enqueue OCR via `enqueueProcessing({ id, step: 'OCR', retries: 2 })`
- `ocrWorker.ts` dynamically imports `tesseract.js`, recognizes text, updates note (`text`, `processedAt`)

## 🔔 Toasts

Two layers:
- Popup-local toasts (React state)
- On-page toasts via `src/content/toast.ts` listening to `{ type: 'toast', text }`

Background routes toasts to the active tab via `chrome.tabs.query({ active: true, currentWindow: true })`.

## 🛠️ Build & dev

- `npm run dev` for watch builds
- `npm run build` for production bundles
- Load `dist/` via `chrome://extensions` → Load unpacked

Common fixes:
- React TSX: use `import * as React from 'react'`
- Add `tesseract.js` to `package.json` for OCR
- If queries fail, ensure `RxDBQueryBuilderPlugin` is enabled in `src/db/index.ts`

## 📁 Key files

- Background: `src/background/index.ts`, `src/background/processingQueue.ts`, `src/background/ocrWorker.ts`
- Content: `src/content/textCapture.ts`, `src/content/toast.ts`, `src/content/screenshotOverlay.ts`
- UI: `src/ui/popup.tsx`, `src/ui/styles.css`, `src/ui/popup.html`
- DB: `src/db/index.ts`, `src/db/notesCollection.ts`, `src/db/types.ts`

## 🧪 Validation

- Type check: `npm run type-check`
- Build: `npm run build`
- Manual test checklist in `DEVELOPMENT.md`

## 🚩 Troubleshooting

- Module not found: verify file paths and that `dist/` contains built entries
- OCR failing: ensure images have sufficient contrast; check `ocrWorker.ts` and Tesseract import
- Toasts not showing on-page: make sure the content toast script is listed in `manifest.json` and the background targets the active tab

## 📌 Conventions

- Small modules, clear responsibilities
- Explicit types and message contracts
- Dynamic imports for heavy modules
- Keep docs updated when flows or schemas change
