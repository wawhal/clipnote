/**
 * Stub OCR worker
 * Intentionally minimal: logs start and completion only.
 * Actual OCR implementation intentionally removed per user request.
 */
import type { QueueItem } from './processingQueue';

export async function runOCR(item: QueueItem) {
  try {
    console.log('[ClipNote] OCR Started', { id: item.id });
    // no-op: placeholder for user-implemented OCR
    // Keep an async tick to preserve promise-based flow
    await Promise.resolve();
    console.log('[ClipNote] OCR Completed', { id: item.id });
  } catch (err) {
    console.log('[ClipNote] OCR Error (stub)', err);
  }
}
