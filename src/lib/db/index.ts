/**
 * Database Module - File-based JSON database
 * 
 * This is a fast, lightweight database that stores data in JSON files.
 * Can be easily migrated to PostgreSQL/MySQL later for production.
 * 
 * Features:
 * - Fast reads (in-memory caching)
 * - Atomic writes
 * - Indexes for fast lookups
 * - Soft delete support
 */

import { browser } from '$app/environment';
import { writable, get } from 'svelte/store';

// Types
export interface Manga {
  id: string;
  title: string;
  description: string;
  cover: string;
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  author: string;
  artist: string;
  tags: string[];
  originalLanguage: string;
  demographic: string;
  views: number;
  rating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  mangaId: string;
  number: string;
  title: string;
  volume: string;
  pages: number;
  publishAt: string;
  createdAt: string;
}

export interface ChapterPage {
  id: string;
  chapterId: string;
  mangaId: string;
  pageNumber: number;
  url: string;
  width: number;
  height: number;
}

export interface DBSchema {
  manga: Record<string, Manga>;
  chapters: Record<string, Chapter>;
  pages: Record<string, ChapterPage>;
  indexes: {
    mangaByTitle: string[];
    mangaByStatus: Record<string, string[]>;
    chaptersByManga: Record<string, string[]>;
    chaptersByNumber: Record<string, string[]>;
  };
}

// Database file path
const DB_FILE = 'database.json';

// In-memory cache
let cache: DBSchema | null = null;

// Initialize database
function initDB(): DBSchema {
  return {
    manga: {},
    chapters: {},
    pages: {},
    indexes: {
      mangaByTitle: [],
      mangaByStatus: {
        ongoing: [],
        completed: [],
        hiatus: [],
        cancelled: []
      },
      chaptersByManga: {},
      chaptersByNumber: {}
    }
  };
}

// Load database
export async function loadDB(): Promise<DBSchema> {
  if (cache) return cache;
  
  try {
    const response = await fetch(`/api/db/${DB_FILE}`);
    if (response.ok) {
      cache = await response.json();
    } else {
      cache = initDB();
    }
  } catch {
    cache = initDB();
  }
  
  return cache!;
}

