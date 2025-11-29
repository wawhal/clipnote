# ClipNote v0 - Quick Reference

## 📋 What Was Built

A complete Chrome extension with:
- Hotkey text capture (Ctrl+Shift+K)
- Quick manual notes via popup
- Offline-first local storage (RxDB + IndexedDB)
- View, edit, delete notes
- Export to JSON

## 🗂️ Files Created

### Core Extension Files
- `manifest.json` - Chrome extension configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `webpack.config.js` - Build system

### Source Code (`src/`)
```
src/
├── background/
│   ├── index.ts          # Service worker (captures, saves)
│   └── messages.ts       # Message type definitions
├── content/
│   └── textCapture.ts    # DOM text selection
├── db/
│   ├── index.ts          # RxDB initialization
│   ├── notesCollection.ts # Database schema
│   └── types.ts          # TypeScript types
└── ui/
    ├── popup.html        # Extension popup
    ├── popup.ts          # Popup logic
    └── styles.css        # Styling
```

### Documentation
- `README.md` - Original project spec
- `SETUP.md` - Quick setup guide ⭐ START HERE
- `DEVELOPMENT.md` - Detailed dev guide
- `docs/architecture.md` - Technical architecture

## 🚀 Quick Start

```bash
# 1. Install
npm install

# 2. Build
npm run build

# 3. Load in Chrome
# Go to chrome://extensions
# Enable "Developer mode"
# Click "Load unpacked"
# Select the "dist/" folder
```

## 🎯 Key Commands

```bash
npm run build      # Production build
npm run dev        # Development with watch
npm run type-check # Check TypeScript types
npm run clean      # Remove dist folder
```

## 🔑 Hotkeys

- **Capture text**: `Ctrl+Shift+K` (Win/Linux) or `Cmd+Shift+K` (Mac)
- **Save quick note**: Type in popup → Click "Save Note"

## 🧪 Test Checklist

- [ ] `npm install` completes successfully
- [ ] `npm run build` creates `dist/` folder
- [ ] Extension loads in Chrome without errors
- [ ] Hotkey captures selected text
- [ ] Quick notes save from popup
- [ ] Notes display in popup sorted by date
- [ ] Inline editing works (click text, edit, click away)
- [ ] Delete button removes notes
- [ ] Export downloads JSON file
- [ ] Works completely offline

## 📁 Build Output (`dist/`)

After running `npm run build`:
```
dist/
├── background/
│   └── index.js
├── content/
│   └── textCapture.js
├── src/ui/
│   ├── popup.html
│   ├── popup.js
│   └── styles.css
├── icons/          # (needs real PNG files)
└── manifest.json
```

## ⚠️ What's Missing

### Required (but optional for testing):
- **Icons**: Add PNG files to `icons/` folder
  - icon16.png, icon48.png, icon128.png
  - Extension works without them (uses default)

### Not in v0 (future enhancements):
- Screenshot capture
- OCR text extraction
- Voice notes
- AI summarization
- Embeddings
- Cloud sync
- Mobile app

## 🐛 Debug Tips

**Background script console:**
- `chrome://extensions` → ClipNote → "service worker"

**Popup console:**
- Right-click extension icon → "Inspect popup"

**Check database:**
- DevTools → Application → IndexedDB → `clipnote_db`

## 📚 Data Model

```typescript
interface Note {
  id: string;              // Unique ID
  type: "text";           // Only text in v0
  content: string;        // Note text
  createdAt: number;      // Timestamp
  source: {
    url?: string;         // Source webpage
    selection?: string;   // Original selection
  };
}
```

## 🎨 Tech Stack

- TypeScript 5.3+
- RxDB 15.0+ (offline database)
- Webpack 5 (bundler)
- Chrome Extension Manifest V3
- Dexie (IndexedDB)

## 📖 Where to Go Next

1. **First time?** → Read `SETUP.md`
2. **Want to develop?** → Read `DEVELOPMENT.md`
3. **Want architecture details?** → Read `docs/architecture.md`
4. **Want to understand the vision?** → Read `README.md`

## ✅ Project Status

**v0 Complete** - All planned features implemented:
- ✅ RxDB notes collection
- ✅ Default hotkey (Ctrl+Shift+K)
- ✅ Content script for text selection
- ✅ Background handler for capture
- ✅ Toast notifications
- ✅ Popup UI with list/edit/delete
- ✅ Quick-add field
- ✅ Export as JSON
- ✅ Architecture documentation

## 🎉 You're Ready!

Run `npm install && npm run build` and load the extension!

Questions? Check the troubleshooting sections in:
- `SETUP.md`
- `DEVELOPMENT.md`
