# 🚀 ClipNote v0 - Build & Run Guide

## What You Have

A complete Chrome extension for capturing notes with:
- ✅ Hotkey capture (Ctrl+Shift+K)
- ✅ Quick manual notes
- ✅ Offline-first storage (RxDB)
- ✅ View, edit, delete notes
- ✅ Export to JSON
- ✅ Full TypeScript codebase
- ✅ Webpack build system

## Prerequisites

Make sure you have installed:
- **Node.js 18+** (check: `node --version`)
- **npm** (comes with Node.js)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This installs:
- RxDB (database)
- TypeScript (types)
- Webpack (bundler)
- Chrome types
- And more...

### 2. Build the Extension

```bash
npm run build
```

This creates a `dist/` folder with the compiled extension.

**Or use watch mode during development:**
```bash
npm run dev
```

### 3. Load in Chrome

1. Open Chrome
2. Go to: `chrome://extensions`
3. Turn ON "Developer mode" (top-right toggle)
4. Click "Load unpacked"
5. Navigate to your project and select the **`dist/`** folder
6. ✅ Extension loaded!

### 4. Test It Out

**Test the hotkey:**
1. Go to any webpage
2. Select some text
3. Press `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac)
4. You should see a "Note saved!" notification

**Test the popup:**
1. Click the ClipNote icon in your toolbar
2. Type a note in the text box
3. Click "Save Note"
4. Your note appears below

## File Structure

```
clipnote/
├── src/                    # Source code
│   ├── background/        # Background service worker
│   ├── content/          # Content scripts
│   ├── db/               # Database layer
│   └── ui/               # Popup interface
├── dist/                  # Built extension (created by webpack)
├── docs/                  # Documentation
├── icons/                 # Extension icons (⚠️ need to add)
├── manifest.json         # Extension configuration
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── webpack.config.js     # Build config
```

## Next Steps

### 🎨 Add Icons (Optional but Recommended)

The extension works without icons, but looks better with them:

1. Create three PNG images:
   - `icons/icon16.png` (16x16 pixels)
   - `icons/icon48.png` (48x48 pixels)
   - `icons/icon128.png` (128x128 pixels)

2. Use the 📝 emoji or "CN" text
3. Rebuild: `npm run build`

**Quick icon resources:**
- https://www.favicon-generator.org/
- https://favicon.io/emoji-favicons/
- Canva, Figma, or any image editor

### 🔍 Debugging

**View background script logs:**
1. Go to `chrome://extensions`
2. Find ClipNote
3. Click "service worker" (inspect views)
4. Console opens

**View popup logs:**
1. Right-click the ClipNote icon
2. Select "Inspect popup"
3. DevTools opens

**Check database:**
1. Open any webpage
2. Open DevTools (F12)
3. Go to Application → IndexedDB
4. Find `clipnote_db` → `notes`

### 📖 Learn More

- **`DEVELOPMENT.md`** - Detailed development guide
- **`docs/architecture.md`** - Technical architecture
- **`README.md`** - Original project specification

## Common Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Build and watch for changes
npm run dev

# Type check without building
npm run type-check

# Clean build files
npm run clean
```

## Verification Checklist

Test these features:
- [ ] Install extension successfully
- [ ] Hotkey captures selected text
- [ ] Manual notes save from popup
- [ ] Notes display in popup
- [ ] Can edit notes inline
- [ ] Can delete notes
- [ ] Export downloads JSON file
- [ ] Works offline (disable network)

## Troubleshooting

**Build fails:**
```bash
npm run clean
rm -rf node_modules
npm install
npm run build
```

**Extension won't load:**
- Make sure you selected the `dist/` folder
- Check for errors in Chrome at `chrome://extensions`
- Look for red error text

**Nothing happens when pressing hotkey:**
- Reload the webpage
- Check that text is actually selected
- Make sure no other extension uses Ctrl+Shift+K

**Popup is blank:**
- Right-click popup → Inspect
- Check console for errors
- Rebuild: `npm run build`

## You're Done! 🎉

You now have a fully functional offline-first note-taking extension.

**What's working:**
- Instant text capture
- Local storage (survives browser restart)
- Clean UI for viewing/editing
- Export functionality

**What's NOT in v0 (future):**
- Screenshots
- OCR
- Voice notes
- AI features
- Cloud sync

Happy note-taking! 📝
