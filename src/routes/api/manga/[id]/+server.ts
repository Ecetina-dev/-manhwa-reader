import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getMangaById, getChaptersByManga } from "$lib/server/sqlite";

export const GET: RequestHandler = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return json(
      { success: false, error: "Manga ID required" },
      { status: 400 },
    );
  }

  const manga = getMangaById(Number(id));

  if (!manga) {
    return json({ success: false, error: "Manga not found" }, { status: 404 });
  }

  // Get chapters
  const chapters = getChaptersByManga(Number(id));

  return json({
    success: true,
    data: {
      ...manga,
      chapters,
    },
  });
};
