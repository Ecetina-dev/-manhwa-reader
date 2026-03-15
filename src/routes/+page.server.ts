import { getMangaList, searchManga } from '$lib/mangadex';
  
export const load = async ({ url }) => {
  const query = url.searchParams.get('q') || '';
  
  let series;
  if (query) {
    series = await searchManga(query);
  } else {
    series = await getMangaList(0, 20);
  }
  
  return { 
    series,
    searchQuery: query
  };
};