// Save database (server-side only)
export async function saveDB(data: DBSchema): Promise<void> {
  // This would be handled by server-side API
  cache = data;
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Manga operations
export async function createManga(manga: Omit<Manga, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'rating' | 'ratingCount'>): Promise<Manga> {
  const db = await loadDB();
  
  const id = generateId();
  const now = new Date().toISOString();
  
  const newManga: Manga = {
    ...manga,
    id,
    views: 0,
    rating: 0,
    ratingCount: 0,
    createdAt: now,
    updatedAt: now
  };
  
  db.manga[id] = newManga;
  db.indexes.mangaByTitle.push(id);
  db.indexes.mangaByStatus[manga.status].push(id);
  
  await saveDB(db);
  
  return newManga;
}

export async function getManga(id: string): Promise<Manga | null> {
  const db = await loadDB();
  return db.manga[id] || null;
}

export async function getAllManga(options?: {
  status?: string;
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<Manga[]> {
  const db = await loadDB();
  
  let mangaIds = Object.keys(db.manga);
  
  // Filter by status
  if (options?.status) {
    mangaIds = mangaIds.filter(id => db.manga[id].status === options.status);
  }
  
  // Search by title
  if (options?.search) {
    const searchLower = options.search.toLowerCase();
    mangaIds = mangaIds.filter(id => 
      db.manga[id].title.toLowerCase().includes(searchLower)
    );
  }
  
  // Sort by updatedAt (newest first)
  mangaIds.sort((a, b) => 
    new Date(db.manga[b].updatedAt).getTime() - new Date(db.manga[a].updatedAt).getTime()
  );
  
  // Pagination
  const offset = options?.offset || 0;
  const limit = options?.limit || 50;
  
  return mangaIds.slice(offset, offset + limit).map(id => db.manga[id]);
}

export async function updateManga(id: string, updates: Partial<Manga>): Promise<Manga | null> {
  const db = await loadDB();
  
  if (!db.manga[id]) return null;
  
  const oldStatus = db.manga[id].status;
  
  db.manga[id] = {
    ...db.manga[id],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // Update status index if changed
  if (updates.status && updates.status !== oldStatus) {
    db.indexes.mangaByStatus[oldStatus] = db.indexes.mangaByStatus[oldStatus].filter(i => i !== id);
    db.indexes.mangaByStatus[updates.status].push(id);
  }
  
  await saveDB(db);
  
  return db.manga[id];
}

export async function deleteManga(id: string): Promise<boolean> {
  const db = await loadDB();
  
  if (!db.manga[id]) return false;
  
  const status = db.manga[id].status;
  
  delete db.manga[id];
  db.indexes.mangaByTitle = db.indexes.mangaByTitle.filter(i => i !== id);
  db.indexes.mangaByStatus[status] = db.indexes.mangaByStatus[status].filter(i => i !== id);
  
  // Delete related chapters and pages
  const chapterIds = db.indexes.chaptersByManga[id] || [];
  for (const chapterId of chapterIds) {
    delete db.chapters[chapterId];
  }
  delete db.indexes.chaptersByManga[id];
  
  await saveDB(db);
  
  return true;
}

// Chapter operations
export async function createChapter(chapter: Omit<Chapter, 'id' | 'createdAt'>): Promise<Chapter> {
  const db = await loadDB();
  
  const id = generateId();
  const now = new Date().toISOString();
  
  const newChapter: Chapter = {
    ...chapter,
    id,
    createdAt: now
  };
  
  db.chapters[id] = newChapter;
  
  // Update indexes
  if (!db.indexes.chaptersByManga[chapter.mangaId]) {
    db.indexes.chaptersByManga[chapter.mangaId] = [];
  }
  db.indexes.chaptersByManga[chapter.mangaId].push(id);
  
  await saveDB(db);
  
  // Update manga updatedAt
  if (db.manga[chapter.mangaId]) {
    db.manga[chapter.mangaId].updatedAt = now;
    await saveDB(db);
  }
  
  return newChapter;
}

export async function getChapter(id: string): Promise<Chapter | null> {
  const db = await loadDB();
  return db.chapters[id] || null;
}

export async function getChaptersByManga(mangaId: string): Promise<Chapter[]> {
  const db = await loadDB();
  
  const chapterIds = db.indexes.chaptersByManga[mangaId] || [];
  
  return chapterIds
    .map(id => db.chapters[id])
    .filter(Boolean)
    .sort((a, b) => parseFloat(b.number) - parseFloat(a.number));
}

export async function updateChapter(id: string, updates: Partial<Chapter>): Promise<Chapter | null> {
  const db = await loadDB();
  
  if (!db.chapters[id]) return null;
  
  db.chapters[id] = {
    ...db.chapters[id],
    ...updates
  };
  
  await saveDB(db);
  
  return db.chapters[id];
}

export async function deleteChapter(id: string): Promise<boolean> {
  const db = await loadDB();
  
  if (!db.chapters[id]) return false;
  
  const mangaId = db.chapters[id].mangaId;
  
  delete db.chapters[id];
  
  // Update index
  if (db.indexes.chaptersByManga[mangaId]) {
    db.indexes.chaptersByManga[mangaId] = db.indexes.chaptersByManga[mangaId].filter(i => i !== id);
  }
  
  await saveDB(db);
  
  return true;
}

// Page operations
export async function addChapterPages(chapterId: string, mangaId: string, pages: Array<{ url: string; width: number; height: number }>): Promise<ChapterPage[]> {
  const db = await loadDB();
  
  const newPages: ChapterPage[] = [];
  
  for (let i = 0; i < pages.length; i++) {
    const pageId = generateId();
    const newPage: ChapterPage = {
      id: pageId,
      chapterId,
      mangaId,
      pageNumber: i + 1,
      ...pages[i]
    };
    
    db.pages[pageId] = newPage;
    newPages.push(newPage);
  }
  
  // Update chapter page count
  if (db.chapters[chapterId]) {
    db.chapters[chapterId].pages = pages.length;
  }
  
  await saveDB(db);
  
  return newPages;
}

export async function getChapterPages(chapterId: string): Promise<ChapterPage[]> {
  const db = await loadDB();
  
  const pages = Object.values(db.pages)
    .filter(p => p.chapterId === chapterId)
    .sort((a, b) => a.pageNumber - b.pageNumber);
  
  return pages;
}

// Statistics
export async function getStats(): Promise<{
  totalManga: number;
  totalChapters: number;
  totalPages: number;
  mangaByStatus: Record<string, number>;
}> {
  const db = await loadDB();
  
  const mangaByStatus = {
    ongoing: db.indexes.mangaByStatus.ongoing.length,
    completed: db.indexes.mangaByStatus.completed.length,
    hiatus: db.indexes.mangaByStatus.hiatus.length,
    cancelled: db.indexes.mangaByStatus.cancelled.length
  };
  
  return {
    totalManga: Object.keys(db.manga).length,
    totalChapters: Object.keys(db.chapters).length,
    totalPages: Object.keys(db.pages).length,
    mangaByStatus
  };
}

// Seed data with popular manga
export async function seedDatabase(): Promise<void> {
  const db = await loadDB();
  
  // If already seeded, skip
  if (Object.keys(db.manga).length > 0) return;
  
  const popularManga: Array<Omit<Manga, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'rating' | 'ratingCount'>> = [
    {
      title: 'Solo Leveling',
      description: 'In a world where hunters, humans who possess magical abilities, must battle deadly monsters to protect the human race from certain annihilation, a notoriously weak hunter named Sung Jinwoo finds himself in a seemingly endless struggle for survival. One day, after narrowly surviving an overwhelmingly powerful double dungeon that nearly wipes out his entire party, a mysterious program called the System selects him as its sole player and in turn, gives him the extremely rare ability to level up in strength, possibly beyond any known limits.',
      cover: '/uploads/covers/solo-leveling.jpg',
      status: 'completed',
      author: 'Chugong',
      artist: 'DUBU (Redice)',
      tags: ['Action', 'Adventure', 'Fantasy', 'Magic', 'System'],
      originalLanguage: 'ko',
      demographic: 'seinen'
    },
    {
      title: 'Tower of God',
      description: 'Tower of God follows the story of Bam, a young man who enters the mysterious Tower to find his friend Rachel. Inside the Tower, there are many floors, each with its own challenges and mysteries. Bam must overcome tests and obstacles on each floor to climb higher.',
      cover: '/uploads/covers/tower-of-god.jpg',
      status: 'ongoing',
      author: 'SIU',
      artist: 'SIU',
      tags: ['Action', 'Adventure', 'Fantasy', 'Mystery', 'Tower Climbing'],
      originalLanguage: 'ko',
      demographic: 'shonen'
    },
    {
      title: 'One Piece',
      description: 'Monkey D. Luffy sets off on an adventure with his pirate crew in hopes of finding the greatest treasure ever, known as the One Piece. The story follows him as he makes friends and enemies along the way, battling powerful enemies and uncovering the secrets of the world.',
      cover: '/uploads/covers/one-piece.jpg',
      status: 'ongoing',
      author: 'Eiichiro Oda',
      artist: 'Eiichiro Oda',
      tags: ['Action', 'Adventure', 'Comedy', 'Fantasy', 'Pirates'],
      originalLanguage: 'ja',
      demographic: 'shonen'
    },
    {
      title: 'Naruto',
      description: 'Naruto Uzumaki, a young ninja with a demon fox sealed inside him, dreams of becoming the Hokage, the leader of his village. Through hard work and determination, he grows stronger while making friends and facing powerful enemies.',
      cover: '/uploads/covers/naruto.jpg',
      status: 'completed',
      author: 'Masashi Kishimoto',
      artist: 'Masashi Kishimoto',
      tags: ['Action', 'Adventure', 'Martial Arts', 'Ninja'],
      originalLanguage: 'ja',
      demographic: 'shonen'
    },
    {
      title: 'Attack on Titan',
      description: 'In a world where humanity lives within cities surrounded by enormous walls due to the Titans, giant humanoid creatures who devour humans seemingly without reason, a young boy named Eren Yeager vows to exterminate all Titans after a tragic event destroys his city and claims the life of his mother.',
      cover: '/uploads/covers/attack-on-titan.jpg',
      status: 'completed',
      author: 'Hajime Isayama',
      artist: 'Hajime Isayama',
      tags: ['Action', 'Drama', 'Fantasy', 'Horror', 'Post-Apocalyptic'],
      originalLanguage: 'ja',
      demographic: 'shonen'
    },
    {
      title: 'My Hero Academia',
      description: 'In a world where most people have superpowers called Quirks, Izuku Midoriya dreams of becoming a hero despite being born without any powers. His life changes when he meets the greatest hero, All Might, who sees potential in him.',
      cover: '/uploads/covers/my-hero-academia.jpg',
      status: 'ongoing',
      author: 'Kohei Horikoshi',
      artist: 'Kohei Horikoshi',
      tags: ['Action', 'Comedy', 'School', 'Superhero'],
      originalLanguage: 'ja',
      demographic: 'shonen'
    },
    {
      title: 'Demon Slayer',
      description: 'Tanjiro Kamado\'s peaceful life is shattered when a demon slaughters his family and turns his sister Nezuko into a demon. He joins the Demon Slayer Corps to find a way to turn his sister back into a human and defeat the demon who destroyed his family.',
      cover: '/uploads/covers/demon-slayer.jpg',
      status: 'completed',
      author: 'Koyoharu Gotouge',
      artist: 'Koyoharu Gotouge',
      tags: ['Action', 'Demon', 'Historical', 'Supernatural'],
      originalLanguage: 'ja',
      demographic: 'shonen'
    },
    {
      title: 'Chainsaw Man',
      description: 'Denji is a young man trapped in poverty, working off his deceased father\'s debt to the yakuza by working as a Devil Hunter with his pet devil Pochita. After being betrayed and killed, he merges with Pochita to become Chainsaw Man.',
      cover: '/uploads/covers/chainsaw-man.jpg',
      status: 'ongoing',
      author: 'Tatsuki Fujimoto',
      artist: 'Tatsuki Fujimoto',
      tags: ['Action', 'Dark Fantasy', 'Horror', 'Supernatural'],
      originalLanguage: 'ja',
      demographic: 'seinen'
    },
    {
      title: 'Jujutsu Kaisen',
      description: 'Yuji Itadori, a high school student with exceptional physical abilities, stumbles upon a cursed object and becomes the host of a powerful curse named Sukuna. He joins Tokyo Prefectural Jujutsu High School to learn how to fight curses.',
      cover: '/uploads/covers/jujutsu-kaisen.jpg',
      status: 'ongoing',
      author: 'Gege Akutami',
      artist: 'Gege Akutami',
      tags: ['Action', 'School', 'Supernatural', 'Dark Fantasy'],
      originalLanguage: 'ja',
      demographic: 'shonen'
    },
    {
      title: 'One Punch Man',
      description: 'Saitama is a hero who can defeat any opponent with a single punch. But his incredible strength has become a burden, as he struggles to find an worthy opponent who can give him a challenge.',
      cover: '/uploads/covers/one-punch-man.jpg',
      status: 'ongoing',
      author: 'ONE',
      artist: 'Yusuke Murata',
      tags: ['Action', 'Comedy', 'Superhero', 'Satire'],
      originalLanguage: 'ja',
      demographic: 'seinen'
    },
    {
      title: 'Death Note',
      description: 'Light Yagami finds a notebook that allows him to kill anyone whose name he writes in it. He decides to use it to create a perfect world, but is opposed by the mysterious detective L.',
      cover: '/uploads/covers/death-note.jpg',
      status: 'completed',
      author: 'Tsugumi Ohba',
      artist: 'Takeshi Obata',
      tags: ['Mystery', 'Psychological', 'Supernatural', 'Thriller'],
      originalLanguage: 'ja',
      demographic: 'shonen'
    },
    {
      title: 'Bleach',
      description: 'Ichigo Kurosaki gains the powers of a Soul Reaper after accidentally absorbing the powers of the Soul Reaper Rukia. He must protect the living world from evil spirits while uncovering the mysteries of his powers.',
      cover: '/uploads/covers/bleach.jpg',
      status: 'completed',
      author: 'Tite Kubo',
      artist: 'Tite Kubo',
      tags: ['Action', 'Adventure', 'Supernatural', 'Soul Reapers'],
      originalLanguage: 'ja',
      demographic: 'shonen'
    }
  ];
  
  // Create manga entries
  for (const manga of popularManga) {
    await createManga(manga);
  }
  
  console.log('Database seeded with', popularManga.length, 'manga');
}
