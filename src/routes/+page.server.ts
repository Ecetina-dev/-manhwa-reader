import type { PageServerLoad } from "./$types";
import { getAllManga, getChapterCount, seedDatabase } from "$lib/server/sqlite";

seedDatabase();

export const load: PageServerLoad = async ({ url }) => {
  const query = url.searchParams.get("q") || "";

  const manga = getAllManga({
    search: query || undefined,
    limit: 50,
  });

  const series = manga.map((m) => {
    const chapterCount = getChapterCount(m.id);
    return {
      id: String(m.id),
      title: m.title,
      cover: m.cover || "",
      description: m.description || "",
      status: m.status,
      type: m.type,
      chapters: Array(chapterCount)
        .fill(null)
        .map((_, i) => ({
          id: String(i + 1),
          number: String(i + 1),
        })),
    };
  });

  return {
    series,
    searchQuery: query,
  };
};
