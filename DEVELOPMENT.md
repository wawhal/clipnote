# ClipNote - Development Guide

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Chrome/Chromium browser

### Installation

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Or run in development mode with watch
npm run dev
```

### Loading in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist/` folder from this project
5. The extension should now appear in your toolbar

### Usage

**Capture text from any webpage:**
1. Select text on any webpage
2. Press `Ctrl+Shift+K` (Windows/Linux) or `Command+Shift+K` (Mac)
3. Text is instantly saved with the source URL

**Quick manual notes:**
1. Click the ClipNote extension icon
2. Type your note in the text area
3. Click "Save Note"

**View and manage notes:**
1. Click the ClipNote extension icon
2. View all your notes sorted by date
3. Edit inline by clicking on any note
4. Delete notes with the trash icon

**Export notes:**
1. Open the popup
2. Click "Export JSON"
3. Downloads all notes as a JSON file

## Development Scripts

```bash
# Build for production
npm run build

# Build and watch for changes
npm run dev

# Type checking without building
npm run type-check

# Clean build artifacts
npm run clean
```

## Project Structure

```
/src
  /background       # Service worker (handles capture logic)
  /content         # Content scripts (DOM text selection)
  /db              # RxDB database layer
  /ui              # Popup interface
/docs              # Architecture documentation
/icons             # Extension icons (you need to add these)
```

## Troubleshooting

### Extension won't load
- Make sure you ran `npm run build` first
- Check that you're selecting the `dist/` folder, not the root
- Look for errors in `chrome://extensions`

### Hotkey doesn't work
- Make sure no other extension is using `Ctrl+Shift+K`
- Try reloading the extension
- Check the service worker console for errors

### Notes aren't saving
- Open the service worker console from `chrome://extensions`
- Check for RxDB initialization errors
- Verify IndexedDB is enabled in your browser

### TypeScript errors
- Run `npm install` to ensure all types are installed
- Check `tsconfig.json` for correct configuration
- The Chrome types should be in `@types/chrome`

## Adding Icons

The extension needs icons to display properly:

1. Create three PNG files in the `icons/` directory:
   - `icon16.png` (16x16)
   - `icon48.png` (48x48)
   - `icon128.png` (128x128)

2. You can use any graphics tool or online icon generator
3. Rebuild: `npm run build`

## Next Steps

- Read `docs/architecture.md` for detailed technical overview
- Check the main `README.md` for v0 feature list
- Look at v0 tasks for future enhancements

## Testing Checklist

Before considering v0 complete, test:
- [ ] Hotkey captures selected text
- [ ] Quick note saves from popup
- [ ] Notes display in correct order (newest first)
- [ ] Inline editing saves changes
- [ ] Delete removes notes
- [ ] Export downloads valid JSON
- [ ] Works offline (disable network in DevTools)
- [ ] Source URLs are clickable and open correctly

## Common Issues

**RxDB initialization fails:**
- Clear IndexedDB: DevTools → Application → Storage → Clear site data
- Restart browser
- Rebuild extension

**Popup doesn't open:**
- Check popup.html path in manifest.json
- Verify webpack copied all UI files to dist/
- Look for console errors in popup DevTools (right-click popup → Inspect)

**Content script not running:**
- Check manifest.json content_scripts configuration
- Reload the webpage after installing extension
- Verify matches pattern includes the site

## Contributing

This is an AI-agent-friendly codebase:
- Small, focused modules
- Explicit message passing
- Clear separation of concerns
- Well-documented architecture

Make changes and rebuild with `npm run dev` for instant feedback.

## License

MIT
