import { existsSync, mkdirSync, readFileSync, unlinkSync } from "fs";
import { join, extname, basename } from "path";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  compressImage,
  getImageDimensions,
} from "$lib/services/image-compressor";
import { addChapterPages, getChapterPages } from "$lib/server/sqlite";

const PAGES_DIR = join(process.cwd(), "static", "uploads", "pages");

// Ensure pages directory exists
if (!existsSync(PAGES_DIR)) {
  mkdirSync(PAGES_DIR, { recursive: true });
}

// Allowed image types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params;
    const chapterId = Number(id);

    if (!chapterId || isNaN(chapterId)) {
      return json(
        { success: false, error: "Invalid chapter ID" },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const isZip = formData.get("isZip") === "true";

    if (!files || files.length === 0) {
      return json(
        { success: false, error: "No files provided" },
        { status: 400 },
      );
    }

    let pagesToUpload: { buffer: Buffer; filename: string; order: number }[] =
      [];

    if (isZip && files.length === 1) {
      // Handle ZIP file
      const zipFile = files[0];
      const zipBuffer = Buffer.from(await zipFile.arrayBuffer());

      // For now, we'll process as single images if ZIP fails
      // In production, you'd use a library like yauzl or adm-zip
      console.log(
        "ZIP upload not fully implemented yet, treating as single files",
      );
      pagesToUpload = await processAsSingleFiles(files);
    } else {
      // Process as individual image files
      pagesToUpload = await processAsSingleFiles(files);
    }

    if (pagesToUpload.length === 0) {
      return json(
        { success: false, error: "No valid images found" },
        { status: 400 },
      );
    }

    // Sort by order
    pagesToUpload.sort((a, b) => a.order - b.order);

    // Get existing page count
    const existingPages = getChapterPages(chapterId);
    let startOrder = existingPages.length + 1;

    // Upload each page
    const uploadedPages = [];
    for (const page of pagesToUpload) {
      try {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const filename = `ch${chapterId}-${timestamp}-${random}`;

        // Compress image
        const compressed = await compressImage(
          page.buffer,
          PAGES_DIR,
          filename,
          {
            quality: 85,
            format: "webp",
          },
        );

        // Add to database
        const pageData = [
          {
            url: compressed.url,
            width: compressed.width,
            height: compressed.height,
          },
        ];
        addChapterPages(chapterId, 0, pageData);

        uploadedPages.push({
          order: startOrder,
          url: compressed.url,
          width: compressed.width,
          height: compressed.height,
        });

        startOrder++;
      } catch (err) {
        console.error("Error uploading page:", err);
      }
    }

    console.log(
      `📤 Uploaded ${uploadedPages.length} pages for chapter ${chapterId}`,
    );

    return json({
      success: true,
      data: {
        pagesCount: uploadedPages.length,
        pages: uploadedPages,
      },
    });
  } catch (e) {
    console.error("Upload error:", e);
    return json(
      { success: false, error: "Upload failed: " + (e as Error).message },
      { status: 500 },
    );
  }
};

async function processAsSingleFiles(
  files: File[],
): Promise<{ buffer: Buffer; filename: string; order: number }[]> {
  const pages: { buffer: Buffer; filename: string; order: number }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.warn(`Skipping invalid file type: ${file.type}`);
      continue;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      console.warn(`Skipping too large file: ${file.name}`);
      continue;
    }

    // Extract order from filename (e.g., "01.jpg", "page_001.png")
    const filename = file.name;
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    const order = extractOrderFromFilename(nameWithoutExt) || i + 1;

    const buffer = Buffer.from(await file.arrayBuffer());

    pages.push({ buffer, filename, order });
  }

  return pages;
}

function extractOrderFromFilename(filename: string): number | null {
  // Try to extract number from filename
  const patterns = [
    /^(\d+)/, // "01_page" -> 1
    /_(\d+)$/, // "page_01" -> 1
    /-(\d+)$/, // "page-01" -> 1
    /^(\d+)-/, // "01-page" -> 1
  ];

  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}
