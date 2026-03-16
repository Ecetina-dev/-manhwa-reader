import { existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getChapterById, addChapterPages } from '$lib/server/sqlite';
import { compressChapterPage, getImageDimensions } from '$lib/services/image-compressor';

const UPLOAD_DIR = join(process.cwd(), 'static', 'uploads', 'chapters');

// Ensure upload directory exists
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Max file size: 15MB per page
const MAX_FILE_SIZE = 15 * 1024 * 1024;

export const POST: RequestHandler = async ({ params, request }) => {
  const { id } = params;
  
  if (!id) {
    return json({ success: false, error: 'Chapter ID required' }, { status: 400 });
  }
  
  const chapterId = Number(id);
  const chapter = getChapterById(chapterId);
  
  if (!chapter) {
    return json({ success: false, error: 'Chapter not found' }, { status: 404 });
  }
  
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return json({ success: false, error: 'No files provided' }, { status: 400 });
    }
    
    // Limit max pages per upload
    const maxPages = 50;
    if (files.length > maxPages) {
      return json({ success: false, error: `Too many files. Max ${maxPages} per upload.` }, { status: 400 });
    }
    
    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return json({ success: false, error: `Invalid file type: ${file.name}. Use JPG, PNG, WebP or GIF` }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return json({ success: false, error: `File too large: ${file.name}. Max 15MB per page.` }, { status: 400 });
      }
    }
    
    const uploadedPages: Array<{ url: string; width?: number; height?: number }> = [];
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const originalName = file.name.replace(/\.[^/.]+$/, '');
      const filename = `chapter-${chapterId}-${String(i + 1).padStart(3, '0')}-${timestamp}-${random}-${originalName}`;
      
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      totalOriginalSize += buffer.length;
      
      // Compress the image
      const compressed = await compressChapterPage(buffer, UPLOAD_DIR, filename, i + 1);
      totalCompressedSize += compressed.size;
      
      // Store URL
      uploadedPages.push({ 
        url: compressed.url,
        width: compressed.width,
        height: compressed.height
      });
      
      console.log(`📄 Page ${i + 1} compressed: ${(buffer.length / 1024).toFixed(1)}KB → ${(compressed.size / 1024).toFixed(1)}KB (${Math.round((1 - compressed.size / buffer.length) * 100)}% saved)`);
    }
    
    // Add pages to database
    const mangaId = chapter.manga_id;
    const savedPages = addChapterPages(chapterId, mangaId, uploadedPages);
    
    const totalSaved = totalOriginalSize - totalCompressedSize;
    const savedPercent = Math.round((totalSaved / totalOriginalSize) * 100);
    
    console.log(`✅ Chapter ${chapterId} uploaded: ${files.length} pages`);
    console.log(`   Total: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB → ${(totalCompressedSize / 1024 / 1024).toFixed(2)}MB (${savedPercent}% saved)`);
    
    return json({
      success: true,
      data: {
        chapterId,
        pagesCount: savedPages.length,
        pages: savedPages,
        stats: {
          originalSize: totalOriginalSize,
          compressedSize: totalCompressedSize,
          savedBytes: totalSaved,
          savedPercent
        }
      }
    });
  } catch (e) {
    console.error('Upload error:', e);
    return json({ success: false, error: 'Upload failed: ' + (e as Error).message }, { status: 500 });
  }
};
