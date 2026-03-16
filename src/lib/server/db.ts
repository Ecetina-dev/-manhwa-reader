/**
 * Simple JSON File Database
 * Fast and reliable for a small to medium sized application
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// Database path
const DB_DIR = join(process.cwd(), '.data');
const DB_FILE = join(DB_DIR, 'database.json');

// Ensure database directory exists
function ensureDB(): void {
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }
  if (!existsSync(DB_FILE)) {
    writeFileSync(DB_FILE, JSON.stringify({ manga: {}, chapters: {}, pages: {} }, null, 2));
  }
}

// Read database
function readDB(): any {
  ensureDB();
  try {
    return JSON.parse(readFileSync(DB_FILE, 'utf-8'));
  } catch {
    return { manga: {}, chapters: {}, pages: {} };
  }
}

// Write database
function writeDB(data: any): void {
  ensureDB();
  writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Manga operations
export function getAllManga(options?: { search?: string; status?: string; limit?: number; offset?: number }): any[] {
  const db = readDB();
  let manga = Object.values(db.manga);
  
  if (options?.search) {
    const s = options.search.toLowerCase();
    manga = manga.filter((m: any) => m.title.toLowerCase().includes(s));
  }
  
  if (options?.status) {
    manga = manga.filter((m: any) => m.status === options.status);
  }
  
  // Sort by updatedAt
  manga.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
  const offset = options?.offset || 0;
  const limit = options?.limit || 50;
  
  return manga.slice(offset, offset + limit);
}

export function getMangaById(id: string): any {
  const db = readDB();
  return db.manga[id] || null;
}

export function createManga(data: any): any {
  const db = readDB();
  const id = generateId();
  const now = new Date().toISOString();
  
  const manga = {
    id,
    ...data,
    views: 0,
    rating: 0,
    ratingCount: 0,
    createdAt: now,
    updatedAt: now
  };
  
  db.manga[id] = manga;
  writeDB(db);
  
  return manga;
}

export function updateManga(id: string, updates: any): any {
  const db = readDB();
  if (!db.manga[id]) return null;
  
  db.manga[id] = {
    ...db.manga[id],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  writeDB(db);
  return db.manga[id];
}

export function deleteManga(id: string): boolean {
  const db = readDB();
  if (!db.manga[id]) return false;
  
  delete db.manga[id];
  writeDB(db);
  return true;
}

// Chapter operations
export function getChaptersByManga(mangaId: string): any[] {
  const db = readDB();
  const chapters = Object.values(db.chapters)
    .filter((c: any) => c.mangaId === mangaId)
    .sort((a: any, b: any) => parseFloat(b.number) - parseFloat(a.number));
  return chapters;
}

export function getChapterById(id: string): any {
  const db = readDB();
  return db.chapters[id] || null;
}

export function createChapter(data: any): any {
  const db = readDB();
  const id = generateId();
  const now = new Date().toISOString();
  
  const chapter = {
    id,
    ...data,
    createdAt: now
  };
  
  db.chapters[id] = chapter;
  
  // Update manga
  if (db.manga[data.mangaId]) {
    db.manga[data.mangaId].updatedAt = now;
  }
  
  writeDB(db);
  return chapter;
}

export function deleteChapter(id: string): boolean {
  const db = readDB();
  if (!db.chapters[id]) return false;
  
  delete db.chapters[id];
  writeDB(db);
  return true;
}

// Page operations
export function getChapterPages(chapterId: string): any[] {
  const db = readDB();
  return Object.values(db.pages)
    .filter((p: any) => p.chapterId === chapterId)
    .sort((a: any, b: any) => a.pageNumber - b.pageNumber);
}

export function addChapterPages(chapterId: string, mangaId: string, pages: any[]): any[] {
  const db = readDB();
  const newPages: any[] = [];
  
  for (let i = 0; i < pages.length; i++) {
    const pageId = generateId();
    const page = {
      id: pageId,
      chapterId,
      mangaId,
      pageNumber: i + 1,
      ...pages[i]
    };
    db.pages[pageId] = page;
    newPages.push(page);
  }
  
  // Update chapter page count
  if (db.chapters[chapterId]) {
    db.chapters[chapterId].pages = pages.length;
  }
  
  writeDB(db);
  return newPages;
}

// Stats
export function getStats(): any {
  const db = readDB();
  const manga = Object.values(db.manga);
  
  return {
    totalManga: manga.length,
    totalChapters: Object.keys(db.chapters).length,
    totalPages: Object.keys(db.pages).length,
    mangaByStatus: {
      ongoing: manga.filter((m: any) => m.status === 'ongoing').length,
      completed: manga.filter((m: any) => m.status === 'completed').length,
      hiatus: manga.filter((m: any) => m.status === 'hiatus').length,
      cancelled: manga.filter((m: any) => m.status === 'cancelled').length
    }
  };
}

// Seed initial data
export function seedDatabase(): void {
  const db = readDB();
  
  // If already has data, skip
  if (Object.keys(db.manga).length > 0) return;
  
  const popularManga = [
    {
      title: 'Solo Leveling',
      description: 'In a world where hunters, humans who possess magical abilities, must battle deadly monsters to protect the human race from certain annihilation, a notoriously weak hunter named Sung Jinwoo finds himself in a seemingly endless struggle for survival.',
      cover: '/uploads/covers/solo-leveling.jpg',
      status: 'completed',
      author: 'Chugong',
      artist: 'DUBU (Redice)',
      tags: ['Action', 'Adventure', 'Fantasy'],
      originalLanguage: 'ko',
      demographic: 'seinen'
    },
    {
      title: 'Tower of God',
      description: 'Tower of God follows the story of Bam, a young man who enters the mysterious Tower to find his friend Rachel.',
      cover: '/uploads/covers/tower-of-god.jpg',
      status: 'ongoing',
      author: 'SIU',
      artist: 'SIU',
      tags: ['Action', 'Adventure', 'Fantasy'],
      originalLanguage: 'ko',
      demographic: 'shonen'
    },
    {
      title: 'One Piece',
      description: 'Monkey D. Luffy sets off on an adventure with his pirate crew in hopes of finding the greatest treasure ever, known as the One Piece.',
      cover: '/uploads/covers/one-piece.jpg',
      status: 'ongoing',
      author: 'Eiichiro Oda',
      artist: 'Eiichiro Oda',
      tags: ['Action', 'Adventure', 'Comedy'],
      originalLanguage: 'ja',
      demographic: 'shonen'
    },
    {
      title: 'Naruto',
      description: 'Naruto Uzumaki, a young ninja with a demon fox sealed inside him, dreams of becoming the Hokage.',
      cover: '/uploads/covers/naruto.jpg',
      status: 'completed',
      author: 'Masashi Kishimoto',
      artist: 'Masashi Kishimoto',
      tags: ['Action', 'Adventure', 'Ninja'],
      originalLanguage: 'ja',
      demographic: 'shonen'
    },
    {
      title: 'Attack on Titan',
      description: 'In a world where humanity lives within cities surrounded by enormous walls due to the Titans.',
      cover: '/uploads/covers/attack-on-titan.jpg',
      status: 'completed',
      author: 'Hajime Isayama',
      artist: 'Hajime Isayama',
      tags: ['Action', 'Drama', 'Horror'],
      originalLanguage: 'ja',
      demographic: 'shonen'
    },
    {
      title: 'My Hero Academia',
      description: 'In a world where most people have superpowers called Quirks, Izuku Midoriya dreams of becoming a hero.',
      cover: '/uploads/covers/my-hero-academia.jpg',
      status: 'ongoing',
      author: 'Kohei Horikoshi',
      artist: 'Kohei Horikoshi',
      tags: ['Action', 'Comedy', 'School'],
      originalLanguage: 'ja',
      demographic: 'shonen'
    },
    {
      title: 'Demon Slayer',
      description: 'Tanjiro Kamado\'s peaceful life is shattered when a demon slaughters his family.',
      cover: '/uploads/covers/demon-slayer.jpg',
      status: 'completed',
      author: 'Koyoharu Gotouge',
      artist: 'Koyoharu Gotouge',
      tags: ['Action', 'Demon', 'Historical'],
      originalLanguage: 'ja',
      demographic: 'shonen'
    },
    {
      title: 'Chainsaw Man',
      description: 'Denji is a young man trapped in poverty, working off his deceased father\'s debt to the yakuza.',
      cover: '/uploads/covers/chainsaw-man.jpg',
      status: 'ongoing',
      author: 'Tatsuki Fujimoto',
      artist: 'Tatsuki Fujimoto',
      tags: ['Action', 'Dark Fantasy'],
      originalLanguage: 'ja',
      demographic: 'seinen'
    },
    {
      title: 'Jujutsu Kaisen',
      description: 'Yuji Itadori, a high school student with exceptional physical abilities, stumbles upon a cursed object.',
      cover: '/uploads/covers/jujutsu-kaisen.jpg',
      status: 'ongoing',
      author: 'Gege Akutami',
      artist: 'Gege Akutami',
      tags: ['Action', 'School', 'Supernatural'],
      originalLanguage: 'ja',
      demographic: 'shonen'
    },
    {
      title: 'One Punch Man',
      description: 'Saitama is a hero who can defeat any opponent with a single punch.',
      cover: '/uploads/covers/one-punch-man.jpg',
      status: 'ongoing',
      author: 'ONE',
      artist: 'Yusuke Murata',
      tags: ['Action', 'Comedy', 'Superhero'],
      originalLanguage: 'ja',
      demographic: 'seinen'
    },
    {
      title: 'Death Note',
      description: 'Light Yagami finds a notebook that allows him to kill anyone whose name he writes in it.',
      cover: '/uploads/covers/death-note.jpg',
      status: 'completed',
      author: 'Tsugumi Ohba',
      artist: 'Takeshi Obata',
      tags: ['Mystery', 'Psychological'],
      originalLanguage: 'ja',
      demographic: 'shonen'
    },
    {
      title: 'Bleach',
      description: 'Ichigo Kurosaki gains the powers of a Soul Reaper after accidentally absorbing the powers of the Soul Reaper Rukia.',
      cover: '/uploads/covers/bleach.jpg',
      status: 'completed',
      author: 'Tite Kubo',
      artist: 'Tite Kubo',
      tags: ['Action', 'Supernatural'],
      originalLanguage: 'ja',
      demographic: 'shonen'
    }
  ];
  
  for (const manga of popularManga) {
    createManga(manga);
  }
  
  console.log('✅ Database seeded with', popularManga.length, 'manga');
}
