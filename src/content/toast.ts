/**
 * On-page toast notification for ClipNote
 * Shows elegant toasts on the web page when hotkey is triggered
 */

let toastContainer: HTMLDivElement | null = null;

function getToastContainer(): HTMLDivElement {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'clipnote-toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message: string) {
  const container = getToastContainer();
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    background: #111827;
    color: #e5e7eb;
    border-radius: 10px;
    padding: 10px 14px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    font-size: 13px;
    font-weight: 500;
    pointer-events: auto;
    animation: clipnote-toast-in 0.3s ease-out;
    opacity: 0.96;
  `;
  
  const icon = document.createElement('span');
  icon.textContent = '✅';
  icon.style.cssText = 'font-size: 16px;';
  
  const text = document.createElement('span');
  text.textContent = message;
  
  toast.appendChild(icon);
  toast.appendChild(text);
  container.appendChild(toast);
  
  // Add animation keyframes if not already present
  if (!document.getElementById('clipnote-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'clipnote-toast-styles';
    style.textContent = `
      @keyframes clipnote-toast-in {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 0.96;
          transform: translateY(0);
        }
      }
      @keyframes clipnote-toast-out {
        from {
          opacity: 0.96;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-10px);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Auto-dismiss after 2.5 seconds
  setTimeout(() => {
    toast.style.animation = 'clipnote-toast-out 0.2s ease-in';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      // Clean up container if empty
      if (container.childNodes.length === 0 && container.parentNode) {
        container.parentNode.removeChild(container);
        toastContainer = null;
      }
    }, 200);
  }, 2500);
}

// Listen for toast messages from background
chrome.runtime.onMessage.addListener((message: any) => {
  if (message.type === 'toast' && message.text) {
    showToast(message.text);
  }
});
