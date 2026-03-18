import type { PageServerLoad } from "./$types";
import {
  getChapterById,
  getChapterPages,
  getMangaById,
  getChaptersByManga,
} from "$lib/server/sqlite";

export const load: PageServerLoad = async ({ params }) => {
  const { id, chapter } = params;

  if (!id || !chapter) {
    return {
      chapter: null,
      pages: [],
      manga: null,
      chapters: [],
      mangaType: "manga",
    };
  }

  const mangaId = Number(id);
  const chapterId = Number(chapter);

  const manga = getMangaById(mangaId);
  const chapterData = getChapterById(chapterId);
  const allChapters = getChaptersByManga(mangaId);

  if (!chapterData || !manga) {
    return {
      chapter: null,
      pages: [],
      manga: null,
      chapters: [],
      mangaType: "manga",
    };
  }

  const pages = getChapterPages(chapterId);

  // Determine reading direction based on manga type
  const mangaType = manga.type || "manga";

  return {
    manga,
    mangaType,
    chapter: {
      id: chapterData.id,
      chapter_number: chapterData.chapter_number,
      title: chapterData.title,
      pages: chapterData.pages,
    },
    pages: pages.map((p) => ({
      url: p.url,
      width: p.width,
      height: p.height,
    })),
    chapters: allChapters.map((ch) => ({
      id: String(ch.id),
      number: ch.chapter_number,
      title: ch.title || "",
    })),
  };
};
