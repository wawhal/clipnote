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
  const { x, y, width, height, devicePixelRatio, scrollX, scrollY } = params;
  
  // Fetch and create bitmap
  const response = await fetch(imageDataUrl);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);
  
  // Calculate crop region with DPR
  const dpr = devicePixelRatio || 1;
  const sx = Math.round((x + scrollX) * dpr);
  const sy = Math.round((y + scrollY) * dpr);
  const sw = Math.round(width * dpr);
  const sh = Math.round(height * dpr);
  
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
