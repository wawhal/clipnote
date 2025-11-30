declare module './ocrWorker' {
  import type { QueueItem } from './processingQueue';
  export function runOCR(item: QueueItem): Promise<void>;
}
