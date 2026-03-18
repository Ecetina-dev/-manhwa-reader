import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getChapterById, getChapterPages } from "$lib/server/sqlite";

export const GET: RequestHandler = async ({ params }) => {
  const { chapter: chapterId } = params;

  if (!chapterId || isNaN(Number(chapterId))) {
    return json(
      { success: false, error: "Invalid chapter ID" },
      { status: 400 },
    );
  }

  const chapter = getChapterById(Number(chapterId));
  const pages = getChapterPages(Number(chapterId));

  if (!chapter) {
    return json(
      { success: false, error: "Chapter not found" },
      { status: 404 },
    );
  }

  return json({
    success: true,
    data: {
      chapter: {
        id: chapter.id,
        chapter_number: chapter.chapter_number,
        title: chapter.title,
      },
      pages: pages.map((p) => ({
        id: p.id,
        url: p.url,
        width: p.width,
        height: p.height,
        order: p.page_number,
      })),
    },
  });
};
