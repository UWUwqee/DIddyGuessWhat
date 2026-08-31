/**
 * Utility functions for user avatars and image processing.
 * Handles client-side scaling and compression to 500x500 Base64 JPEG.
 */

export async function resizeImageTo500x500Base64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file (PNG, JPG, WebP, etc.).'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for processing.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 500;
          canvas.height = 500;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Could not initialize canvas context.'));
          }

          // High quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Square center-crop calculation
          const sw = img.naturalWidth || img.width;
          const sh = img.naturalHeight || img.height;
          const minDim = Math.min(sw, sh);
          const sx = (sw - minDim) / 2;
          const sy = (sh - minDim) / 2;

          ctx.clearRect(0, 0, 500, 500);
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 500, 500);

          // 500x500 Base64 JPEG (Quality 0.85 ensures crisp detail with ~30KB-50KB size for Firebase free tier)
          const base64Data = canvas.toDataURL('image/jpeg', 0.85);
          resolve(base64Data);
        } catch (err) {
          reject(err);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function isImageAvatar(avatar?: string | null): boolean {
  if (!avatar) return false;
  return (
    avatar.startsWith('data:image/') ||
    avatar.startsWith('http://') ||
    avatar.startsWith('https://') ||
    avatar.startsWith('blob:')
  );
}
