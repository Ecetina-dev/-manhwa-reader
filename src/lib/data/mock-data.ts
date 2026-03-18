import type { Serie, Chapter } from "$lib/types";

/**
 * Mock data for fast initial load
 * This simulates what we would get from MangaDex but loads instantly
 */
export const MOCK_SERIES: Serie[] = [
  {
    id: "1",
    title: "Solo Leveling",
    cover:
      "https://uploads.mangadex.org/covers/1/85d6a5b7-6cef-4d2f-a86c-685b5a10b0c1/85d6a5b7-6cef-4d2f-a86c-685b5a10b0c1.256.jpg",
    description:
      "In a world where hunters, humans who possess magical abilities, must battle deadly monsters to protect the human race from certain annihilation, a notoriously weak hunter named Sung Jinwoo finds himself in a seemingly endless struggle for survival. One day, after narrowly surviving an overwhelmingly powerful double dungeon that nearly wipes out his entire party, a mysterious program called the System selects him as its sole player and in turn, gives him the extremely rare ability to level up in strength, possibly beyond any known limits. Jinwoo then sets out on a journey as he fights against all kinds of enemies, both man and monster.",
    status: "completed",
    chapters: [],
  },
  {
    id: "2",
    title: "Tower of God",
    cover:
      "https://uploads.mangadex.org/covers/2/f9fa52d2-9ed8-4c24-8d4a-2a2a40a0e02f/f9fa52d2-9ed8-4c24-8d4a-2a2a40a0e02f.256.jpg",
    description:
      "Tower of God follows the story of Bam, a young man who enters the mysterious Tower to find his friend Rachel. Inside the Tower, there are many floors, each with its own challenges and mysteries. Bam must overcome tests and obstacles on each floor to climb higher.",
    status: "ongoing",
    chapters: [],
  },
  {
    id: "3",
    title: "One Piece",
    cover:
      "https://uploads.mangadex.org/covers/3/fb64b507-7c3d-4daf-9b54-3117b7c86c1c/fb64b507-7c3d-4daf-9b54-3117b7c86c1c.256.jpg",
    description:
      "Monkey D. Luffy sets off on an adventure with his pirate crew in hopes of finding the greatest treasure ever, known as the One Piece. The story follows him as he makes friends and enemies along the way.",
    status: "ongoing",
    chapters: [],
  },
  {
    id: "4",
    title: "Naruto",
    cover:
      "https://uploads.mangadex.org/covers/4/6e46f7f1-3a5e-4b0f-9c7e-2e1e8e9e9e9e/6e46f7f1-3a5e-4b0f-9c7e-2e1e8e9e9e9e.256.jpg",
    description:
      "Naruto Uzumaki, a young ninja with a demon fox sealed inside him, dreams of becoming the Hokage, the leader of his village. Through hard work and determination, he grows stronger.",
    status: "completed",
    chapters: [],
  },
  {
    id: "5",
    title: "Attack on Titan",
    cover:
      "https://uploads.mangadex.org/covers/5/c28b4f1e-4e8f-4c4a-8e8e-8e8e8e8e8e8e/c28b4f1e-4e8f-4c4a-8e8e-8e8e8e8e8e8e.256.jpg",
    description:
      "In a world where humanity lives within cities surrounded by enormous walls due to the Titans, giant humanoid creatures who devour humans seemingly without reason, a young boy named Eren Yeager vows to exterminate all Titans after a tragic event.",
    status: "completed",
    chapters: [],
  },
  {
    id: "6",
    title: "My Hero Academia",
    cover:
      "https://uploads.mangadex.org/covers/6/e8e8e8e8-e8e8-e8e8-e8e8-e8e8e8e8e8e8/e8e8e8e8-e8e8-e8e8-e8e8-e8e8e8e8e8e8.256.jpg",
    description:
      "In a world where most people have superpowers called Quirks, Izuku Midoriya dreams of becoming a hero despite being born without powers.",
    status: "ongoing",
    chapters: [],
  },
  {
    id: "7",
    title: "Demon Slayer",
    cover:
      "https://uploads.mangadex.org/covers/7/7e8e8e8e-8e8e-8e8e-8e8e-8e8e8e8e8e8e/7e8e8e8e-8e8e-8e8e-8e8e-8e8e8e8e8e8.256.jpg",
    description:
      "Tanjiro Kamado's peaceful life is shattered when a demon slaughters his family and turns his sister Nezuko into a demon. He joins the Demon Slayer Corps to find a way to turn his sister back into a human.",
    status: "completed",
    chapters: [],
  },
  {
    id: "8",
    title: "Chainsaw Man",
    cover:
      "https://uploads.mangadex.org/covers/8/8e8e8e8e-8e8e-8e8e-8e8e-8e8e8e8e8e8e/8e8e8e8e-8e8e-8e8e-8e8e-8e8e8e8e8e8e.256.jpg",
    description:
      "Denji is a young man trapped in poverty, working off his deceased father's debt to the yakuza by working as a Devil Hunter with his pet devil Pochita.",
    status: "ongoing",
    chapters: [],
  },
  {
    id: "9",
    title: "Jujutsu Kaisen",
    cover:
      "https://uploads.mangadex.org/covers/9/9e8e8e8e-8e8e-8e8e-8e8e-8e8e8e8e8e8e/9e8e8e8e-8e8e-8e8e-8e8e-8e8e8e8e8e8e9.256.jpg",
    description:
      "Yuji Itadori, a high school student with exceptional physical abilities, stumbles upon a cursed object and becomes the host of a powerful curse named Sukuna.",
    status: "ongoing",
    chapters: [],
  },
  {
    id: "10",
    title: "One Punch Man",
    cover:
      "https://uploads.mangadex.org/covers/10/10e8e8e8-e8e8-e8e8-e8e8-e8e8e8e8e8e/10e8e8e8-e8e8-e8e8-e8e8-e8e8e8e8e8e10.256.jpg",
    description:
      "Saitama is a hero who can defeat any opponent with a single punch. But his incredible strength has become a burden, as he struggles to find an worthy opponent.",
    status: "ongoing",
    chapters: [],
  },
  {
    id: "11",
    title: "Death Note",
    cover:
      "https://uploads.mangadex.org/covers/11/11e8e8e8-e8e8-e8e8-e8e8-e8e8e8e8e8e/11e8e8e8-e8e8-e8e8-e8e8-e8e8e8e8e8e11.256.jpg",
    description:
      "Light Yagami finds a notebook that allows him to kill anyone whose name he writes in it. He decides to use it to create a perfect world, but is opposed by the mysterious L.",
    status: "completed",
    chapters: [],
  },
  {
    id: "12",
    title: "Bleach",
    cover:
      "https://uploads.mangadex.org/covers/12/12e8e8e8-e8e8-e8e8-e8e8-e8e8e8e8e8e/12e8e8e8-e8e8-e8e8-e8e8-e8e8e8e8e8e12.256.jpg",
    description:
      "Ichigo Kurosaki gains the powers of a Soul Reaper after accidentally absorbing the powers of the Soul Reaper Rukia.",
    status: "completed",
    chapters: [],
  },
];

