import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getChapterPages, getChapterById } from "$lib/server/sqlite";

export const GET: RequestHandler = async ({ params }) => {
  const { chapter } = params;

  if (!chapter) {
    return json(
      { success: false, error: "Chapter ID required" },
      { status: 400 },
    );
  }

  // Chapter ID from URL is string, convert to number for SQLite
  const chapterData = getChapterById(Number(chapter));

  if (!chapterData) {
    return json(
      { success: false, error: "Chapter not found" },
      { status: 404 },
    );
  }

  const pages = getChapterPages(Number(chapter));

  return json({
    success: true,
    data: {
      ...chapterData,
      pages,
    },
  });
};
