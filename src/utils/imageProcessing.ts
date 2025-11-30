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
  
  // Apply device pixel ratio to coordinates
  // captureVisibleTab returns image at actual pixel density
  const dpr = devicePixelRatio || 1;
  const sx = Math.max(0, Math.round(x * dpr));
  const sy = Math.max(0, Math.round(y * dpr));
  const sw = Math.round(width * dpr);
  const sh = Math.round(height * dpr);
  
  // Clamp to image bounds
  const cropWidth = Math.min(sw, imageBitmap.width - sx);
  const cropHeight = Math.min(sh, imageBitmap.height - sy);
  
  // Validate dimensions
  if (cropWidth <= 0 || cropHeight <= 0) {
    throw new Error(`Invalid crop: selection outside viewport (sx=${sx}, sy=${sy}, sw=${sw}, sh=${sh}, imgW=${imageBitmap.width}, imgH=${imageBitmap.height})`);
  }
  
  // Create canvas and crop
  const canvas = new OffscreenCanvas(cropWidth, cropHeight);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  ctx.drawImage(imageBitmap, sx, sy, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  
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
