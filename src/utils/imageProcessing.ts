/**
 * Image processing utilities
 */

export interface CropParams {
  x: number;
  y: number;
  width: number;
  height: number;
  devicePixelRatio: number;
  scrollX: number;
  scrollY: number;
}

export async function cropImage(
  imageDataUrl: string,
  params: CropParams
): Promise<string> {
  const { x, y, width, height, devicePixelRatio } = params;
  
  // Fetch and create bitmap
  const response = await fetch(imageDataUrl);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);
  
  // Calculate crop region with DPR
  // captureVisibleTab captures the visible viewport only, so coordinates are already viewport-relative
  // We don't need to add scroll offsets
  const dpr = devicePixelRatio || 1;
  const sx = Math.max(0, Math.round(x * dpr));
  const sy = Math.max(0, Math.round(y * dpr));
  const sw = Math.min(Math.round(width * dpr), imageBitmap.width - sx);
  const sh = Math.min(Math.round(height * dpr), imageBitmap.height - sy);
  
  // Validate dimensions
  if (sw <= 0 || sh <= 0) {
    throw new Error('Invalid crop dimensions: selection is outside viewport');
  }
  
  // Create offscreen canvas and crop
  const canvas = new OffscreenCanvas(sw, sh);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  ctx.drawImage(imageBitmap, sx, sy, sw, sh, 0, 0, sw, sh);
  
  // Convert to blob and data URL
  const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });
  return blobToDataURL(croppedBlob);
}

export async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
