/**
 * Content-side hotkey listener
 * Captures Ctrl+Shift+K at the page level with high priority,
 * bypassing page-level keyboard handlers that might block chrome.commands
 */

const HOTKEY = {
  ctrlOrCmd: true,
  shift: true,
  key: 'k'
};

// Listen at capture phase (before page handlers can block)
document.addEventListener('keydown', (e: KeyboardEvent) => {
  const matchesCtrlOrCmd = (e.ctrlKey && !e.metaKey) || (!e.ctrlKey && e.metaKey);
  
  if (
    matchesCtrlOrCmd &&
    e.shiftKey &&
    e.key.toLowerCase() === HOTKEY.key &&
    !e.altKey
  ) {
    // Prevent page from seeing this event
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    // Trigger capture
    const selectedText = window.getSelection()?.toString().trim() || '';
    
    if (selectedText) {
      chrome.runtime.sendMessage({
        type: 'capture-text',
        text: selectedText,
        url: window.location.href
      });
    } else {
      // Trigger screenshot overlay
      chrome.runtime.sendMessage({ type: 'start-screenshot-content' });
    }
  }
}, true); // capture phase = true (runs BEFORE page handlers)
