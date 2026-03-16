import { existsSync, mkdirSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { compressImage, generateThumbnail, getImageDimensions } from '$lib/services/image-compressor';

const UPLOAD_DIR = join(process.cwd(), 'static', 'uploads', 'covers');
const THUMBNAIL_DIR = join(process.cwd(), 'static', 'uploads', 'covers', 'thumbnails');

// Ensure upload directories exist
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!existsSync(THUMBNAIL_DIR)) {
  mkdirSync(THUMBNAIL_DIR, { recursive: true });
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string || 'cover';
    
    if (!file || file.size === 0) {
      return json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return json({ success: false, error: 'Invalid file type. Use JPG, PNG, WebP or GIF' }, { status: 400 });
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return json({ success: false, error: 'File too large. Max 10MB allowed.' }, { status: 400 });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const filename = `${timestamp}-${random}-${originalName}`;
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Get original dimensions
    const originalDimensions = await getImageDimensions(buffer);
    const originalSize = buffer.length;
    
    // Compress the image
    const compressed = await compressImage(buffer, UPLOAD_DIR, filename, {
      quality: 85,
      width: type === 'cover' ? 600 : undefined,
      format: 'webp'
    });
    
    // Generate thumbnail
    const thumbnail = await generateThumbnail(buffer, THUMBNAIL_DIR, filename);
    
    // Calculate compression stats
    const savedBytes = originalSize - compressed.size;
    const savedPercent = Math.round((savedBytes / originalSize) * 100);
    
    console.log(`📸 Image compressed: ${originalName}`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB → Compressed: ${(compressed.size / 1024).toFixed(1)}KB`);
    console.log(`   Saved: ${savedPercent}% (${(savedBytes / 1024).toFixed(1)}KB)`);
    console.log(`   Dimensions: ${originalDimensions.width}x${originalDimensions.height} → ${compressed.width}x${compressed.height}`);
    
    return json({
      success: true,
      data: {
        url: compressed.url,
        thumbnailUrl: thumbnail.url,
        width: compressed.width,
        height: compressed.height,
        size: compressed.size,
        originalSize,
        savedBytes,
        savedPercent
      }
    });
  } catch (e) {
    console.error('Upload error:', e);
    return json({ success: false, error: 'Upload failed: ' + (e as Error).message }, { status: 500 });
  }
};
