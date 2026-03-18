import sharp from "sharp";
import { join, dirname } from "path";
import { existsSync, mkdirSync } from "fs";

export interface ImageCompressionOptions {
  quality?: number;
  width?: number;
  height?: number;
  format?: "webp" | "jpeg" | "png";
}

export interface ProcessedImage {
  path: string;
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

const DEFAULT_OPTIONS: ImageCompressionOptions = {
  quality: 80,
  format: "webp",
};

/**
 * Compress and convert images to WebP format
 * WebP provides 25-35% smaller file sizes than JPEG
 */
export async function compressImage(
  inputBuffer: Buffer,
  outputDir: string,
  filename: string,
  options: ImageCompressionOptions = {},
): Promise<ProcessedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Determine output path
  const ext =
    opts.format === "webp" ? ".webp" : opts.format === "jpeg" ? ".jpg" : ".png";
  const baseName = filename.replace(/\.[^/.]+$/, "");
  const outputPath = join(outputDir, `${baseName}${ext}`);

  // Get original image metadata
  const metadata = await sharp(inputBuffer).metadata();

  // Calculate dimensions (maintain aspect ratio if only one dimension provided)
  let width = opts.width || metadata.width || 800;
  let height = opts.height || metadata.height || undefined;

  if (opts.width && !opts.height && metadata.width && metadata.height) {
    height = Math.round((opts.width / metadata.width) * metadata.height);
  } else if (opts.height && !opts.width && metadata.width && metadata.height) {
    width = Math.round((opts.height / metadata.height) * metadata.width);
  }

  // Compress and convert
  let pipeline = sharp(inputBuffer).resize(width, height, {
    fit: "inside",
    withoutEnlargement: true,
  });

  // Apply format-specific compression
  switch (opts.format) {
    case "webp":
      pipeline = pipeline.webp({ quality: opts.quality });
      break;
    case "jpeg":
      pipeline = pipeline.jpeg({ quality: opts.quality, mozjpeg: true });
      break;
    case "png":
      pipeline = pipeline.png({ quality: opts.quality, compressionLevel: 9 });
      break;
  }

  // Get output buffer
  const outputBuffer = await pipeline.toBuffer();

  // Write to file
  const { writeFileSync } = await import("fs");
  writeFileSync(outputPath, outputBuffer);

  // Get final dimensions
  const finalMetadata = await sharp(outputBuffer).metadata();

  return {
    path: outputPath,
    url: outputPath.replace(/^.*?\/static/, "").replace(/\\/g, "/"),
    width: finalMetadata.width || width,
    height: finalMetadata.height || height || 0,
    size: outputBuffer.length,
    format: opts.format || "webp",
  };
}

/**
 * Generate thumbnail for cover images
 * Creates a smaller version for grid displays
 */
export async function generateThumbnail(
  inputBuffer: Buffer,
  outputDir: string,
  filename: string,
): Promise<ProcessedImage> {
  return compressImage(inputBuffer, outputDir, filename, {
    quality: 70,
    width: 300,
    height: 450,
    format: "webp",
  });
}

/**
 * Compress chapter page images
 * Optimized for reading quality vs file size balance
 */
export async function compressChapterPage(
  inputBuffer: Buffer,
  outputDir: string,
  filename: string,
  pageNumber: number,
): Promise<ProcessedImage> {
  // Get original dimensions first
  const metadata = await sharp(inputBuffer).metadata();

  // For chapter pages, resize to max 1600px width (good for most screens)
  // This provides good quality while keeping file size manageable
  const maxWidth = 1600;
  const width =
    metadata.width && metadata.width > maxWidth ? maxWidth : metadata.width;
  const height =
    metadata.height && metadata.width && metadata.width > maxWidth
      ? Math.round((maxWidth / metadata.width) * metadata.height)
      : metadata.height;

  return compressImage(inputBuffer, outputDir, filename, {
    quality: 85,
    width,
    height,
    format: "webp",
  });
}

/**
 * Get image dimensions without processing
 */
export async function getImageDimensions(
  buffer: Buffer,
): Promise<{ width: number; height: number }> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

/**
 * Convert any image to WebP
 */
export async function convertToWebP(
  inputBuffer: Buffer,
  outputDir: string,
  filename: string,
  quality: number = 80,
): Promise<ProcessedImage> {
  return compressImage(inputBuffer, outputDir, filename, {
    quality,
    format: "webp",
  });
}
