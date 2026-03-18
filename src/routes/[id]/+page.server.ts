import type { PageServerLoad } from "./$types";
import { getMangaById, getChaptersByManga } from "$lib/server/sqlite";

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params;

  // Get manga from SQLite (id is string from URL, convert to number)
  const manga = getMangaById(Number(id));

  if (!manga) {
    return { manga: null };
  }

  // Get chapters for this manga
  const chapters = getChaptersByManga(Number(id));

  // Convert to Serie format
  const serie = {
    id: String(manga.id),
    title: manga.title,
    cover: manga.cover || "",
    description: manga.description || "",
    status: manga.status,
    type: manga.type,
    author: manga.author,
    artist: manga.artist,
    tags: manga.tags,
    chapters: chapters.map((ch) => ({
      id: String(ch.id),
      number: ch.chapter_number,
      title: ch.title || "",
      pages: ch.pages,
      publishAt: ch.publish_at,
    })),
  };

  return { manga: serie };
};
