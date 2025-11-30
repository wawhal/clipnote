/**
 * Screenshot Selection Overlay
 * Injected by content script when user triggers screenshot mode.
 * Allows click-drag rectangle selection. ESC cancels. ENTER confirms.
 */

function createOverlay() {
  if (document.getElementById('clipnote-screenshot-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'clipnote-screenshot-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 999998;
    cursor: crosshair;
    background: rgba(0,0,0,0.15);
  `;

  const selection = document.createElement('div');
  selection.id = 'clipnote-selection-rect';
  selection.style.cssText = `
    position: fixed;
    border: 2px solid rgba(102,126,234,0.9);
    background: rgba(102,126,234,0.15);
    box-shadow: 0 0 0 1px rgba(102,126,234,0.6) inset;
    display: none;
    z-index: 999999;
  `;

  let startX = 0, startY = 0;
  let endX = 0, endY = 0;
  let dragging = false;

  const onMouseDown = (e: MouseEvent) => {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    selection.style.left = `${startX}px`;
    selection.style.top = `${startY}px`;
    selection.style.width = '0px';
    selection.style.height = '0px';
    selection.style.display = 'block';
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    endX = e.clientX;
    endY = e.clientY;
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const w = Math.abs(endX - startX);
    const h = Math.abs(endY - startY);
    selection.style.left = `${x}px`;
    selection.style.top = `${y}px`;
    selection.style.width = `${w}px`;
    selection.style.height = `${h}px`;
  };

  const cleanup = () => {
    overlay.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('keydown', onKeyDown);
    overlay.remove();
    selection.remove();
  };

  const confirmSelection = () => {
    const rect = selection.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    chrome.runtime.sendMessage({
      type: 'screenshot-rect',
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      devicePixelRatio: dpr,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      url: window.location.href
    });
    cleanup();
  };

  const onMouseUp = (e: MouseEvent) => {
    if (!dragging) return;
    dragging = false;
    const w = parseFloat(selection.style.width || '0');
    const h = parseFloat(selection.style.height || '0');
    if (w > 5 && h > 5) {
      confirmSelection();
    } else {
      cleanup();
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      cleanup();
    } else if (e.key === 'Enter') {
      confirmSelection();
    }
  };

  overlay.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('keydown', onKeyDown);

  document.body.appendChild(overlay);
  document.body.appendChild(selection);
}

// Listen to start-screenshot command
chrome.runtime.onMessage.addListener((message: any) => {
  if (message.type === 'start-screenshot') {
    createOverlay();
  }
});
