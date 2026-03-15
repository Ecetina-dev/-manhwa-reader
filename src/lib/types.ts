export interface MangaDexManga {
  id: string;
  type: string;
  attributes: {
    title: Record<string, string>;
    description?: Record<string, string>;
    status: string;
    year?: number;
    tags: Array<{
      id: string;
      attributes: {
        name: Record<string, string>;
        group: string;
      };
    }>;
    coverFileName?: string;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: {
      fileName?: string;
      name?: string;
    };
  }>;
}

export interface MangaDexChapter {
  id: string;
  attributes: {
    chapter?: string;
    title?: string;
    volume?: string;
    pages: number;
    publishAt: string;
    translatedLanguage: string;
  };
  relationships: Array<{
    id: string;
    type: string;
  }>;
}

export interface MangaDexPage {
  url: string;
  width: number;
  height: number;
}

export interface Serie {
  id: string;
  title: string;
  cover: string;
  description: string;
  status: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  number: string;
  title: string;
  pages: number;
  publishAt: string;
}

export interface ReadingProgress {
  serieId: string;
  chapterId: string;
  page: number;
  updatedAt: number;
}