/**
 * Get popular series - uses mock data for instant loading
 */
export function getPopularSeries(): Serie[] {
  return MOCK_SERIES;
}

/**
 * Get series by ID - returns mock data
 */
export function getSeriesById(id: string): Serie | undefined {
  const series = MOCK_SERIES.find((s) => s.id === id);

  if (series) {
    // Return with mock chapters
    return {
      ...series,
      chapters: generateMockChapters(id, series.title),
    };
  }

  return undefined;
}

/**
 * Generate mock chapters for a series
 */
function generateMockChapters(seriesId: string, title: string): Chapter[] {
  const chapters: Chapter[] = [];
  const chapterCount = Math.floor(Math.random() * 50) + 10; // 10-60 chapters

  for (let i = 1; i <= chapterCount; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i * 7); // One chapter per week

    chapters.push({
      id: `${seriesId}-${i}`,
      number: String(i),
      title: i % 5 === 0 ? `Special Chapter ${i}` : "",
      pages: 25 + Math.floor(Math.random() * 20),
      publishAt: date.toISOString(),
    });
  }

  return chapters;
}

/**
 * Search series - simple local search
 */
export function searchSeries(query: string): Serie[] {
  const lowerQuery = query.toLowerCase();

  return MOCK_SERIES.filter(
    (series) =>
      series.title.toLowerCase().includes(lowerQuery) ||
      series.description.toLowerCase().includes(lowerQuery),
  );
}
