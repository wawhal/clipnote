/**
 * Processing Queue for post-save tasks (OCR, AI, sync)
 * In-memory with optional persistence in chrome.storage.
 */

export type QueueStep = 'OCR' | 'AI_SUMMARY' | 'EMBEDDING' | 'SYNC';
export interface QueueItem {
  id: string; // note id
  step: QueueStep;
  retries: number;
}

// OCR worker will be loaded dynamically to keep background light

const queue: QueueItem[] = [];
let running = false;

export function enqueueProcessing(item: QueueItem) {
  queue.push(item);
  runNext();
}

async function runNext() {
  if (running) return;
  const next = queue.shift();
  if (!next) return;
  running = true;
  try {
    if (next.step === 'OCR') {
      // @ts-ignore - dynamic import of local module without type declaration
      const mod = await import('./ocrWorker');
      await mod.runOCR(next);
    }
    // Future steps can be added here
  } catch (err) {
    console.error('Queue step failed', next, err);
    if (next.retries > 0) {
      next.retries -= 1;
      queue.push(next);
    }
  } finally {
    running = false;
    // Continue processing
    runNext();
  }
}
