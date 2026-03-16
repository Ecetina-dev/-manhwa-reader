/**
 * SQLite Database for Manga/Manhwa/Comic Reader
 * 
 * Why SQLite?
 * - Free and open source
 * - Embedded (no server needed)
 * - Fast for read-heavy workloads
 * - ACID compliant
 * - Single file, easy to backup
 * - Perfect for small to medium sites
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const DB_DIR = join(process.cwd(), '.data');
const DB_FILE = join(DB_DIR, 'manhau.db');

// Ensure database directory exists
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  -- Manga table
  CREATE TABLE IF NOT EXISTS manga (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    cover TEXT,
    status TEXT DEFAULT 'ongoing' CHECK(status IN ('ongoing', 'completed', 'hiatus', 'cancelled')),
    type TEXT DEFAULT 'manga' CHECK(type IN ('manga', 'manhwa', 'manhua', 'comic')),
    author TEXT,
    artist TEXT,
    tags TEXT,
    original_language TEXT DEFAULT 'ja',
    demographic TEXT DEFAULT 'shonen',
    views INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  
  -- Chapters table
  CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manga_id INTEGER NOT NULL,
    chapter_number TEXT NOT NULL,
    title TEXT,
    volume TEXT,
    pages INTEGER DEFAULT 0,
    publish_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE,
    UNIQUE(manga_id, chapter_number)
  );
  
  -- Chapter pages table
  CREATE TABLE IF NOT EXISTS chapter_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER NOT NULL,
    manga_id INTEGER NOT NULL,
    page_number INTEGER NOT NULL,
    url TEXT NOT NULL,
    width INTEGER DEFAULT 0,
    height INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE
  );
  
  -- Comments table
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manga_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT DEFAULT 'Anonymous',
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE
  );
  
  -- Ratings table
  CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manga_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE,
    UNIQUE(manga_id, user_id)
  );
  
  -- Favorites table
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manga_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE,
    UNIQUE(manga_id, user_id)
  );
  
  -- Reading history table
  CREATE TABLE IF NOT EXISTS reading_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manga_id INTEGER NOT NULL,
    chapter_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    page INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
  );
  
  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_manga_title ON manga(title);
  CREATE INDEX IF NOT EXISTS idx_manga_status ON manga(status);
  CREATE INDEX IF NOT EXISTS idx_manga_type ON manga(type);
  CREATE INDEX IF NOT EXISTS idx_manga_demographic ON manga(demographic);
  CREATE INDEX IF NOT EXISTS idx_manga_updated ON manga(updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_manga_created ON manga(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_manga_rating ON manga(rating DESC);
  CREATE INDEX IF NOT EXISTS idx_manga_views ON manga(views DESC);
  CREATE INDEX IF NOT EXISTS idx_chapters_manga ON chapters(manga_id);
  CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(manga_id, chapter_number DESC);
  CREATE INDEX IF NOT EXISTS idx_pages_chapter ON chapter_pages(chapter_id);
  CREATE INDEX IF NOT EXISTS idx_pages_manga ON chapter_pages(manga_id);
  CREATE INDEX IF NOT EXISTS idx_comments_manga ON comments(manga_id DESC);
  CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
  CREATE INDEX IF NOT EXISTS idx_ratings_manga ON ratings(manga_id);
  CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
  CREATE INDEX IF NOT EXISTS idx_history_user ON reading_history(user_id, created_at DESC);
  
  -- Enable WAL mode for better concurrent performance
  PRAGMA journal_mode = WAL;
  
  -- Optimize for read-heavy workload
  PRAGMA synchronous = NORMAL;
  PRAGMA cache_size = -64000; -- 64MB cache
  PRAGMA temp_store = MEMORY;
`);

console.log('✅ SQLite database initialized');

// Types
export interface Manga {
  id: number;
  title: string;
  description: string;
  cover: string;
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  type: 'manga' | 'manhwa' | 'manhua' | 'comic';
  author: string;
  artist: string;
  tags: string;
  original_language: string;
  demographic: string;
  views: number;
  rating: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: number;
  manga_id: number;
  chapter_number: string;
  title: string;
  volume: string;
  pages: number;
  publish_at: string;
  created_at: string;
}

export interface ChapterPage {
  id: number;
  chapter_id: number;
  manga_id: number;
  page_number: number;
  url: string;
  width: number;
  height: number;
  created_at: string;
}

export interface Comment {
  id: number;
  manga_id: number;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface Rating {
  id: number;
  manga_id: number;
  user_id: string;
  rating: number;
  created_at: string;
}

export interface Favorite {
  id: number;
  manga_id: number;
  user_id: string;
  created_at: string;
}

export interface ReadingHistory {
  id: number;
  manga_id: number;
  chapter_id: number;
  user_id: string;
  page: number;
  created_at: string;
}

// Helper to convert row to manga object
function rowToManga(row: any): Manga {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : []
  };
}

// ============== MANGA OPERATIONS ==============

export function getAllManga(options?: {
  search?: string;
  status?: string;
  type?: string;
  demographic?: string;
  tags?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}): Manga[] {
  let sql = 'SELECT * FROM manga WHERE 1=1';
  const params: any[] = [];
  
  if (options?.search) {
    sql += ' AND title LIKE ?';
    params.push(`%${options.search}%`);
  }
  
  if (options?.status) {
    sql += ' AND status = ?';
    params.push(options.status);
  }
  
  if (options?.type) {
    sql += ' AND type = ?';
    params.push(options.type);
  }
  
  if (options?.demographic) {
    sql += ' AND demographic = ?';
    params.push(options.demographic);
  }
  
  if (options?.tags) {
    sql += ' AND tags LIKE ?';
    params.push(`%${options.tags}%`);
  }
  
  // Sorting
  const sort = options?.sort || 'updated';
  switch (sort) {
    case 'newest':
      sql += ' ORDER BY created_at DESC';
      break;
    case 'oldest':
      sql += ' ORDER BY created_at ASC';
      break;
    case 'title':
      sql += ' ORDER BY title ASC';
      break;
    case 'rating':
      sql += ' ORDER BY rating DESC';
      break;
    case 'views':
      sql += ' ORDER BY views DESC';
      break;
    default:
      sql += ' ORDER BY updated_at DESC';
  }
  
  if (options?.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
    
    if (options?.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }
  }
  
  const stmt = db.prepare(sql);
  const rows = stmt.all(...params);
  return rows.map(rowToManga);
}

export function getMangaById(id: number): Manga | null {
  const stmt = db.prepare('SELECT * FROM manga WHERE id = ?');
  const row = stmt.get(id);
  return row ? rowToManga(row) : null;
}

export function getMangaBySlug(slug: string): Manga | null {
  const stmt = db.prepare('SELECT * FROM manga WHERE LOWER(REPLACE(title, " ", "-")) = ?');
  const row = stmt.get(slug.toLowerCase().replace(/ /g, '-'));
  return row ? rowToManga(row) : null;
}

export function createManga(data: {
  title: string;
  description?: string;
  cover?: string;
  status?: string;
  type?: string;
  author?: string;
  artist?: string;
  tags?: string[];
  original_language?: string;
  demographic?: string;
}): Manga {
  const stmt = db.prepare(`
    INSERT INTO manga (title, description, cover, status, type, author, artist, tags, original_language, demographic)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    data.title,
    data.description || '',
    data.cover || '',
    data.status || 'ongoing',
    data.type || 'manga',
    data.author || '',
    data.artist || '',
    data.tags ? JSON.stringify(data.tags) : '[]',
    data.original_language || 'ja',
    data.demographic || 'shonen'
  );
  
  return getMangaById(result.lastInsertRowid as number)!;
}

export function updateManga(id: number, data: Partial<Manga>): Manga | null {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.cover !== undefined) { fields.push('cover = ?'); values.push(data.cover); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
  if (data.author !== undefined) { fields.push('author = ?'); values.push(data.author); }
  if (data.artist !== undefined) { fields.push('artist = ?'); values.push(data.artist); }
  if (data.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(data.tags)); }
  if (data.demographic !== undefined) { fields.push('demographic = ?'); values.push(data.demographic); }
  if (data.original_language !== undefined) { fields.push('original_language = ?'); values.push(data.original_language); }
  
  if (fields.length === 0) return getMangaById(id);
  
  fields.push("updated_at = datetime('now')");
  values.push(id);
  
  const stmt = db.prepare(`UPDATE manga SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  
  return getMangaById(id);
}

export function deleteManga(id: number): boolean {
  const stmt = db.prepare('DELETE FROM manga WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// ============== CHAPTER OPERATIONS ==============

export function getChaptersByManga(mangaId: number): Chapter[] {
  const stmt = db.prepare('SELECT * FROM chapters WHERE manga_id = ? ORDER BY CAST(chapter_number AS REAL) DESC');
  return stmt.all(mangaId) as Chapter[];
}

export function getChapterCount(mangaId: number): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM chapters WHERE manga_id = ?');
  const result = stmt.get(mangaId) as { count: number };
  return result.count;
}

export function getChapterById(id: number): Chapter | null {
  const stmt = db.prepare('SELECT * FROM chapters WHERE id = ?');
  return stmt.get(id) as Chapter | null;
}

export function getChapterByNumber(mangaId: number, chapterNumber: string): Chapter | null {
  const stmt = db.prepare('SELECT * FROM chapters WHERE manga_id = ? AND chapter_number = ?');
  return stmt.get(mangaId, chapterNumber) as Chapter | null;
}

export function createChapter(data: {
  manga_id: number;
  chapter_number: string;
  title?: string;
  volume?: string;
}): Chapter {
  const stmt = db.prepare(`
    INSERT INTO chapters (manga_id, chapter_number, title, volume)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    data.manga_id,
    data.chapter_number,
    data.title || '',
    data.volume || ''
  );
  
  // Update manga timestamp
  db.prepare("UPDATE manga SET updated_at = datetime('now') WHERE id = ?").run(data.manga_id);
  
  return getChapterById(result.lastInsertRowid as number)!;
}

export function deleteChapter(id: number): boolean {
  const stmt = db.prepare('DELETE FROM chapters WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// ============== PAGE OPERATIONS ==============

export function getChapterPages(chapterId: number): ChapterPage[] {
  const stmt = db.prepare('SELECT * FROM chapter_pages WHERE chapter_id = ? ORDER BY page_number ASC');
  return stmt.all(chapterId) as ChapterPage[];
}

export function addChapterPages(chapterId: number, mangaId: number, pages: Array<{ url: string; width?: number; height?: number }>): ChapterPage[] {
  const stmt = db.prepare(`
    INSERT INTO chapter_pages (chapter_id, manga_id, page_number, url, width, height)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const insertedPages: ChapterPage[] = [];
  
  const transaction = db.transaction((pagesArray: typeof pages) => {
    for (let i = 0; i < pagesArray.length; i++) {
      const page = pagesArray[i];
      const result = stmt.run(chapterId, mangaId, i + 1, page.url, page.width || 0, page.height || 0);
      insertedPages.push({
        id: result.lastInsertRowid as number,
        chapter_id: chapterId,
        manga_id: mangaId,
        page_number: i + 1,
        url: page.url,
        width: page.width || 0,
        height: page.height || 0,
        created_at: new Date().toISOString()
      });
    }
    
    // Update chapter page count
    db.prepare('UPDATE chapters SET pages = ? WHERE id = ?').run(pagesArray.length, chapterId);
  });
  
  transaction(pages);
  return insertedPages;
}

export function deleteChapterPages(chapterId: number): boolean {
  const stmt = db.prepare('DELETE FROM chapter_pages WHERE chapter_id = ?');
  const result = stmt.run(chapterId);
  return result.changes > 0;
}

// ============== COMMENTS ==============

export function getCommentsByManga(mangaId: number): Comment[] {
  const stmt = db.prepare('SELECT * FROM comments WHERE manga_id = ? ORDER BY created_at DESC LIMIT 100');
  return stmt.all(mangaId) as Comment[];
}

export function createComment(data: {
  manga_id: number;
  user_id: string;
  user_name?: string;
  content: string;
}): Comment {
  const stmt = db.prepare(`
    INSERT INTO comments (manga_id, user_id, user_name, content)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    data.manga_id,
    data.user_id,
    data.user_name || 'Anonymous',
    data.content
  );
  
  return db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid) as Comment;
}

export function deleteComment(id: number, userId: string): boolean {
  const stmt = db.prepare('DELETE FROM comments WHERE id = ? AND user_id = ?');
  const result = stmt.run(id, userId);
  return result.changes > 0;
}

// ============== RATINGS ==============

export function getRatingByManga(mangaId: number): { average: number; count: number; userRating?: number } {
  const stats = db.prepare('SELECT AVG(rating) as average, COUNT(*) as count FROM ratings WHERE manga_id = ?').get(mangaId) as { average: number | null; count: number };
  
  return {
    average: stats.average ? Math.round(stats.average * 10) / 10 : 0,
    count: stats.count
  };
}

export function getRatingByUser(mangaId: number, userId: string): number | null {
  const result = db.prepare('SELECT rating FROM ratings WHERE manga_id = ? AND user_id = ?').get(mangaId, userId) as { rating: number } | undefined;
  return result?.rating || null;
}

export function setRating(data: {
  manga_id: number;
  user_id: string;
  rating: number;
}): { average: number; count: number } {
  // Upsert rating
  const existing = db.prepare('SELECT id FROM ratings WHERE manga_id = ? AND user_id = ?').get(data.manga_id, data.user_id);
  
  if (existing) {
    db.prepare('UPDATE ratings SET rating = ? WHERE manga_id = ? AND user_id = ?').run(data.rating, data.manga_id, data.user_id);
  } else {
    db.prepare('INSERT INTO ratings (manga_id, user_id, rating) VALUES (?, ?, ?)').run(data.manga_id, data.user_id, data.rating);
  }
  
  // Update manga's average rating
  const stats = db.prepare('SELECT AVG(rating) as average, COUNT(*) as count FROM ratings WHERE manga_id = ?').get(data.manga_id) as { average: number | null; count: number };
  db.prepare('UPDATE manga SET rating = ?, rating_count = ? WHERE id = ?').run(stats.average || 0, stats.count, data.manga_id);
  
  return {
    average: stats.average ? Math.round(stats.average * 10) / 10 : 0,
    count: stats.count
  };
}

// ============== FAVORITES ==============

export function getFavoritesByUser(userId: string): (Favorite & { manga: Manga & { chapters: any[] } })[] {
  const favorites = db.prepare('SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC').all(userId) as Favorite[];
  
  return favorites.map(fav => {
    const manga = getMangaById(fav.manga_id);
    if (!manga) return null;
    
    const chapters = getChaptersByManga(fav.manga_id);
    return { 
      ...fav, 
      manga: { 
        ...manga, 
        chapters: chapters.map(ch => ({
          id: String(ch.id),
          number: ch.chapter_number,
          title: ch.title || '',
          pages: ch.pages,
          publishAt: ch.publish_at
        }))
      } 
    };
  }).filter(f => f !== null);
}

export function isFavorite(mangaId: number, userId: string): boolean {
  const result = db.prepare('SELECT id FROM favorites WHERE manga_id = ? AND user_id = ?').get(mangaId, userId);
  return !!result;
}

export function addFavorite(mangaId: number, userId: string): boolean {
  try {
    db.prepare('INSERT OR IGNORE INTO favorites (manga_id, user_id) VALUES (?, ?)').run(mangaId, userId);
    return true;
  } catch {
    return false;
  }
}

export function removeFavorite(mangaId: number, userId: string): boolean {
  const result = db.prepare('DELETE FROM favorites WHERE manga_id = ? AND user_id = ?').run(mangaId, userId);
  return result.changes > 0;
}

// ============== READING HISTORY ==============

export function getHistoryByUser(userId: string, limit: number = 50): (ReadingHistory & { manga: Manga | null; chapter: Chapter | null })[] {
  const history = db.prepare('SELECT * FROM reading_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit) as ReadingHistory[];
  
  return history.map(h => {
    const manga = getMangaById(h.manga_id);
    const chapter = getChapterById(h.chapter_id);
    return { ...h, manga, chapter };
  });
}

export function addToHistory(data: {
  manga_id: number;
  chapter_id: number;
  user_id: string;
  page?: number;
}): ReadingHistory {
  // Remove old entry for same manga/chapter if exists
  db.prepare('DELETE FROM reading_history WHERE manga_id = ? AND chapter_id = ? AND user_id = ?').run(data.manga_id, data.chapter_id, data.user_id);
  
  const stmt = db.prepare(`
    INSERT INTO reading_history (manga_id, chapter_id, user_id, page)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(data.manga_id, data.chapter_id, data.user_id, data.page || 0);
  
  // Keep only last 100 entries per user
  db.prepare(`
    DELETE FROM reading_history 
    WHERE user_id = ? 
    AND id NOT IN (
      SELECT id FROM reading_history 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 100
    )
  `).run(data.user_id, data.user_id);
  
  return db.prepare('SELECT * FROM reading_history WHERE id = ?').get(result.lastInsertRowid) as ReadingHistory;
}

export function clearHistory(userId: string): boolean {
  const result = db.prepare('DELETE FROM reading_history WHERE user_id = ?').run(userId);
  return result.changes > 0;
}

// ============== STATS ==============

export function getStats(): {
  totalManga: number;
  totalChapters: number;
  totalPages: number;
  mangaByStatus: Record<string, number>;
} {
  const mangaCount = db.prepare('SELECT COUNT(*) as count FROM manga').get() as { count: number };
  const chapterCount = db.prepare('SELECT COUNT(*) as count FROM chapters').get() as { count: number };
  const pageCount = db.prepare('SELECT COUNT(*) as count FROM chapter_pages').get() as { count: number };
  
  const ongoing = db.prepare("SELECT COUNT(*) as count FROM manga WHERE status = 'ongoing'").get() as { count: number };
  const completed = db.prepare("SELECT COUNT(*) as count FROM manga WHERE status = 'completed'").get() as { count: number };
  const hiatus = db.prepare("SELECT COUNT(*) as count FROM manga WHERE status = 'hiatus'").get() as { count: number };
  const cancelled = db.prepare("SELECT COUNT(*) as count FROM manga WHERE status = 'cancelled'").get() as { count: number };
  
  return {
    totalManga: mangaCount.count,
    totalChapters: chapterCount.count,
    totalPages: pageCount.count,
    mangaByStatus: {
      ongoing: ongoing.count,
      completed: completed.count,
      hiatus: hiatus.count,
      cancelled: cancelled.count
    }
  };
}

// ============== SEED DATA ==============

export function seedDatabase(): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM manga').get() as { count: number };
  
  if (count.count > 0) {
    console.log('Database already has data, skipping seed');
    return;
  }
  
  const popularManga = [
    { title: 'Solo Leveling', description: 'In a world where hunters possess magical abilities...', status: 'completed', type: 'manhwa', demographic: 'shonen', author: 'Chugong', tags: ['Action', 'Adventure', 'Fantasy'] },
    { title: 'Tower of God', description: 'Tower of God follows the story of Bam...', status: 'ongoing', type: 'manhwa', demographic: 'shonen', author: 'SIU', tags: ['Action', 'Adventure', 'Fantasy'] },
    { title: 'One Piece', description: 'Monkey D. Luffy sets off on an adventure...', status: 'ongoing', type: 'manga', demographic: 'shonen', author: 'Eiichiro Oda', tags: ['Action', 'Adventure', 'Comedy'] },
    { title: 'Naruto', description: 'Naruto Uzumaki dreams of becoming the Hokage...', status: 'completed', type: 'manga', demographic: 'shonen', author: 'Masashi Kishimoto', tags: ['Action', 'Adventure', 'Ninja'] },
    { title: 'Attack on Titan', description: 'In a world where humanity lives within walls...', status: 'completed', type: 'manga', demographic: 'shonen', author: 'Hajime Isayama', tags: ['Action', 'Drama', 'Horror'] },
    { title: 'My Hero Academia', description: 'In a world where most people have superpowers...', status: 'ongoing', type: 'manga', demographic: 'shonen', author: 'Kohei Horikoshi', tags: ['Action', 'Comedy', 'School'] },
    { title: 'Demon Slayer', description: 'Tanjiro Kamado\'s peaceful life is shattered...', status: 'completed', type: 'manga', demographic: 'shonen', author: 'Koyoharu Gotouge', tags: ['Action', 'Demon', 'Historical'] },
    { title: 'Chainsaw Man', description: 'Denji is a young man trapped in poverty...', status: 'ongoing', type: 'manga', demographic: 'seinen', author: 'Tatsuki Fujimoto', tags: ['Action', 'Dark Fantasy'] },
    { title: 'Jujutsu Kaisen', description: 'Yuji Itadori stumbles upon a cursed object...', status: 'ongoing', type: 'manga', demographic: 'shonen', author: 'Gege Akutami', tags: ['Action', 'School', 'Supernatural'] },
    { title: 'One Punch Man', description: 'Saitama is a hero who can defeat any opponent...', status: 'ongoing', type: 'manga', demographic: 'shonen', author: 'ONE', tags: ['Action', 'Comedy', 'Superhero'] }
  ];
  
  const stmt = db.prepare(`
    INSERT INTO manga (title, description, status, type, demographic, author, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const manga of popularManga) {
    stmt.run(manga.title, manga.description, manga.status, manga.type, manga.demographic, manga.author, JSON.stringify(manga.tags));
  }
  
  console.log(`✅ Database seeded with ${popularManga.length} manga`);
}

// Export db for custom queries
export { db };
