import 'server-only';
import sharp from 'sharp';
import { AppError } from '../auth';
export async function validateImage(bytes: Uint8Array) {
  try {
    const image = sharp(bytes, { limitInputPixels: 20_000_000, failOn: 'error' });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || (metadata.pages ?? 1) > 1) {
      throw new Error('Invalid or animated image');
    }
    // Decode the pixels as well as the header to reject truncated/spoofed images.
    await image.resize(1, 1, { fit: 'inside' }).toBuffer();
  } catch {
    throw new AppError(
      'This image cannot be read. Use a valid, still PNG, JPEG, or WebP under 20 megapixels.',
    );
  }
}
